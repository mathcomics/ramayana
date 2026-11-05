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

// Torso outline in the pelvis frame (hip mid at 0,0). turn: 0 front, 1
// side; bend: 0 straight, 1 the drawn bend (model.bend degrees).
export function partsTorso(M, turn, bend) {
  const straight = dpLin(M.torso.front, M.torso.side, turn);
  const bent = dpLin(M.torso.frontBend, M.torso.sideBend, turn);
  const pivot = lerp(dpNode(straight, 3), dpNode(straight, 6), 0.5);
  return dpPolar(straight, bent, bend, pivot);
}
// A joint on the torso: a mix of three torso nodes. Front and side each
// have their own mix (attach / attachSide); a turn blends the two.
// In side view one hip point serves both legs.
function dpMix(a, T, mirror) {
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
const dpWrap = (v) => { while (v > 180) v -= 360; while (v <= -180) v += 360; return v; };

// S: the species (head size); pose: the normalised SIDE pose (both views);
// k: the front view's torso shortening from frontOf (1 in side view).
export function buildParts(M, S, pose, outfit = {}, view = 'side', k = 1) {
  const front = view === 'front';
  const sp = pose.spine;                           // side-view spine: limb angles are measured in it
  const { lean, chest, neck, head } = front ? { lean: 0, chest: 0, neck: 0, head: 0 } : sp;
  const turn = front ? 0 : 1;
  const bend = front ? (1 - k) / (1 - M.frontBend) : chest / M.bend;
  // place a part drawn in its bone frame (bone pointing down) at `at`, bone
  // angle `ang`, its length scaled by f (width unchanged)
  const place = (segs, at, ang, m = 1, f = 1) => dpMap(segs, (p) => {
    const q = rot([p[0], p[1] * f], -ang);
    return add(at, [m * q[0], q[1]]);
  });

  const T = dpMap(partsTorso(M, turn, bend), (p) => rot(p, lean));
  const limbs = {};
  for (const s of ['near', 'far']) {
    const far = s === 'far';
    const m = front && far ? -1 : 1;           // front view: far limbs to picture-left
    const dirM = (t) => { const d = dir(t); return [m * d[0], d[1]]; };
    const a = pose[s].arm, l = pose[s].leg;
    const sh = dpAttach(M, T, 'shoulder', far, turn), hp = dpAttach(M, T, 'hip', far, turn);
    // side-view angles of each segment, then projected for this view
    const su = -(sp.lean + sp.chest) + a.shoulder, sl = su + a.elbow;
    const st = -sp.lean + l.hip, ss = st - l.knee;
    const U = dpProject(su, a.out, front), Lo = dpProject(sl, a.out, front);
    const Th = dpProject(st, l.out, front), Sh = dpProject(ss, l.out, front);
    const th = front ? Lo.ang : sl + a.wrist;
    const ankle = front ? Math.abs(dpWrap(90 + l.ankle)) - 90 : l.ankle;   // front: toes outward, same tilt
    const E = add(sh, mul(dirM(U.ang), M.upperArm.len * U.f)), Wr = add(E, mul(dirM(Lo.ang), M.forearm.len * Lo.f));
    const Kn = add(hp, mul(dirM(Th.ang), M.thigh.len * Th.f)), A = add(Kn, mul(dirM(Sh.ang), M.shin.len * Sh.f));
    const foot = dpTurn(M.foot, turn);
    const hands = { front: M.hands.front[a.hand] || M.hands.front.fist, side: M.hands.side[a.hand] || M.hands.side.fist };
    limbs[s] = {
      arm: [
        ['upper-arm', place(dpTurn(M.upperArm, turn), sh, U.ang, m, U.f)],
        ['forearm', place(dpTurn(M.forearm, turn), E, Lo.ang, m, Lo.f)],
        ['hand', place(dpTurn(hands, turn), Wr, th, m)],
      ],
      leg: [
        ['thigh', place(dpTurn(M.thigh, turn), hp, Th.ang, m, Th.f)],
        ['shin', place(dpTurn(M.shin, turn), Kn, Sh.ang, m, Sh.f)],
        // the foot keeps its angle from the ground; drawn flat = ankle 0
        ['foot', dpMap(foot, (p) => { const q = rot(p, -ankle); return add(A, [m * q[0], q[1]]); })],
      ],
    };
  }
  const up3 = 180 - (lean + chest + neck);
  const nb = dpAttach(M, T, 'neck', false, turn);
  const neckTop = add(nb, mul(dir(up3), M.neck.len));
  const headRot = lean + chest + neck + head;
  const H = add(neckTop, mul(dir(180 - headRot), 0.21));

  // Outfit: the lower cloth covers the thighs only (no loincloth);
  // a full top puts the torso in the cloth colour.
  const fullTop = outfit.top === 'full';
  const out = [];
  const push = (L, kind, s) => L[kind].forEach(([part, segs]) =>
    out.push({ segs, role: part === 'thigh' ? 'cloth' : 'body', part: `${s}-${part}` }));
  const pushTorso = () => out.push(
    { segs: place(M.neck.segs, nb, up3), role: 'body', part: 'neck' },
    { segs: T, role: fullTop ? 'cloth' : 'body', top: fullTop, part: 'torso' });
  const hh = S.head.size / 2, hw = hh * (S.head.width ?? 1);
  const headShape = { role: 'body', head: true, headPart: true, part: 'head',
    pts: [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map((q) => add(H, rot(q, headRot))) };
  // the torso goes over the legs (a forward bend covers the thighs)
  if (front) {
    push(limbs.far, 'leg', 'far'); push(limbs.near, 'leg', 'near'); pushTorso();
    push(limbs.far, 'arm', 'far'); push(limbs.near, 'arm', 'near'); out.push(headShape);
  } else {
    push(limbs.far, 'arm', 'far'); push(limbs.far, 'leg', 'far'); push(limbs.near, 'leg', 'near'); pushTorso();
    out.push(headShape); push(limbs.near, 'arm', 'near');
  }
  for (const s of out) if (s.segs) { s.pts = dpFlat(s.segs); }
  return { shapes: out, H, headRot };
}

const dpF = (v) => (Math.round(v * 1000) / 1000).toString();
// Cubic segments -> SVG path data (the drawn curves, not sampled).
export function dpSegD(segs) {
  return `M${dpF(segs[0][0][0])} ${dpF(segs[0][0][1])}` + segs.map(([, b, c, d]) =>
    `C${dpF(b[0])} ${dpF(b[1])} ${dpF(c[0])} ${dpF(c[1])} ${dpF(d[0])} ${dpF(d[1])}`).join('') + 'Z';
}
