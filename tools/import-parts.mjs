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
//   front       torso, neck, upper-arm, forearm, hand (size guide: the
//               "in" hand), thigh, shin, foot
//   side        torso, upper-arm, forearm, hand, thigh, shin, foot
//               (each limb optional: else the front one is used)
//   front-bend  torso, torso-2, … (bent forward, seen from the front)
//   side-bend   torso, torso-2, … (bent forward, seen from the side)
//   anchors     circles: shoulder, elbow, wrist, hip, knee, ankle,
//               neck-base, neck-top; side view: side-shoulder,
//               side-shoulder-far, side-elbow, side-wrist, side-hip
//               (both legs), side-knee, side-ankle, side-neck-base;
//               tips: toe, side-toe; head centre: head, side-head
// The hands are shared: data/parts/hands.svg (layers front, side, end;
// hand-fist, -out, -in, -point on wrist-<hand>, side-wrist-<hand>,
// end-wrist-<hand>; tips hand-tip, side-hand-tip), scaled for each body to
// the size of its guide hand.
// Other layers are ignored. All torsos have the 9 edges of TN, in the same
// order round the outline (any start node); a side limb, hand or
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
  return segs.filter((g) => !(g.line && len(g) < 0.05));  // drop the zero-length closing edge
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

// Torso nodes, in order round the outline (as on the front torso):
//   0 near top, 1 neck, 2 far top, 3 far waist (upper), 4 far waist
//   (lower), 5 far hip, 6 near hip, 7 near waist (lower), 8 near waist
//   (upper). In the side view "near" is the front of the body.
const TN = { count: 9, neck: 1, farHip: 5, nearHip: 6, waist: [3, 4, 7, 8], upperWaist: [3, 8],
  mirror: [2, 1, 0, 8, 7, 6, 5, 4, 3],
  names: ['near top', 'neck', 'far top', 'far waist (upper)', 'far waist (lower)', 'far hip', 'near hip', 'near waist (lower)', 'near waist (upper)'] };

// Rotate `segs` so its nodes line up with `ref`'s (any start node; a
// straight edge may be redrawn as a curve). Torsos are matched on the
// lower block, which a bend leaves alone: with the hips (nodes 5, 6) laid
// on the reference's hips, the waist (3, 4, 7, 8) should land closest.
// Feet are matched on the whole outline.
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
      const a0 = P(r, TN.farHip), a1 = P(r, TN.nearHip), b0 = P(ref, TN.farHip), b1 = P(ref, TN.nearHip);
      const va = sub(a1, a0), vb = sub(b1, b0);
      const s = Math.hypot(...vb) / Math.hypot(...va), phi = angleOf(va) - angleOf(vb);
      if (Math.abs(wrap(phi)) > 60) continue;            // hips can't turn over
      const T = (p) => add(b0, mul(rot(sub(p, a0), phi), s));
      e = TN.waist.reduce((acc, i) => acc + Math.hypot(...sub(T(P(r, i)), P(ref, i))), 0);
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

// Split a cubic edge {s:[p0,c1,c2,p3]} at t (de Casteljau).
function splitSeg(g, t) {
  const [p0, p1, p2, p3] = g.s, L = (a, b) => lerp(a, b, t);
  const a = L(p0, p1), b = L(p1, p2), c = L(p2, p3), d = L(a, b), e = L(b, c), m = L(d, e);
  return [{ s: [p0, a, d, m], line: g.line }, { s: [m, e, c, p3], line: g.line }];
}
// t where the edge reaches height y (bisection; the edge runs up or down).
function tAtY(g, y) {
  const Y = (t) => { const u = 1 - t, s = g.s; return u * u * u * s[0][1] + 3 * u * u * t * s[1][1] + 3 * u * t * t * s[2][1] + t * t * t * s[3][1]; };
  let lo = 0, hi = 1;
  const sgn = Math.sign(Y(1) - Y(0)) || 1;
  if ((y - Y(0)) * sgn <= 0 || (y - Y(1)) * sgn >= 0) return 0.5;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if ((Y(m) - y) * sgn < 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
// A 7-edge torso (near top, neck, far top, far waist, far hip, near hip,
// near waist) -> the 9 edges of TN, splitting far waist→far hip and near
// hip→near waist. The first (straight) torso sets where, at the front's
// lower-waist heights; later ones (its bends) split at the same t.
function upgrade7(g, front9, mem) {
  const P = (S, i) => S[((i % S.length) + S.length) % S.length].s[0];
  let best = null;
  for (let k = 0; k < 7; k++) {
    const r = g.slice(k).concat(g.slice(0, k));
    const a0 = P(r, 4), a1 = P(r, 5), b0 = P(front9, TN.farHip), b1 = P(front9, TN.nearHip);
    const va = sub(a1, a0), vb = sub(b1, b0), phi = angleOf(va) - angleOf(vb);
    if (Math.abs(wrap(phi)) > 60) continue;
    const s = Math.hypot(...vb) / Math.hypot(...va);
    const T = (p) => add(b0, mul(rot(sub(p, a0), phi), s));
    const e = Math.hypot(...sub(T(P(r, 3)), P(front9, 3))) + Math.hypot(...sub(T(P(r, 6)), P(front9, 8)));
    if (!best || e < best.e) best = { r, e };
  }
  const r = best.r;
  if (mem.t == null) {
    const mid = (S, a, b) => (P(S, a)[1] + P(S, b)[1]) / 2;
    const yOff = mid(r, 4, 5) - mid(front9, TN.farHip, TN.nearHip);
    mem.t = [tAtY(r[3], P(front9, 4)[1] + yOff), tAtY(r[5], P(front9, 7)[1] + yOff)];
  }
  const [a3, b3] = splitSeg(r[3], mem.t[0]), [a5, b5] = splitSeg(r[5], mem.t[1]);
  return [r[0], r[1], r[2], a3, b3, r[4], a5, b5, r[6]];
}

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

// reorder `segs` to match `ref` by the direction of each node from the
// shape's centre (for shapes of different proportions: an end-on part
// against its long front partner). `turn` (degrees) turns `segs` first,
// for the comparison only.
const matchRound = (segs, ref, what, turn = 0) => {
  if (segs.length !== ref.length) throw new Error(`${what}: ${segs.length} edges, front has ${ref.length}`);
  const ctr = (S) => mul(S.reduce((acc, s) => add(acc, s[0]), [0, 0]), 1 / S.length);
  const ang = (S, k = 0) => { const c = ctr(S); return S.map((s) => Math.atan2(...rot(sub(s[0], c), k).reverse())); };
  const ra = ang(ref);
  let best = null;
  for (const S of [segs, reverse(segs)]) for (let k = 0; k < S.length; k++) {
    const r = S.slice(k).concat(S.slice(0, k));
    const a = ang(r, turn);
    const e = a.reduce((acc, v, i) => { let d = Math.abs(v - ra[i]) % (2 * Math.PI); if (d > Math.PI) d = 2 * Math.PI - d; return acc + d; }, 0);
    if (!best || e < best.e) best = { r, e };
  }
  return best.r;
};

// Hands: on the wrist, turned so each points straight down (wrist to the
// hand's centre); wrist 0 in a pose = straight along the forearm.
const handAng = (segs, w) => {
  const pts = segs.flatMap((s) => s);
  const c = mul(pts.reduce((acc, p) => add(acc, p), [0, 0]), 1 / pts.length);
  return angleOf(sub(c, w));
};
const handFrame = (segs, w) => mapSegs(segs, (p) => rot(sub(p, w), handAng(segs, w)));
const handExtent = (segs) => { const ys = segs.flat().map((p) => p[1]); return Math.max(...ys) - Math.min(...ys); };
// the shared hands (male size), in each hand's own frame
function importHands(file) {
  const { items } = importParts(file);
  const M = (p) => [p[0] / K, p[1] / K];
  const segsOf = (g) => g.map((x) => x.s.map(M));
  const A = Object.fromEntries(Object.entries(items('anchors')).map(([k, p]) => [k, M(p)]));
  const out = {};
  for (const [view, pre] of [['front', ''], ['side', 'side-'], ['end', 'end-']]) {
    const L = items(view), H = {};
    for (const h of HANDS) {
      const w = A[`${pre}wrist-${h}`];
      if (!L[`hand-${h}`] || !w) throw new Error(`${file}: ${view} needs hand-${h} and anchor ${pre}wrist-${h}`);
      // end-on hands keep the turn of their front partner
      const segs = segsOf(L[`hand-${h}`]);
      H[h] = view === 'end' ? mapSegs(segs, (p) => sub(p, w)) : handFrame(segs, w);
      if (view === 'side') H[h] = match(H[h], out.front[h], `${view} hand-${h}`);
      else if (view === 'end') H[h] = matchRound(H[h], out.front[h], `${view} hand-${h}`);
    }
    out[view] = H;
  }
  const tip = (name, pre) => {
    const w = A[`${pre}wrist-fist`], t = A[name];
    return t ? rot(sub(t, w), handAng(segsOf(items(pre ? 'side' : 'front')['hand-fist']), w)) : [0, 0.3];
  };
  out.handTip = { front: tip('hand-tip', ''), side: tip('side-hand-tip', 'side-') };
  return out;
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
  if (file.endsWith('hands.svg')) return { items, layers };
  const F = items('front'), Sd = items('side'), EN = layers.end ? items('end') : {}, FB = items('front-bend'), SB = items('side-bend'), AN = items('anchors');
  const need = (o, k, where) => { if (!o[k]) throw new Error(`${file}: ${where} has no "${k}"`); return o[k]; };
  for (const k of ['torso', 'neck', 'upper-arm', 'forearm', 'thigh', 'shin', 'foot']) need(F, k, 'front');
  for (const k of ['shoulder', 'elbow', 'wrist', 'hip', 'knee', 'ankle', 'neck-base', 'neck-top']) need(AN, k, 'anchors');

  // The file is in the renderer's frame (facing right, front limbs on the
  // near side, picture-right); px -> head-units.
  const M = (p) => [p[0] / K, p[1] / K];
  const segsOf = (g) => g.map((x) => x.s.map(M));
  const A = Object.fromEntries(Object.entries(AN).map(([k, p]) => [k, M(p)]));

  // Torsos (see TN): the straight front and side, and in each bend layer
  // one or more bent torsos ("torso", "torso-2", …). Bends are ordered by
  // how far they bend: side ones by the measured angle, front ones by
  // height (taller = less bent); the n-th front bend pairs with the n-th
  // side bend.
  const tf = F.torso;
  if (tf.length !== TN.count) throw new Error(`front torso: ${tf.length} edges, expected ${TN.count}`);
  // A torso drawn with the old 7 edges gets the two lower waist nodes added
  // (its edges split at the front torso's lower-waist heights; its bends
  // split at the same places along their edges).
  const notes = [];
  const up7 = {};
  const to9 = (g, what) => {
    if (g.length !== 7) return g;
    const r = upgrade7(g, tf, up7);
    notes.push(`${what}: had 7 edges, the two lower waist nodes were added`);
    return r;
  };
  const sideT = align(to9(need(Sd, 'torso', 'side'), 'side torso'), tf, 'side torso');
  const bendsIn = (L, ref, what) => Object.entries(L).filter(([k]) => /^torso/.test(k))
    .map(([k, g]) => segsOf(align(to9(g, `${what} ${k}`), ref, `${what} ${k}`)));
  // each torso in a pelvis frame: hip mid at the origin, hip line as on the straight key
  const hipMid = (T) => lerp(node(T, TN.farHip), node(T, TN.nearHip), 0.5);
  const hipAng = (T) => angleOf(sub(node(T, TN.nearHip), node(T, TN.farHip)));
  const frame = (T, R0) => { const o = hipMid(T), phi = hipAng(T) - hipAng(R0); return mapSegs(T, (p) => rot(sub(p, o), phi)); };
  const front0 = segsOf(tf), side0 = segsOf(sideT);
  const upAx = (T) => angleOf(sub(node(T, TN.neck), lerp(node(T, 3), node(T, 8), 0.5)));
  const height = (T) => -node(T, TN.neck)[1];
  const keys = { front: frame(front0, front0), side: frame(side0, side0) };
  const sideBends = bendsIn(SB, sideT, 'side-bend').map((T) => frame(T, side0))
    .map((T) => ({ T, deg: wrap(upAx(keys.side) - upAx(T)) })).sort((a, b) => a.deg - b.deg);
  const frontBends = bendsIn(FB, tf, 'front-bend').map((T) => frame(T, front0)).sort((a, b) => height(b) - height(a));
  if (!sideBends.length) throw new Error(`${file}: side-bend has no torso`);
  if (frontBends.length !== sideBends.length) throw new Error(`${file}: ${frontBends.length} front-bend torsos but ${sideBends.length} side-bend`);
  keys.frontBend = frontBends; keys.sideBend = sideBends.map((b) => b.T);
  const bends = sideBends.map((b) => b.deg);

  const P0 = hipMid(front0);
  const toT = (p) => sub(p, P0);
  const tri = (T, idx) => idx.map((i) => node(T, i));
  // A joint is a mix of torso nodes, so it follows the bend. Hips hang on
  // the hip edge only (nodes 5–6: a point along it and off it), so a
  // folding waist doesn't move the legs.
  const edgeAt = (P, T, a, b) => {
    const A0 = node(T, a), d = sub(node(T, b), A0), L2 = d[0] * d[0] + d[1] * d[1], v = sub(P, A0);
    return { edge: [a, b], u: (v[0] * d[0] + v[1] * d[1]) / L2, v: (v[0] * -d[1] + v[1] * d[0]) / L2 };
  };
  const triS = [0, 1, 8], triN = [0, 1, 2];
  const attach = {
    shoulder: { idx: triS, w: bary(toT(A.shoulder), tri(keys.front, triS)) },
    hip: edgeAt(toT(A.hip), keys.front, TN.farHip, TN.nearHip),
    neck: { idx: triN, w: bary(toT(A['neck-base']), tri(keys.front, triN)) },
  };
  // side-view joints from the side anchors, on the side torso's nodes; one
  // hip point for both legs
  const PS = hipMid(side0);
  const sideAtt = (name, idx) => (A[name] ? { idx, w: bary(sub(A[name], PS), tri(keys.side, idx)) } : null);
  const attachSide = A['side-hip'] ? {
    shoulder: sideAtt('side-shoulder', triS) || attach.shoulder,
    shoulderFar: sideAtt('side-shoulder-far', [2, 1, 3]) || sideAtt('side-shoulder', triS) || attach.shoulder,
    hip: edgeAt(sub(A['side-hip'], PS), keys.side, TN.farHip, TN.nearHip),
    neck: sideAtt('side-neck-base', [1, 8, 3]) || attach.neck,
  } : undefined;

  // Limbs: rigid, in bone frames (origin at the start joint, bone pointing
  // down), one shape per view. The side shape is optional: without it the
  // front shape is used (mirrored across the bone where `flip`). Side
  // anchors default to the front bone laid from the side start joint.
  const toBone = (segs, a, b) => { const ang = angleOf(sub(b, a)); return mapSegs(segs, (p) => rot(sub(p, a), ang)); };
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
    const out = { front: pack(front), side: pack(side), len: r4(Math.hypot(...sub(A[j1], A[j0]))) };
    // end-on (layer end): drawn round its anchor end-<j0>, where the bone
    // projects to a point; kept as drawn (not turned)
    const ea = A[`end-${j0}`];
    if (EN[name] && ea) { out.end = pack(matchRound(mapSegs(segsOf(EN[name]), (p) => sub(p, ea)), front, `end ${name}`)); out.endAt = ea.map(r4); }
    else if (EN[name]) throw new Error(`${file}: end ${name} needs the anchor end-${j0}`);
    return out;
  };

  // Hands: the shared ones (data/parts/hands.svg), scaled to the size of
  // this body's guide hand (front "hand", or "hand-in" in older files).
  const guide = F.hand || F['hand-in'];
  if (!guide) throw new Error(`${file}: front has no "hand" (the size guide)`);
  const k = handExtent(handFrame(segsOf(guide), A.wrist)) / handExtent(HANDS_SHARED.front.in);
  const scaleH = (H) => Object.fromEntries(Object.entries(H).map(([h, v]) => [h, mapSegs(v, (p) => mul(p, k))]));
  const handsFront = scaleH(HANDS_SHARED.front), handsSide = scaleH(HANDS_SHARED.side), handsEnd = scaleH(HANDS_SHARED.end);
  const handTip = { front: mul(HANDS_SHARED.handTip.front, k), side: mul(HANDS_SHARED.handTip.side, k) };
  notes.push(`hands: ${k.toFixed(3)} × the shared hands`);
  const far = (segs) => segs.map((s) => s[0]).reduce((q, p) => (Math.hypot(...p) > Math.hypot(...q) ? p : q));
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

  // the sole (layer end, foot): round end-ankle, heel-to-toe toward
  // end-toe. Two node orders: matched to the front foot with the toes
  // turned up (sole toward the viewer, toes raised) and down.
  let footEnd = null;
  if (EN.foot) {
    const ea = A['end-ankle'], et = A['end-toe'];
    if (!ea || !et) throw new Error(`${file}: end foot needs the anchors end-ankle and end-toe`);
    const sole = mapSegs(segsOf(EN.foot), (p) => sub(p, ea));
    const toeV = sub(et, ea), up = angleOf(toeV) - 180;          // rot() by this points the toes up
    footEnd = { up: pack(matchRound(sole, ffA, 'end foot (toes up)', up)), down: pack(matchRound(sole, ffA, 'end foot (toes down)', up + 180)),
      toe: toeV.map(r4), at: ea.map(r4) };
  }

  // Shared heights: the front and side drawings are two views of one body,
  // so matching points must sit at the same height (y). List the ones
  // that don't (more than 0.03 head-units = 3 px apart).
  const warn = [];
  const chk = (what, yf, ys, unit = 'px above the pelvis') => { if (Math.abs(yf - ys) > 0.03) warn.push(`${what}: front ${(-yf * K).toFixed(1)}, side ${(-ys * K).toFixed(1)} ${unit}`); };
  // the two shoulder corners (nodes 0, 2) may differ, as long as their
  // middle matches
  keys.front.forEach((s, i) => { if (i !== 0 && i !== 2) chk(`torso node ${i} (${TN.names[i]})`, s[0][1], keys.side[i][0][1]); });
  const midTop = (T) => (node(T, 0)[1] + node(T, 2)[1]) / 2;
  chk('torso shoulder corners (middle of nodes 0 and 2)', midTop(keys.front), midTop(keys.side));
  for (const k of ['shoulder', 'elbow', 'wrist', 'hip', 'knee', 'ankle', 'neck-base'])
    if (A[`side-${k}`]) chk(`anchor ${k}`, A[k][1], A[`side-${k}`][1], 'px above the ground');
  if (notes.length) console.warn(`${file}:\n  ${notes.join('\n  ')}`);
  if (warn.length) console.warn(`${file}: heights differ between front and side\n  ${warn.join('\n  ')}`);

  return {
    torso: { front: pack(keys.front), side: pack(keys.side), frontBend: keys.frontBend.map(pack), sideBend: keys.sideBend.map(pack) },
    attach, attachSide, mirror: TN.mirror, bends: bends.map(r4),
    upperArm: limb('upper-arm', 'shoulder', 'elbow', true),
    forearm: limb('forearm', 'elbow', 'wrist', false),
    thigh: limb('thigh', 'hip', 'knee', false),
    shin: limb('shin', 'knee', 'ankle', true),
    neck: (() => { const s = toBone(segsOf(F.neck), A['neck-base'], A['neck-top']); return { segs: pack(s), len: r4(Math.hypot(...sub(A['neck-top'], A['neck-base']))) }; })(),
    hands: { front: packH(handsFront), side: packH(handsSide), end: packH(handsEnd) },
    foot: { front: pack(ffA), side: pack(fsA), ...(footEnd ? { end: footEnd } : {}) },
    toe: { front: toe.front.map(r4), side: toe.side.map(r4) },
    handTip: { front: handTip.front.map(r4), side: handTip.side.map(r4) },
    headAt: { front: headAt.front.map(r4), side: headAt.side.map(r4) },
  };
}

const HANDS_SHARED = importHands('data/parts/hands.svg');
const out = {};
for (const f of readdirSync(new URL('../data/parts', import.meta.url)).filter((f) => f.endsWith('.svg') && f !== 'hands.svg').sort()) {
  const id = f.slice(0, -4);
  out[id] = importParts(`data/parts/${f}`);
  const m = out[id];
  console.log(`${id}: bends ${m.bends.map((b) => b.toFixed(0) + '°').join(' ')}, arm ${m.upperArm.len}+${m.forearm.len}, leg ${m.thigh.len}+${m.shin.len}, hands ${Object.keys(m.hands.front).join(' ')}`);
}
const packAll = (H) => Object.fromEntries(Object.entries(H).map(([k, v]) => [k, k === 'handTip' ? { front: v.front.map(r4), side: v.side.map(r4) } : Object.fromEntries(Object.entries(v).map(([h, sg]) => [h, pack(sg)]))]));
console.log(writeOut('data/parts.json', JSON.stringify({ note: 'generated by tools/import-parts.mjs from data/parts/*.svg; do not edit', parts: out, hands: packAll(HANDS_SHARED) })));
