// Drawn-parts figures (experiment, branch drawn-parts): every body part is
// the artist's own outline (data/parts/<id>.svg, imported by
// tools/import-parts.mjs into data/parts.json), placed rigidly on the
// skeleton. The torso is interpolated between four drawn keys:
// front / side (turn) × straight / bent forward (bend). Shapes are
// returned in the same form as buildShapes in figure.js.
//
// Names here are prefixed (dp…) because the labs concatenate the renderer
// modules into one script.

import { RAD, dir, add, sub, mul, lerp, rot } from './geom.js';

const dpNode = (T, i) => T[((i % T.length) + T.length) % T.length][0];
const dpMap = (segs, f) => segs.map((s) => s.map(f));

// Cubic segments -> polygon points (each segment sampled n times).
export function dpFlat(segs, n = 8) {
  const out = [];
  for (const [a, b, c, d] of segs) for (let i = 0; i < n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
      u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]);
  }
  return out;
}

// Blend about a pivot in polar coordinates, so a bending torso swings
// round the waist instead of shrinking across the chord. t outside 0..1
// extrapolates (an arch back, a deeper bend).
function dpPolar(A, B, t, pivot) {
  return A.map((s, i) => s.map((p, j) => {
    const a = sub(p, pivot), b = sub(B[i][j], pivot);
    const ra = Math.hypot(a[0], a[1]), rb = Math.hypot(b[0], b[1]);
    const aa = Math.atan2(a[1], a[0]);
    let ab = Math.atan2(b[1], b[0]);
    while (ab - aa > Math.PI) ab -= 2 * Math.PI;
    while (ab - aa < -Math.PI) ab += 2 * Math.PI;
    const r = ra + (rb - ra) * t, an = aa + (ab - aa) * t;
    return add(pivot, [r * Math.cos(an), r * Math.sin(an)]);
  }));
}
const dpLin = (A, B, t) => A.map((s, i) => s.map((p, j) => lerp(p, B[i][j], t)));

// Torso nodes (9, round the outline): 0 near top, 1 neck, 2 far top,
// 3 far waist (upper), 4 far waist (lower), 5 far hip, 6 near hip,
// 7 near waist (lower), 8 near waist (upper). Side view: near = front.
const DP_WAIST = [3, 4, 7, 8];
const dpWaistMid = (T) => mul(DP_WAIST.reduce((a, i) => add(a, dpNode(T, i)), [0, 0]), 1 / DP_WAIST.length);

// Torso outline in the pelvis frame (hip mid at 0,0). turn: 0 front, 1
// side; deg: the bend in degrees. The drawn keys are the straight torso
// and the bent ones at M.bends degrees; between two keys the outline swings
// round the waist (polar blend), before the first and past the last it
// extrapolates (an arch back, a deeper bend).
export function partsTorso(M, turn, deg) {
  const keys = [dpLin(M.torso.front, M.torso.side, turn),
    ...M.torso.frontBend.map((fb, i) => dpLin(fb, M.torso.sideBend[i], turn))];
  const at = [0, ...M.bends];
  let k = 0;
  while (k < at.length - 2 && deg > at[k + 1]) k++;
  const t = (deg - at[k]) / (at[k + 1] - at[k]);
  return dpPolar(keys[k], keys[k + 1], t, dpWaistMid(keys[k]));
}
// A joint on the torso: a mix of three torso nodes, or (`edge`) a point
// along and off one torso edge (the hips: on the hip edge only, so a
// folding waist doesn't move the legs). Front and side each have their own
// (attach / attachSide); a turn blends the two. Far-side joints in front
// view use the mirrored nodes.
function dpMix(a, T, mirror) {
  if (a.edge) {
    const [i, j] = mirror ? a.edge.map((n) => mirror[n]) : a.edge;
    const A = dpNode(T, i), d = sub(dpNode(T, j), A), v = mirror ? -a.v : a.v;
    return add(add(A, mul(d, a.u)), mul([-d[1], d[0]], v));
  }
  const idx = mirror ? a.idx.map((i) => mirror[i]) : a.idx;
  const [A, B, C] = idx.map((i) => dpNode(T, i));
  return add(add(mul(A, a.w[0]), mul(B, a.w[1])), mul(C, a.w[2]));
}
function dpAttach(M, T, which, far, turn) {
  const front = dpMix(M.attach[which], T, far ? M.mirror : null);
  if (!M.attachSide || turn === 0) return front;
  const s = M.attachSide[far && which === 'shoulder' ? 'shoulderFar' : which];
  return lerp(front, dpMix(s, T, null), turn);
}

// ---- one body, two drawings: shared heights
// The front and side torsos are two views of one body, with the same
// heights. A point of the body is (sideways X, height y, depth Z): the front
// drawing gives X, the side drawing gives Z. Posing (lean, chest bend)
// moves the body in the side plane, so the side view shows it directly and
// the front view takes each point's height from where the side view puts
// it. Points of the straight side torso are carried to the posed side torso
// piecewise-affinely, on triangles of torso nodes (as joints are).
const DP_TRI = [[0, 1, 8], [1, 2, 3], [1, 3, 8], [3, 4, 7], [3, 7, 8], [4, 5, 6], [4, 6, 7]];
function dpBary(P, A, B, C) {
  const v0 = sub(B, A), v1 = sub(C, A), v2 = sub(P, A);
  const d = v0[0] * v1[1] - v1[0] * v0[1];
  if (Math.abs(d) < 1e-12) return null;
  const b = (v2[0] * v1[1] - v1[0] * v2[1]) / d, c = (v0[0] * v2[1] - v2[0] * v0[1]) / d;
  return [1 - b - c, b, c];
}
function dpSideMap(T0, T1) {
  return (P) => {
    let best = null;
    for (const tri of DP_TRI) {
      const w = dpBary(P, ...tri.map((i) => dpNode(T0, i)));
      if (w && (!best || Math.min(...w) > Math.min(...best.w))) best = { tri, w };
    }
    const [A, B, C] = best.tri.map((i) => dpNode(T1, i));
    return add(add(mul(A, best.w[0]), mul(B, best.w[1])), mul(C, best.w[2]));
  };
}
// The straight side torso's depth at height y: centre and half-depth.
function dpSlice(M, y) {
  if (!M._side) Object.defineProperty(M, '_side', { value: dpFlat(M.torso.side, 16) });
  const P = M._side, xs = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length];
    if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) xs.push(a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]));
  }
  if (!xs.length) {                                  // above or below the outline: the nearest end
    const near = P.reduce((q, p) => (Math.abs(p[1] - y) < Math.abs(q[1] - y) ? p : q));
    return { zc: near[0], d: 0 };
  }
  const z0 = Math.min(...xs), z1 = Math.max(...xs);
  return { zc: (z0 + z1) / 2, d: (z1 - z0) / 2 };
}

// A limb part for this turn: its front and side shapes blended (each is
// drawn in its bone frame, node for node).
const dpTurn = (L, turn) => (turn <= 0 ? L.front : turn >= 1 ? L.side : dpLin(L.front, L.side, turn));

// Limbs can turn out of the paper (`out` on the shoulder and the hip,
// degrees, + = away from the body sideways). The limb then points along
//   (cos(out)·sin θ, cos(out)·cos θ, ±sin(out))   (forward, down, sideways)
// where θ is its angle in the side view. The shoulder's out applies to the
// whole arm (upper arm and forearm), the hip's to the whole leg. Each view
// is a flat projection of that: the side view keeps (forward, down), so the
// limb shortens by cos(out); the front view keeps (sideways, down). Only
// lengths change, never widths; hands and feet keep their size.
function dpProject(theta, out, front) {
  const c = Math.cos(out * RAD);
  if (!front) return { ang: theta, f: c };
  const h = Math.sin(out * RAD), v = c * Math.cos(theta * RAD);
  const f = Math.hypot(h, v);
  return { ang: f < 1e-6 ? 0 : Math.atan2(h, v) / RAD, f };
}
// Tail (species.tail; monkey): a tapering curl from `root`, as in the
// rule-based figure: it leaves backward, lifted by tail.lift, and curls by
// tail.curl along its length.
function dpTail(Tl, root, lean, pose) {
  let p = root;
  let theta = -90 - lean - pose.tail.lift;
  const n = Tl.segments, segLen = Tl.length / n;
  const wts = Array.from({ length: n }, (_, k) => Math.pow(k + 1, 1.7));
  const wsum = wts.reduce((a, b) => a + b, 0);
  const spine = [p], angles = [];
  for (let k = 0; k < n; k++) {
    theta -= pose.tail.curl * (wts[k] / wsum);
    angles.push(theta);
    p = add(p, mul(dir(theta), segLen));
    spine.push(p);
  }
  const left = [], right = [];
  for (let i = 0; i < spine.length; i++) {
    const w = Tl.w[0] + (Tl.w[1] - Tl.w[0]) * (i / (spine.length - 1));
    const nrm = dir(angles[Math.min(i, angles.length - 1)] + 90);
    left.push(add(spine[i], mul(nrm, w / 2)));
    right.push(add(spine[i], mul(nrm, -w / 2)));
  }
  const disc = (c, r) => Array.from({ length: 12 }, (_, i) => add(c, [Math.cos(i * Math.PI / 6) * r, Math.sin(i * Math.PI / 6) * r]));
  return [disc(spine[0], Tl.w[0] / 2), [...left, ...right.reverse()], disc(spine[spine.length - 1], Tl.w[1] / 2)];
}

// The least length factor for a limb part: about its own width.
const dpMinF = (L) => {
  if (L._minF == null) {
    const xs = L.front.flat().map((p) => p[0]);
    L._minF = 0.8 * (Math.max(...xs) - Math.min(...xs)) / L.len;
  }
  return L._minF;
};
const dpWrap = (v) => { while (v > 180) v -= 360; while (v <= -180) v += 360; return v; };

// S: the species (head size, tail); pose: the normalised SIDE pose (both
// views); bodyScale: the character's body scale.
// A character's body scale (characters.json `scale`): the torso and legs
// (thighs, shins, feet) and the tail scale by s; head, neck, arms and
// hands keep their size.
function dpScaled(M, s) {
  if (s === 1) return M;
  if (!M._scaled) Object.defineProperty(M, '_scaled', { value: new Map() });
  if (!M._scaled.has(s)) {
    const sc = (segs) => segs.map((g) => g.map((p) => [p[0] * s, p[1] * s]));
    const limb = (L) => ({ front: sc(L.front), side: sc(L.side), len: L.len * s });
    M._scaled.set(s, { ...M,
      torso: { front: sc(M.torso.front), side: sc(M.torso.side), frontBend: M.torso.frontBend.map(sc), sideBend: M.torso.sideBend.map(sc) },
      thigh: limb(M.thigh), shin: limb(M.shin), foot: { front: sc(M.foot.front), side: sc(M.foot.side) } });
  }
  return M._scaled.get(s);
}

export function buildParts(M0, S, pose, outfit = {}, view = 'side', bodyScale = 1) {
  const M = dpScaled(M0, bodyScale);
  const tailSpec = S.tail && (bodyScale === 1 ? S.tail : { ...S.tail, length: S.tail.length * bodyScale, w: S.tail.w.map((w) => w * bodyScale) });
  const front = view === 'front';
  const sp = pose.spine;                           // side-view spine: everything is measured in it
  const turn = front ? 0 : 1;
  // place a part drawn in its bone frame (bone pointing down) at `at`, bone
  // angle `ang`, its length scaled by f (width unchanged)
  const place = (segs, at, ang, m = 1, f = 1) => dpMap(segs, (p) => {
    const q = rot([p[0], p[1] * f], -ang);
    return add(at, [m * q[0], q[1]]);
  });

  // the posed side torso (both views need it) and the map onto it
  const TS = dpMap(partsTorso(M, 1, sp.chest), (p) => rot(p, sp.lean));
  const sideMap = dpSideMap(M.torso.side, TS);
  // a point of the body given by its side-drawing position: posed side position
  const posed = (P) => sideMap(P);

  let T, attachAt;
  if (!front) {
    T = TS;
    attachAt = (which, far) => dpAttach(M, T, which, far, 1);
  } else {
    // Front torso: X from the front drawing (turning toward the front-bend
    // drawing as the upper body tips toward the viewer), height from the
    // side view of the same slice of the body. A slice tipped toward the
    // viewer also shows its depth: the outline's top and bottom ends move
    // apart by it, so a torso seen end-on keeps about its thickness.
    const W = partsTorso(M, 0, Math.max(0, Math.min(M.bends[M.bends.length - 1], sp.lean + sp.chest)));
    const F = M.torso.front.map((s, i) => s.map((p, j) => [W[i][j][0], p[1]]));
    const ys = M.torso.front.map((s) => s[0][1]);
    const yTop = Math.min(...ys), yBot = Math.max(...ys);
    const yMid = (yTop + yBot) / 2, half = (yBot - yTop) / 2;
    const proj = (y) => {
      const { zc, d } = dpSlice(M, y);
      const c = posed([zc, y]), f = posed([zc + d, y]), b = posed([zc - d, y]);
      return { y: c[1], thick: Math.abs(f[1] - b[1]) / 2 };
    };
    const up = proj(yTop).y <= proj(yBot).y ? 1 : -1;     // top still above the hips?
    const cache = new Map();
    const height = (y) => {
      const key = Math.round(y * 1000);
      if (!cache.has(key)) {
        const r = proj(y), t = Math.max(-1, Math.min(1, (y - yMid) / half));
        cache.set(key, r.y + r.thick * t * up);
      }
      return cache.get(key);
    };
    T = F.map((s) => s.map((p) => [p[0], height(p[1])]));
    // joints: X from the front anchors, height from the side anchors
    const sideP = (which, far) => {
      const a = M.attachSide?.[far && which === 'shoulder' ? 'shoulderFar' : which];
      return a ? dpMix(a, M.torso.side, null) : null;
    };
    attachAt = (which, far) => {
      const x = dpMix(M.attach[which], F, far ? M.mirror : null)[0];
      const P = sideP(which, far);
      return [x, P ? posed(P)[1] : height(dpMix(M.attach[which], F, far ? M.mirror : null)[1])];
    };
  }
  const limbs = {};
  for (const s of ['near', 'far']) {
    const far = s === 'far';
    const m = front && far ? -1 : 1;           // front view: far limbs to picture-left
    const dirM = (t) => { const d = dir(t); return [m * d[0], d[1]]; };
    const a = pose[s].arm, l = pose[s].leg;
    const sh = attachAt('shoulder', far), hp = attachAt('hip', far);
    // side-view angles of each segment, then projected for this view
    const su = -(sp.lean + sp.chest) + a.shoulder, sl = su + a.elbow;
    const st = -sp.lean + l.hip, ss = st - l.knee;
    // a limb seen end-on keeps at least about its own width in length (it
    // reads as the limb's round end, not a sliver)
    // (only the drawn part; the joints stay where the projection puts them)
    const pj = (L, theta, o) => { const r = dpProject(theta, o, front); r.draw = Math.max(r.f, dpMinF(L)); return r; };
    const U = pj(M.upperArm, su, a.out), Lo = pj(M.forearm, sl, a.out);
    const Th = pj(M.thigh, st, l.out), Sh = pj(M.shin, ss, l.out);
    // toward the viewer of the front view (+) or away (-): the forward reach
    const dz = (theta, o) => Math.cos(o * RAD) * Math.sin(theta * RAD);
    const dU = dz(su, a.out), dL = dz(sl, a.out), dT = dz(st, l.out), dS = dz(ss, l.out);
    const th = front ? Lo.ang : sl + a.wrist;
    // Foot (keeps its size). Side view: the ankle angle as given. Front
    // view: heights are shared between the views, so the front foot is
    // turned until its lowest point sits as far below the ankle as the side
    // foot's does (scaled by cos out), staying as close to flat as it can.
    let ankle = l.ankle;
    if (front) {
      const low = (segs, r) => Math.max(...dpFlat(segs, 4).map((p) => rot(p, -r)[1]));
      const want = low(M.foot.side, l.ankle) * Math.cos(l.out * RAD);
      let best = 0, err = Infinity;
      for (let r = -120; r <= 120; r += 1) {
        const e = Math.abs(low(M.foot.front, r) - want) + Math.abs(r) * 1e-4;
        if (e < err) { err = e; best = r; }
      }
      ankle = best;
    }
    const E = add(sh, mul(dirM(U.ang), M.upperArm.len * U.f)), Wr = add(E, mul(dirM(Lo.ang), M.forearm.len * Lo.f));
    const Kn = add(hp, mul(dirM(Th.ang), M.thigh.len * Th.f)), A = add(Kn, mul(dirM(Sh.ang), M.shin.len * Sh.f));
    const foot = dpTurn(M.foot, turn);
    const hands = { front: M.hands.front[a.hand] || M.hands.front.fist, side: M.hands.side[a.hand] || M.hands.side.fist };
    limbs[s] = { joints: { sh, E, Wr, hp, Kn, A },
      arm: [
        ['upper-arm', place(dpTurn(M.upperArm, turn), sh, U.ang, m, U.draw), dU],
        ['forearm', place(dpTurn(M.forearm, turn), E, Lo.ang, m, Lo.draw), dL],
        // the pointing finger always goes on the side toward the body (the
        // drawn point hand has it outside, so it is mirrored across the forearm)
        ['hand', a.hand === 'point' ? place(dpMap(dpTurn(hands, turn), (p) => [-p[0], p[1]]), Wr, th, m) : place(dpTurn(hands, turn), Wr, th, m), dL],
      ],
      // the shin goes behind the thigh (drawn first), in every view
      // the shin goes behind the thigh (drawn first), in every view
      leg: [
        ['shin', place(dpTurn(M.shin, turn), Kn, Sh.ang, m, Sh.draw), dS],
        // the foot keeps its angle from the ground; drawn flat = ankle 0
        ['foot', dpMap(foot, (p) => { const q = rot(p, -ankle); return add(A, [m * q[0], q[1]]); }), dS],
        ['thigh', place(dpTurn(M.thigh, turn), hp, Th.ang, m, Th.draw), dT],
      ],
    };
  }
  // Neck and head: the side pose's directions; the front view shows their
  // up-down part (a neck tipped toward the viewer shortens, one past
  // level points down; the face turns over when the head is upside down).
  const up3 = 180 - (sp.lean + sp.chest + sp.neck);
  const sideHead = sp.lean + sp.chest + sp.neck + sp.head;
  const nb = attachAt('neck', false);
  let neckAng = up3, neckF = 1, headRot = sideHead, headOff = dir(180 - sideHead);
  if (front) {
    const v = Math.cos(up3 * RAD);                       // up-down part of the neck
    neckAng = v <= 0 ? 180 : 0; neckF = Math.max(Math.abs(v), 0.5);
    headOff = [0, -Math.cos(sideHead * RAD)];
    headRot = Math.cos(sideHead * RAD) < 0 ? 180 : 0;
  }
  const neckTop = add(nb, mul(dir(neckAng), M.neck.len * (front ? Math.abs(Math.cos(up3 * RAD)) : 1)));
  const H = add(neckTop, mul(headOff, 0.21));
  const lean = front ? 0 : sp.lean;

  // Outfit: the lower cloth covers the thighs only (no loincloth);
  // a full top puts the torso in the cloth colour.
  const fullTop = outfit.top === 'full';
  const out = [];
  const item = (part, segs, s) => ({ segs, role: part === 'thigh' ? 'cloth' : 'body', part: `${s}-${part}` });
  const push = (L, kind, s) => L[kind].forEach(([part, segs]) => out.push(item(part, segs, s)));
  const pushTorso = () => out.push(
    { segs: place(M.neck.segs, nb, neckAng, 1, neckF), role: 'body', part: 'neck' },
    { segs: T, role: fullTop ? 'cloth' : 'body', top: fullTop, part: 'torso' });
  const hh = S.head.size / 2, hw = hh * (S.head.width ?? 1);
  const headShape = { role: 'body', head: true, headPart: true, part: 'head',
    pts: [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map((q) => add(H, rot(q, headRot))) };
  // Draw order. Side view: far arm, far leg, near leg, torso (over the
  // legs, so a forward bend covers the thighs), head, near arm.
  // Front view, by depth: legs go under the torso and arms over it, except
  // a part reaching toward the viewer (forward reach > 0.5) comes over the
  // torso and one reaching away (< -0.5) goes under it; a torso leaning
  // back goes behind all the legs.
  const torsoBack = sp.lean + sp.chest / 2 < 0;
  // tail root: behind the pelvis (side view: toward the back hip corner)
  const tail = tailSpec ? dpTail(tailSpec, front ? [0, -0.1 * bodyScale] : add(lerp([0, 0], dpNode(T, 5), 0.75), rot([0, -0.12 * bodyScale], lean)), lean, pose) : [];
  const pushTail = () => tail.forEach((pts) => out.push({ pts, role: 'body', part: 'tail' }));
  if (front) {
    pushTail();
    const under = [], over = [];
    for (const kind of ['leg', 'arm']) for (const s of ['far', 'near']) for (const [part, segs, d] of limbs[s][kind]) {
      const on = kind === 'leg' ? torsoBack || d > 0.5 : d >= -0.5;
      (on ? over : under).push(item(part, segs, s));
    }
    out.push(...under); pushTorso(); out.push(...over, headShape);
  } else {
    push(limbs.far, 'arm', 'far'); push(limbs.far, 'leg', 'far'); pushTail(); push(limbs.near, 'leg', 'near'); pushTorso();
    out.push(headShape); push(limbs.near, 'arm', 'near');
  }
  for (const s of out) if (s.segs) { s.pts = dpFlat(s.segs); }
  return { shapes: out, H, headRot, joints: { near: limbs.near.joints, far: limbs.far.joints } };
}

const dpF = (v) => (Math.round(v * 1000) / 1000).toString();
// Cubic segments -> SVG path data (the drawn curves, not sampled).
export function dpSegD(segs) {
  return `M${dpF(segs[0][0][0])} ${dpF(segs[0][0][1])}` + segs.map(([, b, c, d]) =>
    `C${dpF(b[0])} ${dpF(b[1])} ${dpF(c[0])} ${dpF(c[1])} ${dpF(d[0])} ${dpF(d[1])}`).join('') + 'Z';
}
