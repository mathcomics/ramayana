// Import the artist's drawn body parts (data/parts/<id>.svg) into
// data/parts.json, the model the renderer places on the skeleton
// (src/parts.js). Curves are kept exactly; only moved, rotated, mirrored.
//
//   node tools/import-parts.mjs        -> data/parts.json
//
// The file (100 px = 1 head-unit) is in the renderer's frame: the figure
// faces right, front-view limbs are its near side (picture-right). Parts
// are drawn at rotation 0 (limbs straight down, neck up, feet flat), and
// parts that share a joint sit on the same anchor (tools/export-parts.mjs
// writes it that way). By layer and label:
//   front       torso, neck, upper-arm, forearm, hand-fist, hand-out,
//               hand-in, hand-point (missing hands fall back), thigh,
//               shin, foot
//   side        torso, upper-arm, forearm, hand-*, thigh, shin, foot
//               (each limb optional: else the front one is used)
//   front-bend  torso (bent forward, seen from the front)
//   side-bend   torso (bent forward, seen from the side)
//   anchors     circles: shoulder, elbow, wrist, hip, knee, ankle,
//               neck-base, neck-top; side view: side-shoulder,
//               side-shoulder-far, side-elbow, side-wrist, side-hip
//               (both legs), side-knee, side-ankle, side-neck-base;
//               tips: toe, side-toe, hand-tip, side-hand-tip; head centre:
//               head, side-head; end-wrist for the end layer
//   end         hand-fist, hand-out, hand-in, hand-point seen end-on
//               (pointing at the viewer), on end-wrist (optional)
//               (optional wrist-<hand> for a hand drawn elsewhere)
// Other layers are ignored. The four torsos must have the same edges in
// the same order round the outline (any start node); a side limb, hand or
// foot has the same number of edges as its front partner.
import { readdirSync } from 'node:fs';
import { parse, label } from './svg.mjs';
import { read, writeOut } from './lib.mjs';

const K = 100;
const HANDS = ['fist', 'out', 'in', 'point'];

// ---- path parsing (m l h v c z, absolute or relative) into cubic segments
function parseD(d) {
  const toks = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g);
  let i = 0, cmd = null, cur = [0, 0], start = null; const segs = [];
  const num = () => +toks[i++];
  const isNum = () => i < toks.length && !/[a-zA-Z]/.test(toks[i]);
  const L = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const line = (p) => { segs.push({ s: [cur, L(cur, p, 1 / 3), L(cur, p, 2 / 3), p], line: true }); cur = p; };
  while (i < toks.length) {
    if (!isNum()) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    const pt = () => { const x = num(), y = num(); return rel ? [cur[0] + x, cur[1] + y] : [x, y]; };
    if (C === 'M') { cur = pt(); start = cur; cmd = rel ? 'l' : 'L'; }
    else if (C === 'L') line(pt());
    else if (C === 'H') { const x = num(); line([rel ? cur[0] + x : x, cur[1]]); }
    else if (C === 'V') { const y = num(); line([cur[0], rel ? cur[1] + y : y]); }
    else if (C === 'C') { const b = cur, c1 = pt(), c2 = pt(), p = pt(); segs.push({ s: [b, c1, c2, p], line: false }); cur = p; }
    else if (C === 'Z') { line(start); cur = start; }
    else throw new Error(`path command ${cmd} not supported (convert to path / curves)`);
  }
  const len = (g) => Math.hypot(g.s[3][0] - g.s[0][0], g.s[3][1] - g.s[0][1]);
  return segs.filter((g) => !(g.line && len(g) < 2));   // drop the tiny closing edge
}
const translateOf = (n) => {
  const m = (n.attrs.transform || '').match(/translate\(\s*([-\d.e]+)[ ,]*([-\d.e]+)?\s*\)/);
  if (n.attrs.transform && !m) throw new Error(`only translate() is supported on layers (${label(n)})`);
  return m ? [+m[1], +(m[2] || 0)] : [0, 0];
};

// ---- geometry helpers (drawing coordinates)
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, s) => [a[0] * s, a[1] * s];
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const RAD = Math.PI / 180;
const rot = (p, phi) => { const c = Math.cos(phi * RAD), s = Math.sin(phi * RAD); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; };
const angleOf = (v) => Math.atan2(v[0], v[1]) / RAD;        // 0 = down, +90 = +x
const wrap = (v) => ((v + 540) % 360) - 180;
const mapSegs = (segs, f) => segs.map((s) => s.map(f));
const node = (segs, i) => segs[((i % segs.length) + segs.length) % segs.length][0];
const bary = (X, [A, B, C]) => {
  const v0 = sub(B, A), v1 = sub(C, A), v2 = sub(X, A);
  const d = v0[0] * v1[1] - v1[0] * v0[1];
  const b = (v2[0] * v1[1] - v1[0] * v2[1]) / d, c = (v0[0] * v2[1] - v2[0] * v0[1]) / d;
  return [1 - b - c, b, c];
};
const fromBary = (w, [A, B, C]) => add(add(mul(A, w[0]), mul(B, w[1])), mul(C, w[2]));
const r4 = (v) => Math.round(v * 1e4) / 1e4;
const pack = (segs) => segs.map((s) => s.map((p) => [r4(p[0]), r4(p[1])]));

// Rotate `segs` so its nodes line up with `ref`'s (any start node; a
// straight edge may be redrawn as a curve). Torsos are matched on the
// lower block, which a bend leaves alone: with the hips (nodes 4, 5) laid
// on the reference's hips, the waist (3, 6) should land closest. Feet are
// matched on the whole outline.
function align(segs, ref, what, torso = true) {
  const n = ref.length;
  if (segs.length !== n) throw new Error(`${what}: ${segs.length} edges, expected ${n}`);
  const P = (S, i) => S[((i % n) + n) % n].s[0];
  let best = null;
  for (let k = 0; k < n; k++) {
    const r = segs.slice(k).concat(segs.slice(0, k));
    let e;
    if (torso) {
      // similarity taking r's hips onto ref's hips
      const a0 = P(r, 4), a1 = P(r, 5), b0 = P(ref, 4), b1 = P(ref, 5);
      const va = sub(a1, a0), vb = sub(b1, b0);
      const s = Math.hypot(...vb) / Math.hypot(...va), phi = angleOf(va) - angleOf(vb);
      if (Math.abs(wrap(phi)) > 60) continue;            // hips can't turn over
      const T = (p) => add(b0, mul(rot(sub(p, a0), phi), s));
      e = [3, 6].reduce((acc, i) => acc + Math.hypot(...sub(T(P(r, i)), P(ref, i))), 0);
    } else {
      const c = (S) => mul(S.reduce((acc, g) => add(acc, g.s[0]), [0, 0]), 1 / n);
      const cr = c(r), cf = c(ref);
      e = r.reduce((acc, g, i) => acc + Math.hypot(...sub(sub(g.s[0], cr), sub(ref[i].s[0], cf))), 0);
    }
    if (!best || e < best.e) best = { r, e };
  }
  if (process.env.DEBUG) console.log(what, 'start node', segs.indexOf(best.r[0]));
  return best.r;
}

function importParts(file) {
  const root = parse(read(file));
  const layers = {};
  const walk = (n, off) => {
    for (const c of n.children || []) {
      if (!c.tag) continue;
      const o = add(off, translateOf(c));
      const L = label(c);
      if (c.tag === 'g' && ['front', 'side', 'front-bend', 'side-bend', 'end', 'anchors'].includes(L)) layers[L] = { node: c, off: o };
      else if (c.tag === 'g' || c.tag === 'svg') walk(c, o);
    }
  };
  walk(root, [0, 0]);
  const items = (L) => {
    const out = {};
    const go = (n, off) => {
      for (const c of n.children || []) {
        if (!c.tag) continue;
        const o = add(off, translateOf(c));
        const name = label(c).replace(new RegExp(`^(${L}|anchor)-`), '');
        if (c.tag === 'g') go(c, o);
        else if (c.tag === 'path') out[name] = parseD(c.attrs.d).map((g) => ({ ...g, s: g.s.map((p) => add(p, o)) }));
        else if (c.tag === 'circle') out[name] = add([+c.attrs.cx, +c.attrs.cy], o);
      }
    };
    if (!layers[L]) throw new Error(`${file}: no layer "${L}"`);
    go(layers[L].node, layers[L].off);
    return out;
  };
  const F = items('front'), Sd = items('side'), FB = items('front-bend'), SB = items('side-bend'), AN = items('anchors');
  const EN = layers.end ? items('end') : {};
  const need = (o, k, where) => { if (!o[k]) throw new Error(`${file}: ${where} has no "${k}"`); return o[k]; };
  for (const k of ['torso', 'neck', 'upper-arm', 'forearm', 'hand-fist', 'thigh', 'shin', 'foot']) need(F, k, 'front');
  for (const k of ['shoulder', 'elbow', 'wrist', 'hip', 'knee', 'ankle', 'neck-base', 'neck-top']) need(AN, k, 'anchors');

  // The file is in the renderer's frame (facing right, front limbs on the
  // near side, picture-right); px -> head-units.
  const M = (p) => [p[0] / K, p[1] / K];
  const segsOf = (g) => g.map((x) => x.s.map(M));
  const A = Object.fromEntries(Object.entries(AN).map(([k, p]) => [k, M(p)]));

  // torsos: node order 0 near-top, 1 neck, 2 far-top, 3 far-waist,
  // 4 far-hip, 5 near-hip, 6 near-waist (as on the front torso)
  const tf = F.torso;
  const sideT = align(need(Sd, 'torso', 'side'), tf, 'side torso');
  const torsos = {
    front: segsOf(tf),
    frontBend: segsOf(align(need(FB, 'torso', 'front-bend'), tf, 'front-bend torso')),
    side: segsOf(sideT),
    sideBend: segsOf(align(need(SB, 'torso', 'side-bend'), sideT, 'side-bend torso')),
  };
  if (tf.length !== 7) throw new Error(`front torso: ${tf.length} edges, expected 7`);
  // each torso in a pelvis frame: hip mid at the origin, hip line as on the straight key
  const hipMid = (T) => lerp(node(T, 4), node(T, 5), 0.5);
  const hipAng = (T) => angleOf(sub(node(T, 5), node(T, 4)));
  const frame = (T, R0) => { const o = hipMid(T), phi = hipAng(T) - hipAng(R0); return mapSegs(T, (p) => rot(sub(p, o), phi)); };
  const keys = {
    front: frame(torsos.front, torsos.front),
    frontBend: frame(torsos.frontBend, torsos.front),
    side: frame(torsos.side, torsos.side),
    sideBend: frame(torsos.sideBend, torsos.side),
  };
  const P0 = hipMid(torsos.front);
  const toT = (p) => sub(p, P0);
  const tri = (T, idx) => idx.map((i) => node(T, i));
  const triS = [0, 1, 6], triH = [5, 4, 6], triN = [0, 1, 2];
  const attach = {
    shoulder: { idx: triS, w: bary(toT(A.shoulder), tri(keys.front, triS)) },
    hip: { idx: triH, w: bary(toT(A.hip), tri(keys.front, triH)) },
    neck: { idx: triN, w: bary(toT(A['neck-base']), tri(keys.front, triN)) },
  };
  // side-view joints from the side anchors, on the side torso's nodes (so
  // they follow the bend); one hip point for both legs. Without side
  // anchors the front's are used on the side torso.
  const PS = hipMid(torsos.side);
  const sideAtt = (name, idx) => (A[name] ? { idx, w: bary(sub(A[name], PS), tri(keys.side, idx)) } : null);
  const sTriS = [0, 1, 6], sTriSF = [2, 1, 3];
  const attachSide = A['side-hip'] ? {
    shoulder: sideAtt('side-shoulder', sTriS) || attach.shoulder,
    shoulderFar: sideAtt('side-shoulder-far', sTriSF) || sideAtt('side-shoulder', sTriS) || attach.shoulder,
    hip: sideAtt('side-hip', triH),
    neck: sideAtt('side-neck-base', [1, 6, 3]) || attach.neck,
  } : undefined;
  const upAx = (T) => angleOf(sub(node(T, 1), lerp(node(T, 3), node(T, 6), 0.5)));
  const bend = wrap(upAx(keys.side) - upAx(keys.sideBend));
  const height = (T) => -node(T, 1)[1];

  // Limbs: rigid, in bone frames (origin at the start joint, bone pointing
  // down), one shape per view. The side shape is optional: without it the
  // front shape is used (mirrored across the bone where `flip`). Side
  // anchors default to the front bone laid from the side start joint.
  const toBone = (segs, a, b) => { const ang = angleOf(sub(b, a)); return mapSegs(segs, (p) => rot(sub(p, a), ang)); };
  const reverse = (segs) => [...segs].reverse().map((s) => [...s].reverse());
  // reorder `segs` (start node and direction) to match `ref` node for node
  const match = (segs, ref, what) => {
    if (segs.length !== ref.length) throw new Error(`${what}: ${segs.length} edges, front has ${ref.length}`);
    let best = null;
    for (const S of [segs, reverse(segs)]) for (let k = 0; k < S.length; k++) {
      const r = S.slice(k).concat(S.slice(0, k));
      const e = r.reduce((acc, s, i) => acc + Math.hypot(...sub(s[0], ref[i][0])), 0);
      if (!best || e < best.e) best = { r, e };
    }
    return best.r;
  };
  // side joints: the side anchor, else the front bone laid from the side joint above
  const SJ = {};
  SJ.shoulder = A['side-shoulder'] || A.shoulder;
  SJ.elbow = A['side-elbow'] || add(SJ.shoulder, sub(A.elbow, A.shoulder));
  SJ.wrist = A['side-wrist'] || add(SJ.elbow, sub(A.wrist, A.elbow));
  SJ.hip = A['side-hip'] || A.hip;
  SJ.knee = A['side-knee'] || add(SJ.hip, sub(A.knee, A.hip));
  SJ.ankle = A['side-ankle'] || add(SJ.knee, sub(A.ankle, A.knee));
  const limb = (name, j0, j1, flip) => {
    const front = toBone(segsOf(F[name]), A[j0], A[j1]);
    const s0 = SJ[j0], s1 = SJ[j1];
    const side = Sd[name] ? match(toBone(segsOf(Sd[name]), s0, s1), front, `side ${name}`)
      : match(flip ? mapSegs(front, (p) => [-p[0], p[1]]) : front, front, `side ${name}`);
    return { front: pack(front), side: pack(side), len: r4(Math.hypot(...sub(A[j1], A[j0]))) };
  };

  // Hands: on the wrist, turned so each points straight down (wrist to the
  // hand's centre); wrist 0 in a pose = straight along the forearm.
  const handAng = (segs, w) => {
    const pts = segs.flatMap((s) => s);
    const c = mul(pts.reduce((acc, p) => add(acc, p), [0, 0]), 1 / pts.length);
    return angleOf(sub(c, w));
  };
  const handFrame = (segs, w) => mapSegs(segs, (p) => rot(sub(p, w), handAng(segs, w)));
  const handsOf = (L, w, base) => {
    const H = {};
    for (const h of HANDS) if (L[`hand-${h}`]) H[h] = handFrame(segsOf(L[`hand-${h}`]), A[`wrist-${h}`] || w);
    if (base) for (const h of HANDS) H[h] = H[h] ? match(H[h], base[h], `side hand-${h}`) : base[h];
    H.out ||= H.fist; H.point ||= H.out;
    H.in ||= mapSegs(H.out, (p) => [-p[0], p[1]]);     // thumb to the other side
    return H;
  };
  const handsFront = handsOf(F, A.wrist);
  const handsSide = handsOf(Sd, SJ.wrist, handsFront);
  // End-on hands (pointing at the viewer), layer "end", on the end-wrist
  // anchor; not drawn yet: the front hands squashed to a third of their
  // length, as a first draft.
  const endWrist = A['end-wrist'];
  const handsEnd = {};
  for (const h of HANDS) {
    const g = EN[`hand-${h}`];
    handsEnd[h] = g && endWrist ? match(mapSegs(segsOf(g), (p) => sub(p, endWrist)), handsFront[h], `end hand-${h}`)
      : mapSegs(handsFront[h], (p) => [p[0] * 1.05, p[1] * 0.35]);
  }
  // Tips: the toe of each foot and the tip of each hand (anchors toe,
  // side-toe, hand-tip, side-hand-tip), in the part's own frame; first
  // guesses: the outline point farthest from the ankle, the fist's lowest
  // point.
  const far = (segs) => segs.map((s) => s[0]).reduce((q, p) => (Math.hypot(...p) > Math.hypot(...q) ? p : q));
  const low = (segs) => segs.map((s) => s[0]).reduce((q, p) => (p[1] > q[1] ? p : q));
  const tip = (anchor, w, ang, segs, pick) => (anchor ? rot(sub(anchor, w), ang) : pick(segs));
  const fistF = segsOf(F['hand-fist']), fistS = Sd['hand-fist'] ? segsOf(Sd['hand-fist']) : null;
  const handTip = {
    front: tip(A['hand-tip'], A.wrist, handAng(fistF, A.wrist), handsFront.fist, low),
    side: tip(A['side-hand-tip'], SJ.wrist, fistS ? handAng(fistS, SJ.wrist) : 0, handsSide.fist, low),
  };
  // Head centre (anchors head, side-head), from the neck top; first guess
  // 0.21 above it.
  const sideNeckTop = add(A['side-neck-base'] || A['neck-base'], sub(A['neck-top'], A['neck-base']));
  const headAt = {
    front: A.head ? sub(A.head, A['neck-top']) : [0, -0.21],
    side: A['side-head'] ? sub(A['side-head'], sideNeckTop) : [0, -0.21],
  };
  const packH = (H) => Object.fromEntries(Object.entries(H).map(([k, v]) => [k, pack(v)]));

  // feet: flat as drawn, each on its ankle anchor
  const ff = segsOf(F.foot), fs = segsOf(align(need(Sd, 'foot', 'side'), F.foot, 'side foot', false));
  const ffA = mapSegs(ff, (p) => sub(p, A.ankle)), fsA = mapSegs(fs, (p) => sub(p, SJ.ankle));
  const toe = {
    front: A.toe ? sub(A.toe, A.ankle) : far(ffA),
    side: A['side-toe'] ? sub(A['side-toe'], SJ.ankle) : far(fsA),
  };

  // Shared heights: the front and side drawings are two views of one body,
  // so matching points must sit at the same height (y). List the ones
  // that don't (more than 0.03 head-units = 3 px apart).
  const warn = [];
  const chk = (what, yf, ys, unit = 'px above the pelvis') => { if (Math.abs(yf - ys) > 0.03) warn.push(`${what}: front ${(-yf * K).toFixed(1)}, side ${(-ys * K).toFixed(1)} ${unit}`); };
  const NODE = ['near top', 'neck', 'far top', 'far waist', 'far hip', 'near hip', 'near waist'];
  keys.front.forEach((s, i) => chk(`torso node ${i} (${NODE[i]})`, s[0][1], keys.side[i][0][1]));
  for (const k of ['shoulder', 'elbow', 'wrist', 'hip', 'knee', 'ankle', 'neck-base'])
    if (A[`side-${k}`]) chk(`anchor ${k}`, A[k][1], A[`side-${k}`][1], 'px above the ground');
  if (warn.length) console.warn(`${file}: heights differ between front and side\n  ${warn.join('\n  ')}`);

  return {
    torso: Object.fromEntries(Object.entries(keys).map(([k, v]) => [k, pack(v)])),
    attach, attachSide, mirror: [2, 1, 0, 6, 5, 4, 3],
    bend: r4(bend), frontBend: r4(height(keys.frontBend) / height(keys.front)),
    upperArm: limb('upper-arm', 'shoulder', 'elbow', true),
    forearm: limb('forearm', 'elbow', 'wrist', false),
    thigh: limb('thigh', 'hip', 'knee', false),
    shin: limb('shin', 'knee', 'ankle', true),
    neck: (() => { const s = toBone(segsOf(F.neck), A['neck-base'], A['neck-top']); return { segs: pack(s), len: r4(Math.hypot(...sub(A['neck-top'], A['neck-base']))) }; })(),
    hands: { front: packH(handsFront), side: packH(handsSide), end: packH(handsEnd) },
    foot: { front: pack(ffA), side: pack(fsA) },
    toe: { front: toe.front.map(r4), side: toe.side.map(r4) },
    handTip: { front: handTip.front.map(r4), side: handTip.side.map(r4) },
    headAt: { front: headAt.front.map(r4), side: headAt.side.map(r4) },
  };
}

const out = {};
for (const f of readdirSync(new URL('../data/parts', import.meta.url)).filter((f) => f.endsWith('.svg')).sort()) {
  const id = f.slice(0, -4);
  out[id] = importParts(`data/parts/${f}`);
  const m = out[id];
  console.log(`${id}: bend ${m.bend.toFixed(0)}°, front-bend ×${m.frontBend.toFixed(2)}, arm ${m.upperArm.len}+${m.forearm.len}, leg ${m.thigh.len}+${m.shin.len}, hands ${Object.keys(m.hands.front).join(' ')}`);
}
console.log(writeOut('data/parts.json', JSON.stringify({ note: 'generated by tools/import-parts.mjs from data/parts/*.svg; do not edit', parts: out })));
