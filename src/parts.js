// Drawn-parts figures: every body part is the artist's own outline
// (data/parts/<id>.svg, imported by tools/import-parts.mjs into
// data/parts.json), placed rigidly on the skeleton. The torso is
// interpolated between four drawn keys: front / side (turn) × straight /
// bent forward (bend). src/figure.js (buildShapes) turns the result into a
// figure's shapes.
//
// Names here are prefixed (dp…) because the labs concatenate the renderer
// modules into one script.

import { RAD, dir, add, sub, mul, lerp, rot } from './geom.js';
import { headMatrix } from './headturn.js';

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
// round the waist (polar blend). It never goes past the drawings: an arch
// back keeps the straight torso, a bend past the deepest drawn one keeps
// that one (the pose's chest angle still turns the arms, neck and head).
export function partsTorso(M, turn, deg) {
  const keys = [dpLin(M.torso.front, M.torso.side, turn),
    ...M.torso.frontBend.map((fb, i) => dpLin(fb, M.torso.sideBend[i], turn))];
  const at = [0, ...M.bends];
  deg = Math.max(0, Math.min(deg, at[at.length - 1]));   // between straight and the deepest drawn bend
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
// The elbow and the knee turn the lower part further out of the paper
// (`arm.elbowOut`, `leg.kneeOut`, degrees, + away from the body): the
// forearm (and hand) points out by out + elbowOut, the shin by out +
// kneeOut. The upper part and the joint between them don't move.
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
function dpTail(Tl, root, lean, pose, front) {
  // the tail curls in its own plane (lift, curl); each view is a
  // projection of it
  let p = root;
  let theta = -90 - lean - pose.tail.lift;
  const n = Tl.segments, segLen = Tl.length / n;
  const wts = Array.from({ length: n }, (_, k) => Math.pow(k + 1, 1.7));
  const wsum = wts.reduce((a, b) => a + b, 0);
  const side = [p];
  for (let k = 0; k < n; k++) {
    theta -= pose.tail.curl * (wts[k] / wsum);
    p = add(p, mul(dir(theta), segLen));
    side.push(p);
  }
  // the tail's plane is turned by tail.turn about the upright axis, toward
  // the far side: the side view sees cos(turn) of its reach, the front view
  // sin(turn) of it (to picture-left)
  const tr = (pose.tail.turn ?? 35) * RAD;
  const spine = side.map((q) => {
    const dz = q[0] - root[0];
    return front ? [dz * Math.sin(tr), q[1]] : [root[0] + dz * Math.cos(tr), q[1]];
  });
  const left = [], right = [];
  let nrm = [1, 0];
  for (let i = 0; i < spine.length; i++) {
    const a = spine[Math.max(0, i - 1)], b = spine[Math.min(spine.length - 1, i + 1)];
    const d = sub(b, a), L = Math.hypot(d[0], d[1]);
    if (L > 1e-6) nrm = [-d[1] / L, d[0] / L];        // keeps the last good normal where the tail runs end-on
    const w = Tl.w[0] + (Tl.w[1] - Tl.w[0]) * (i / (spine.length - 1));
    left.push(add(spine[i], mul(nrm, w / 2)));
    right.push(add(spine[i], mul(nrm, -w / 2)));
  }
  const disc = (c, r) => Array.from({ length: 12 }, (_, i) => add(c, [Math.cos(i * Math.PI / 6) * r, Math.sin(i * Math.PI / 6) * r]));
  return [disc(spine[0], Tl.w[0] / 2), [...left, ...right.reverse()], disc(spine[spine.length - 1], Tl.w[1] / 2)];
}

// Which drawing a part shows (step 5, 2026-11-06): each limb part, hand
// and foot is drawn three ways, front, side and end-on (layer end), and the
// view picks a blend by where the part itself points in 3D, not by the
// view alone. A part's frame (X sideways, + toward the near side; Y down;
// Z forward) at rest hangs down (Y) with its front drawing seen from +Z and
// its side drawing from +X (its outer side). The pose turns it by θ in the
// side plane (about X), then by `out` sideways (about the turned Z), then
// by `twist` about its own axis (hands: arm.twist). The camera looks from
// +Z (front view) or +X (side view); seen in the part's frame it gives
//   end   = |c·axis|              (pointing at or away from the viewer)
//   side  = |c·outer side|, front = |c·front|   (the turn between them)
function dpLook(theta, out, sgn, twist, front) {
  const th = theta * RAD, ou = out * RAD, tw = twist * RAD;
  const ds = [0, Math.cos(th), Math.sin(th)], Zp = [0, -Math.sin(th), Math.cos(th)], Xo = [sgn, 0, 0];
  const d = ds.map((v, i) => Math.cos(ou) * v + Math.sin(ou) * Xo[i]);
  const X0 = Xo.map((v, i) => Math.cos(ou) * v - Math.sin(ou) * ds[i]);
  const Z = Zp.map((v, i) => Math.cos(tw) * v + Math.sin(tw) * X0[i]);
  const X = X0.map((v, i) => Math.cos(tw) * v - Math.sin(tw) * Zp[i]);
  const k = front ? 2 : 0;                        // the camera axis
  const cy = d[k], cx = Math.abs(X[k]), cz = Math.abs(Z[k]);
  const f = Math.sqrt(Math.max(0, 1 - cy * cy));  // length seen
  const turn = cx + cz < 1e-9 ? 0 : Math.atan2(cx, cz) / (Math.PI / 2);
  return { f, turn };
}
// A part's outline for this look, in its bone frame (bone pointing down,
// origin at its upper joint): front and side blended by the turn, then
// toward the end-on drawing as the part turns toward the viewer. Its length
// shows as f; the end-on drawing sits on the upper joint, where the bone
// shrinks to a point, so a part seen fully end-on is that drawing:
//   x = lerp(x_side/front, x_end, 1 − f),  y = f·y_side/front + (1 − f)·y_end
function dpShape(L, look) {
  const lat = dpTurn(L, look.turn), f = look.f, w = 1 - f;
  if (!L.end) return lat.map((s) => s.map((p) => [p[0], p[1] * f]));
  return lat.map((s, i) => s.map((p, j) => { const e = L.end[i][j]; return [p[0] * f + e[0] * w, p[1] * f + e[1] * w]; }));
}
// Reorder cubic segments to match `ref` node for node, by each node's
// direction from the shape's centre (any start node, either direction).
function dpMatchRound(segs, ref) {
  const ctr = (S) => mul(S.reduce((a, g) => add(a, g[0]), [0, 0]), 1 / S.length);
  const angs = (S) => { const c = ctr(S); return S.map((g) => Math.atan2(g[0][1] - c[1], g[0][0] - c[0])); };
  const ra = angs(ref);
  const rev = [...segs].reverse().map((g) => [...g].reverse());
  let best = null;
  for (const S of [segs, rev]) for (let k = 0; k < S.length; k++) {
    const r = S.slice(k).concat(S.slice(0, k)), a = angs(r);
    const e = a.reduce((acc, v, i) => { let d = Math.abs(v - ra[i]) % (2 * Math.PI); if (d > Math.PI) d = 2 * Math.PI - d; return acc + d; }, 0);
    if (!best || e < best.e) best = { r, e };
  }
  return best.r;
}

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
    const limb = (L) => ({ front: sc(L.front), side: sc(L.side), ...(L.end ? { end: sc(L.end) } : {}), len: L.len * s });
    const footEnd = M.foot.end && { ...M.foot.end, up: sc(M.foot.end.up), down: sc(M.foot.end.down), toe: M.foot.end.toe.map((v) => v * s) };
    M._scaled.set(s, { ...M,
      torso: { front: sc(M.torso.front), side: sc(M.torso.side), frontBend: M.torso.frontBend.map(sc), sideBend: M.torso.sideBend.map(sc) },
      thigh: limb(M.thigh), shin: limb(M.shin), foot: { front: sc(M.foot.front), side: sc(M.foot.side), ...(footEnd ? { end: footEnd } : {}) } });
  }
  return M._scaled.get(s);
}

const NECK_STRETCH = 1.5;
export function buildParts(M0, S, pose, outfit = {}, view = 'side', bodyScale = 1, who = null) {
  const M = dpScaled(M0, bodyScale);
  const tailSpec = S.tail && (bodyScale === 1 ? S.tail : { ...S.tail, length: S.tail.length * bodyScale, w: S.tail.w.map((w) => w * bodyScale) });
  const front = view === 'front';
  const sp = pose.spine;                           // side-view spine: everything is measured in it
  // place a part drawn in its bone frame (bone pointing down) at `at`, bone
  // angle `ang`, its length scaled by f (width unchanged)
  const place = (segs, at, ang, m = 1, f = 1) => dpMap(segs, (p) => {
    const q = rot([p[0], p[1] * f], -ang);
    return add(at, [m * q[0], q[1]]);
  });
  const placeCap = (segs, at, ang, m, f, bodyAng) => {
    // The more the limb turns away from the body, the more its top end
    // folds into the body: shortened by cos(angle between them), flat at
    // 90° and beyond. (Turning the cap with the body folded or twisted the
    // outline at large angles.)
    // Front view: no folding (the projected angle is not the angle at the
    // hip; a thigh toward the viewer keeps its round top over the hip).
    const k = bodyAng == null ? 1 : Math.max(0, Math.cos((bodyAng - ang) * RAD));
    return dpMap(segs, (p) => {
      const q = rot([p[0], p[1] < 0 ? p[1] * k : p[1] * f], -ang);
      return add(at, [m * q[0], q[1]]);
    });
  };
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
    // Front torso: the artist's front drawings (straight and front-bend),
    // picked by how far the upper body tips toward (or away from) the
    // viewer, lean + chest, folded at 90° (pointing at the viewer); the
    // deepest drawing is reached at 90°. Past 90° the upper body points
    // down, so the drawing turns over about the pelvis. Heights are the
    // drawings' own (they need not match the side view).
    const tilt = Math.abs(sp.lean + sp.chest) % 360;
    const t180 = tilt > 180 ? 360 - tilt : tilt;          // 0..180
    const e = t180 > 90 ? 180 - t180 : t180;              // 0..90
    const at = M.bends, last = at[at.length - 1], prev = at.length > 1 ? at[at.length - 2] : 0;
    const deg = e <= prev ? e : prev + (e - prev) * (last - prev) / (90 - prev);
    const flip = t180 > 90 ? -1 : 1;
    T = dpMap(partsTorso(M, 0, deg), (p) => [p[0], p[1] * flip]);
    attachAt = (which, far) => dpAttach(M, T, which, far, 0);
  }
  // 3D joints for depth: the side view's place (Y, Z) and the front
  // anchors' sideways offset (X). In the side view one hip point serves
  // both legs, but in 3D each hip keeps its own sideways offset.
  const Fs = M.torso.front;
  const sideJ = (which, far) => {
    const a = M.attachSide?.[far && which === 'shoulder' ? 'shoulderFar' : which];
    return posed(a ? dpMix(a, M.torso.side, null) : dpMix(M.attach[which], M.torso.side, far ? M.mirror : null));
  };
  const joint3 = (which, far) => {
    const p = sideJ(which, far), x = dpMix(M.attach[which], Fs, far ? M.mirror : null)[0];
    return [x, p[1], p[0]];
  };
  // Two-handed grip (prop.grip 'both'): the other arm is solved in 3D so
  // its hand closes on the hilt just below the holding hand, pointing the
  // same way; its own pose angles are ignored — except `elbowOut`, the
  // elbow's free swivel about the pinned hand: it swings the upper arm
  // further out and the forearm's out compensates, so the hand stays on
  // the hilt. An arm keeps one `out` for both bones, so its hand's
  // sideways reach is (upper + forearm) × sin out: that fixes out, and
  // the rest is a two-bone reach in the arm's plane.
  const armOf = { near: pose.near.arm, far: pose.far.arm };
  for (const hs of ['near', 'far']) {
    const A = armOf[hs], P = A.prop;
    if (!P || P.grip !== 'both') continue;
    const os = hs === 'near' ? 'far' : 'near';
    const v3 = (theta, o, sg) => [sg * Math.sin(o * RAD), Math.cos(o * RAD) * Math.cos(theta * RAD), Math.cos(o * RAD) * Math.sin(theta * RAD)];
    const add3 = (p, d, L) => [p[0] + d[0] * L, p[1] + d[1] * L, p[2] + d[2] * L];
    const sg1 = hs === 'far' ? -1 : 1, sg2 = -sg1;
    const t0 = -(sp.lean + sp.chest), su = t0 + A.shoulder, sl = su + A.elbow, sh = sl + A.wrist, tp = sh + (P.angle ?? 0);
    const S1 = joint3('shoulder', hs === 'far'), S2 = joint3('shoulder', os === 'far');
    const oL = A.out + (A.elbowOut ?? 0);                          // the forearm's own out
    const E1 = add3(S1, v3(su, A.out, sg1), M.upperArm.len), W1 = add3(E1, v3(sl, oL, sg1), M.forearm.len);
    const grip = add3(W1, v3(sh, oL, sg1), 0.18);
    const pd = v3(tp, oL + (P.out ?? 0), sg1);
    const W2 = add3(grip, pd, -0.42);                               // the other wrist: below the hand, along the hilt
    const L1 = M.upperArm.len, L2 = M.forearm.len, D = [W2[0] - S2[0], W2[1] - S2[1], W2[2] - S2[2]];
    const so = Math.max(-1, Math.min(1, sg2 * D[0] / (L1 + L2))), o2 = Math.asin(so) / RAD;
    const cl = (v) => Math.max(-1, Math.min(1, v));
    const sw = pose[os].arm.elbowOut || 0;                         // the elbow's swivel (+ away from the body)
    // the swivel keeps both bones within ±75° of the paper, so neither
    // collapses edge-on; past that the hand could no longer stay on the hilt
    const sM = Math.sin(75 * RAD);
    const lo = Math.max(-sM, (so * (L1 + L2) - L2 * sM) / L1), hi = Math.min(sM, (so * (L1 + L2) + L2 * sM) / L1);
    if (sw && lo <= hi) {
      const oU = Math.asin(Math.max(lo, Math.min(hi, Math.sin((o2 + sw) * RAD)))) / RAD;
      const oF = Math.asin(cl((so * (L1 + L2) - L1 * Math.sin(oU * RAD)) / L2)) / RAD;
      const a = L1 * Math.cos(oU * RAD) || 1e-6, b = L2 * Math.cos(oF * RAD) || 1e-6;
      const d = Math.min(Math.hypot(D[1], D[2]), a + b - 1e-6);
      const e = Math.acos(cl((d * d - a * a - b * b) / (2 * a * b))) / RAD;
      const al = Math.acos(cl((a * a + d * d - b * b) / (2 * a * d))) / RAD;
      const phi = Math.atan2(D[2], D[1]) / RAD, su2 = phi - al;
      armOf[os] = { ...pose[os].arm, shoulder: su2 - t0, elbow: e, wrist: tp - (su2 + e), out: oU, elbowOut: oF - oU, twist: 0, hand: 'fist' };
    } else {
      const co = Math.cos(o2 * RAD) || 1e-6;
      const y = D[1] / co, z = D[2] / co, a = L1, b = L2;         // in the arm's plane
      const d = Math.min(Math.hypot(y, z), a + b - 1e-6);
      const e = Math.acos(cl((d * d - a * a - b * b) / (2 * a * b))) / RAD;
      const al = Math.acos(cl((a * a + d * d - b * b) / (2 * a * d))) / RAD;
      const phi = Math.atan2(z, y) / RAD, su2 = phi - al;
      armOf[os] = { ...pose[os].arm, shoulder: su2 - t0, elbow: e, wrist: tp - (su2 + e), out: o2, elbowOut: 0, twist: 0, hand: 'fist' };
    }
    delete armOf[os].prop;
  }
  const limbs = {};
  for (const s of ['near', 'far']) {
    const far = s === 'far';
    const m = front && far ? -1 : 1;           // front view: far limbs to picture-left
    const dirM = (t) => { const d = dir(t); return [m * d[0], d[1]]; };
    const a = armOf[s], l = pose[s].leg;
    const sh = attachAt('shoulder', far), hp = attachAt('hip', far);
    // side-view angles of each segment, then projected for this view
    const su = -(sp.lean + sp.chest) + a.shoulder, sl = su + a.elbow;
    const st = -sp.lean + l.hip, ss = st - l.knee;
    const pj = (theta, o) => dpProject(theta, o, front);
    const ao = a.out + (a.elbowOut ?? 0), lo = l.out + (l.kneeOut ?? 0);   // forearm / shin out
    const U = pj(su, a.out), Lo = pj(sl, ao);
    const Th = pj(st, l.out), Sh = pj(ss, lo);
    // the hand: its own direction (forearm + wrist), turned about its axis
    // by arm.twist
    const sh_ = sl + a.wrist, Hd = pj(sh_, ao);
    const sgn = far ? -1 : 1;
    const look = (theta, o, tw = 0) => dpLook(theta, o, sgn, tw, front);
    const v3 = (theta, o) => [sgn * Math.sin(o * RAD), Math.cos(o * RAD) * Math.cos(theta * RAD), Math.cos(o * RAD) * Math.sin(theta * RAD)];
    const add3 = (p, d, L) => [p[0] + d[0] * L, p[1] + d[1] * L, p[2] + d[2] * L];
    const sh3 = joint3('shoulder', far), hp3 = joint3('hip', far);
    const E3 = add3(sh3, v3(su, a.out), M.upperArm.len), W3 = add3(E3, v3(sl, ao), M.forearm.len);
    const K3 = add3(hp3, v3(st, l.out), M.thigh.len), A3 = add3(K3, v3(ss, lo), M.shin.len);
    const mid3 = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
    const dU = mid3(sh3, E3), dL = mid3(E3, W3), dH = W3, dT = mid3(hp3, K3), dS = mid3(K3, A3), dF = A3;
    // Foot (keeps its size, drawn flat on the ankle; step 3): a blend of
    // its three drawings by where it points, like the limbs. Its frame: toes
    // F, sole normal N (down out of the sole), outer side X; at rest F
    // forward, N down. leg.toe turns the toes about the vertical (+ out,
    // away from the body), the ankle then lifts them (+) about X. The
    // camera c gives the weights (c·F)² for the front drawing (toes at the
    // viewer), (c·X)² for the side drawing, (c·N)² for the sole; each
    // drawing is turned in the picture to match: the side drawing and the
    // sole by where the toes point, the front drawing by where the sole
    // faces. Not turned by the leg's out (a foot stays flat).
    // the side drawing mirrored (toes pointing the other way), its nodes
    // matched again to the front drawing (mirroring reverses their order)
    if (!M.foot._sideMirror) Object.defineProperty(M.foot, '_sideMirror', { value: dpMatchRound(dpMap(M.foot.side, (p) => [-p[0], p[1]]), M.foot.front) });
    const footSegs = (() => {
      const tau = (l.toe ?? 0) * RAD, an = l.ankle * RAD;
      const F0 = [Math.sin(tau), 0, Math.cos(tau)], X = [Math.cos(tau), 0, -Math.sin(tau)], N0 = [0, 1, 0];
      const F = F0.map((v, i) => v * Math.cos(an) - N0[i] * Math.sin(an)), N = N0.map((v, i) => v * Math.cos(an) + F0[i] * Math.sin(an));
      const k = front ? 2 : 0, pr = (v) => (front ? [v[0], v[1]] : [v[2], v[1]]);
      const w = [F[k] ** 2, X[k] ** 2, N[k] ** 2];
      const ang = (v) => Math.atan2(v[1], v[0]) / RAD;
      // turn `segs` so that `ref` (a drawn direction) points along `to` (seen); mirror when it points left
      const turnTo = (segs, ref, to) => {
        if (Math.hypot(...to) < 1e-6) return segs;
        return dpMap(segs, (p) => rot(p, ang(to) - ang(ref)));
      };
      const fT = pr(F);
      const sideD = fT[0] < 0 ? turnTo(M.foot._sideMirror, [-1, 0], fT) : turnTo(M.foot.side, [1, 0], fT);
      const frontD = turnTo(M.foot.front, [0, 1], pr(N));
      const E = M.foot.end;
      const soleD = E ? turnTo(fT[1] < 0 ? E.up : E.down, [E.toe[0], E.toe[1]], fT) : frontD;
      return M.foot.front.map((g, i) => g.map((_, j) => {
        const a1 = frontD[i][j], b1 = sideD[i][j], c1 = soleD[i][j];
        return [w[0] * a1[0] + w[1] * b1[0] + w[2] * c1[0], w[0] * a1[1] + w[1] * b1[1] + w[2] * c1[1]];
      }));
    })();
    const E = add(sh, mul(dirM(U.ang), M.upperArm.len * U.f)), Wr = add(E, mul(dirM(Lo.ang), M.forearm.len * Lo.f));
    const Kn = add(hp, mul(dirM(Th.ang), M.thigh.len * Th.f)), A = add(Kn, mul(dirM(Sh.ang), M.shin.len * Sh.f));
    const hands = { front: M.hands.front[a.hand] || M.hands.front.fist, side: M.hands.side[a.hand] || M.hands.side.fist,
      end: (M.hands.end && (M.hands.end[a.hand] || M.hands.end.fist)) || undefined };
    // the pointing finger always goes on the side toward the body (the
    // drawn point hand has it outside, so it is mirrored across the forearm)
    const handSegs = dpShape(hands, look(sh_, ao, a.twist));
    // the grip: the middle of the hand, for a held prop (arm.prop)
    const grip = add(Wr, mul(dirM(Hd.ang), 0.18 * Hd.f));
    const footPlaced = dpMap(footSegs, (p) => add(A, [m * p[0], p[1]]));
    // the foot's lowest point (control nodes): tells whether it touches the ground
    const low = footPlaced.flat().reduce((q, p) => (p[1] > q[1] ? p : q), A);
    limbs[s] = { joints: { sh, E, Wr, hp, Kn, A, grip, low }, grip, held: { theta: sh_, out: ao, prop: a.prop, m, dirM, d3: dH },
      arm: [
        ['upper-arm', place(dpShape(M.upperArm, look(su, a.out)), sh, U.ang, m), dU],
        ['forearm', place(dpShape(M.forearm, look(sl, ao)), E, Lo.ang, m), dL],
        ['hand', place(a.hand === 'point' ? dpMap(handSegs, (p) => [-p[0], p[1]]) : handSegs, Wr, Hd.ang, m), dH],
      ],
      // the shin goes behind the thigh (drawn first), in every view
      leg: [
        ['shin', place(dpShape(M.shin, look(ss, lo)), Kn, Sh.ang, m), dS],
        // the foot keeps its angle from the ground; drawn flat = ankle 0
        ['foot', footPlaced, dF],
        ['thigh', placeCap(dpShape(M.thigh, look(st, l.out)), hp, Th.ang, m, 1, front ? null : -sp.lean), dT],
      ],
    };
  }
  // Held props (arm.prop: sword, club or bow, or a variant: "club-spike"). The pose places a reference
  // line through the hand's grip; the weapon drawing (data/props/held/
  // <kind>.svg: the character's own layer, else base) is laid along it by
  // its own line (straight for a sword or club, curved for a bow). The line turns with the hand: its
  // direction is the hand's side-view angle + prop.angle, out of the paper
  // by the arm's out + prop.out; each view is its projection (lengths
  // shorten, widths stay). A bow's belly faces away from the hip; in the
  // front view the bow is seen nearly edge-on. A drawn bow (prop.draw) has
  // its string pulled to the other hand, with an arrow.
  const HELD = S.held;
  for (const s of ['near', 'far']) {
    const H = limbs[s].held, P = H.prop;
    // the character's own version of the weapon, else the base one
    const V = P && HELD?.[P.kind], W = V && (V[who] || V.base), bow = P?.kind.split('-')[0] === 'bow';
    if (!W) continue;
    const pr = dpProject(H.theta + (P.angle ?? 0), H.out + (P.out ?? 0), front);
    const u = H.dirM(pr.ang), g = limbs[s].grip;
    let v = [-u[1], u[0]];
    if (bow && (g[0] - limbs[s].joints.hp[0]) * v[0] + (g[1] - limbs[s].joints.hp[1]) * v[1] < 0) v = mul(v, -1);
    const ky = bow && front ? 0.15 : 1;
    const Mx = [u[0] * pr.f, u[1] * pr.f, v[0] * ky, v[1] * ky, g[0], g[1]];
    const at = (q) => [Mx[0] * q[0] + Mx[2] * q[1] + Mx[4], Mx[1] * q[0] + Mx[3] * q[1] + Mx[5]];
    limbs[s].arm.push(['prop', { markup: W.svg, mx: Mx, pts: W.pts.map(at) }, H.d3]);
    if (bow) {
      const poly = (pts) => pts.map((p, i) => { const q = pts[(i + 1) % pts.length]; return [p, lerp(p, q, 1 / 3), lerp(p, q, 2 / 3), q]; });
      const band = (pl, w) => {
        const L = [], R = [];
        pl.forEach((p, i) => {
          const a = pl[Math.max(0, i - 1)], b = pl[Math.min(pl.length - 1, i + 1)];
          const d = sub(b, a), n = Math.hypot(d[0], d[1]) || 1, nn = [-d[1] / n * w / 2, d[0] / n * w / 2];
          L.push(add(p, nn)); R.push(sub(p, nn));
        });
        return poly([...L, ...R.reverse()]);
      };
      const [T1, T2] = W.tips.map(at);
      const other = limbs[s === 'near' ? 'far' : 'near'].grip;
      if (P.draw) {
        limbs[s].arm.push(['prop', band([T1, other, T2], 0.025), H.d3]);
        // the shaft rests on top of the bow fist, not through its middle:
        // nock at the string hand, pass point the grip lifted a half-fist
        const d0 = sub(g, other), l0 = Math.hypot(d0[0], d0[1]) || 1, a0 = mul(d0, 1 / l0), n0 = [-a0[1], a0[0]];
        const rest = add(g, mul(n0, n0[1] > 0 ? -0.08 : 0.08));
        const d = sub(rest, other), dl = Math.hypot(d[0], d[1]) || 1, ad = mul(d, 1 / dl), ap = [-ad[1], ad[0]];
        const tip = add(rest, mul(ad, 0.35));
        limbs[s].arm.push(['prop', band([other, tip], 0.03), H.d3]);
        limbs[s].arm.push(['prop', poly([add(tip, mul(ad, 0.14)), add(tip, mul(ap, 0.06)), add(tip, mul(ap, -0.06))]), H.d3]);
      } else limbs[s].arm.push(['prop', band([T1, T2], 0.025), H.d3]);
    }
    // the fist goes over the weapon it holds: the hand is drawn last
    const arm = limbs[s].arm;
    arm.push(...arm.splice(arm.findIndex(([part]) => part === 'hand'), 1));
  }
  // Neck and head in 3D. The neck leans with lean + chest + neck in the side
  // plane; each view is its projection (the front view sees its up-down
  // part, so a neck tipped toward the viewer shortens). The head tilts by
  // lean + chest + neck + head and turns by spine.turn (src/headturn.js,
  // headMatrix); its centre sits where the parts' `head` / `side-head`
  // anchors put it from the neck top (front x, side depth), turned with it.
  const tn = (sp.lean + sp.chest + sp.neck) * RAD;
  const sideHead = sp.lean + sp.chest + sp.neck + sp.head;
  const turnH = sp.turn ?? 0;
  const nb = attachAt('neck', false);
  const neckV = front ? [0, -Math.cos(tn)] : [Math.sin(tn), -Math.cos(tn)];   // unit neck as seen
  const neckF = Math.hypot(...neckV), neckAng = neckF < 1e-6 ? 180 : Math.atan2(neckV[0], neckV[1]) / RAD;
  // the neck is drawn 1.5 × its drawn length (style bible §6: a slightly longer neck)
  const neckLen = M.neck.len * NECK_STRETCH;
  const neckTop = add(nb, mul(neckV, neckLen));
  const hA = M.headAt || { front: [0, -0.21], side: [0, -0.21] };
  const hO = [hA.front[0], (hA.front[1] + hA.side[1]) / 2, hA.side[0]];      // head centre from the neck top (head-local)
  const headR = headMatrix(sideHead, turnH, front);
  const H = add(neckTop, [headR[0][0] * hO[0] + headR[0][1] * hO[1] + headR[0][2] * hO[2], headR[1][0] * hO[0] + headR[1][1] * hO[1] + headR[1][2] * hO[2]]);
  const headRot = front ? (Math.cos(sideHead * RAD) < 0 ? 180 : 0) : sideHead;     // the guide head only
  const lean = front ? 0 : sp.lean;

  // Outfit: the lower cloth covers the thighs only (no loincloth);
  // a full top puts the torso in the cloth colour.
  const fullTop = outfit.top === 'full';
  const out = [];
  const item = (part, segs, s) => (segs.markup ? { role: 'prop', part: `${s}-${part}`, markup: segs.markup, mx: segs.mx, pts: segs.pts }
    : { segs, role: part === 'thigh' ? 'cloth' : part === 'prop' ? 'prop' : 'body', part: `${s}-${part}` });
  const push = (L, kind, s) => L[kind].forEach(([part, segs]) => out.push(item(part, segs, s)));
  // The neck is always behind the head: drawn just before the torso when the
  // head is in front of the torso, else just before the head (behind the torso too).
  const neckItem = { segs: place(M.neck.segs, nb, neckAng, 1, neckF * NECK_STRETCH), role: 'body', part: 'neck' };
  let neckWithHead = false;
  const pushTorso = () => out.push(
    ...(neckWithHead ? [] : [neckItem]),
    { segs: T, role: fullTop ? 'cloth' : 'body', top: fullTop, part: 'torso' });
  const hh = S.head.size / 2, hw = hh * (S.head.width ?? 1);
  const headShape = { role: 'body', head: true, headPart: true, part: 'head',
    pts: [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map((q) => add(H, rot(q, headRot))) };
  // Draw order by depth (toward the viewer: Z in the front view, X in the
  // side view). Parts are drawn far to near, each limb as a unit (as near as
  // its nearest part) (its
  // parts in their fixed order: upper arm, forearm, hand; shin, foot,
  // thigh). The torso goes between: a part is drawn over it when it is in
  // front of the torso's middle at that height (arms, by half the torso's
  // depth there: arms beside the body stay over it) or of its near surface
  // (legs: the top of a thigh sits inside the pelvis). The head is over the
  // torso unless it is behind the torso's far surface.
  const depthOf = (p3) => (front ? p3[2] : p3[0]);
  const TSflat = dpFlat(TS, 12);
  const halfW = { arm: Math.abs(dpMix(M.attach.shoulder, Fs, null)[0]), leg: Math.abs(dpNode(Fs, 6)[0]) };
  const torsoAt = (y, kind) => {                 // torso centre and half-depth seen at height y
    if (!front) return { c: 0, h: halfW[kind] };
    const xs = [];
    for (let i = 0; i < TSflat.length; i++) {
      const a = TSflat[i], b = TSflat[(i + 1) % TSflat.length];
      if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) xs.push(a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]));
    }
    if (!xs.length) {                            // above or below the torso: its nearest end
      const near = TSflat.reduce((q, p) => (Math.abs(p[1] - y) < Math.abs(q[1] - y) ? p : q));
      return { c: near[0], h: 0.1 };
    }
    const z0 = Math.min(...xs), z1 = Math.max(...xs);
    return { c: (z0 + z1) / 2, h: (z1 - z0) / 2 };
  };
  const units = [];                              // {depth, over, items}
  for (const s of ['far', 'near']) for (const kind of ['leg', 'arm']) {
    const L = limbs[s][kind];
    const over = [], under = [];
    for (const [part, segs, p3] of L) {
      const { c, h } = torsoAt(p3[1], kind);
      const d = depthOf(p3);
      const on = kind === 'arm' ? d >= c - h / 2 : d > c + h;
      (on ? over : under).push(item(part, segs, s));
    }
    // a limb is as near as its nearest part (a hand raised to the face
    // decides whether the arm goes over the head)
    const depth = Math.max(...L.map((x) => depthOf(x[2])));
    if (under.length) units.push({ depth, over: false, items: under });
    if (over.length) units.push({ depth, over: true, items: over });
  }
  // head: its centre in 3D (X sideways, Y down, Z forward)
  const nbS = sideJ('neck', false);
  const B = headMatrix(sideHead, turnH, true);                            // head-local -> body
  const head3 = [0, nbS[1] - Math.cos(tn) * neckLen, nbS[0] + Math.sin(tn) * neckLen]
    .map((v, i) => v + B[i][0] * hO[0] + B[i][1] * hO[1] + B[i][2] * hO[2]);
  const tH = torsoAt(head3[1], 'arm');
  const headOver = depthOf(head3) >= tH.c - tH.h;
  neckWithHead = !headOver;
  units.push({ depth: depthOf(head3), over: headOver, items: headOver ? [headShape] : [neckItem, headShape] });
  // tail: from the back of the pelvis, in the middle (X = 0)
  const tail = tailSpec ? dpTail(tailSpec, add(lerp([0, 0], dpNode(TS, 5), 0.75), rot([0, -0.12 * bodyScale], sp.lean)), sp.lean, pose, front) : [];
  if (tail.length) {
    const back = posed(add(dpNode(M.torso.side, 5), [-0.1, -0.12]));
    units.push({ depth: front ? back[0] : 0, over: false, items: tail.map((pts) => ({ pts, role: 'body', part: 'tail' })) });
  }
  const byDepth = (a, b) => a.depth - b.depth;
  for (const u of units.filter((u) => !u.over).sort(byDepth)) out.push(...u.items);
  // Body hair (a face's hair-body layer: long hair on the back). Not depth
  // sorted: it lies on the torso. Front view: on the back, so just behind
  // the torso. Side view: over the torso (it covers the back edge), under
  // the head and everything in front of the torso.
  const hairBody = { hairBody: true, part: 'hair-body', pts: [] };
  if (front) out.push(hairBody);
  pushTorso();
  if (!front) out.push(hairBody);
  for (const u of units.filter((u) => u.over).sort(byDepth)) out.push(...u.items);
  for (const s of out) if (s.segs) { s.pts = dpFlat(s.segs); }
  // Where body hair hangs from (the neck base) and how it turns: with the
  // upper body (lean + chest). The front view sees its up-down part, like
  // the torso (shorter as the upper body tips toward the viewer, turned
  // over past level).
  const tilt = sp.lean + sp.chest, ct = Math.cos(tilt * RAD);
  const hair = { at: nb, rot: front ? 0 : tilt, sy: front ? Math.sign(ct || 1) * Math.max(Math.abs(ct), 0.25) : 1 };
  // joints for the pose lab's handles: limbs, and the spine's pivots (the
  // pelvis at the hip middle, the waist part way up, the neck base and top)
  const spineJ = { pelvis: [0, 0], waist: lerp([0, 0], nb, 0.45), neck: nb, head: neckTop, H };
  return { shapes: out, H, headRot, headR, hair, joints: { near: limbs.near.joints, far: limbs.far.joints, spine: spineJ } };
}

const dpF = (v) => (Math.round(v * 1000) / 1000).toString();
// Cubic segments -> SVG path data (the drawn curves, not sampled).
export function dpSegD(segs) {
  return `M${dpF(segs[0][0][0])} ${dpF(segs[0][0][1])}` + segs.map(([, b, c, d]) =>
    `C${dpF(b[0])} ${dpF(b[1])} ${dpF(c[0])} ${dpF(c[1])} ${dpF(d[0])} ${dpF(d[1])}`).join('') + 'Z';
}
