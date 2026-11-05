// Drawn-parts figures (experiment, branch drawn-parts): every body part is
// the artist's own outline (data/parts/<id>.svg, imported by
// tools/import-parts.mjs into data/parts.json), placed rigidly on the
// skeleton. The torso is interpolated between four drawn keys:
// front / side (turn) × straight / bent forward (bend). Shapes are
// returned in the same form as buildShapes in figure.js.
//
// Names here are prefixed (dp…) because the labs concatenate the renderer
// modules into one script.

import { dir, add, sub, mul, lerp, rot } from './geom.js';

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
function dpAttach(M, T, which, far) {
  const a = M.attach[which];
  const idx = far ? a.idx.map((i) => M.mirror[i]) : a.idx;
  const [A, B, C] = idx.map((i) => dpNode(T, i));
  return add(add(mul(A, a.w[0]), mul(B, a.w[1])), mul(C, a.w[2]));
}

// Side view: the parts are drawn with every limb's curve on the outside;
// these flip so the curve is on the triceps and the calf (style bible §4).
const DP_SIDE_FLIP = { 'upper-arm': true, forearm: false, thigh: false, shin: true };

// S: the species (head size); pose: a normalised pose (front view already derived by frontOf);
// k: the front view's torso shortening from frontOf (1 in side view).
export function buildParts(M, S, pose, outfit = {}, view = 'side', k = 1) {
  const front = view === 'front';
  const { lean, chest, neck, head } = pose.spine;
  const turn = front ? 0 : 1;
  const bend = front ? (1 - k) / (1 - M.frontBend) : chest / M.bend;
  // place a part drawn in its bone frame (bone pointing down) at `at`, bone angle `ang`
  const place = (segs, at, ang, m = 1, flip = false) => dpMap(segs, (p) => {
    const q = rot(flip ? [-p[0], p[1]] : p, -ang);
    return add(at, [m * q[0], q[1]]);
  });

  const T = dpMap(partsTorso(M, turn, bend), (p) => rot(p, front ? 0 : lean));
  const limbs = {};
  for (const s of ['near', 'far']) {
    const far = s === 'far';
    const m = front && far ? -1 : 1;           // front view: far limbs mirrored to picture-left
    const dirM = (t) => { const d = dir(t); return [m * d[0], d[1]]; };
    const a = pose[s].arm, l = pose[s].leg;
    const sh = dpAttach(M, T, 'shoulder', far), hp = dpAttach(M, T, 'hip', far);
    const tu = m * -(lean + chest) + a.shoulder, tl = tu + a.elbow, th = tl + a.wrist;
    const E = add(sh, mul(dirM(tu), M.upperArm.len)), Wr = add(E, mul(dirM(tl), M.forearm.len));
    const tt = m * -lean + l.hip, ts = tt - l.knee;
    const Kn = add(hp, mul(dirM(tt), M.thigh.len)), A = add(Kn, mul(dirM(ts), M.shin.len));
    const fl = (part) => !front && DP_SIDE_FLIP[part];
    const foot = front ? M.foot.front : M.foot.side;
    limbs[s] = {
      arm: [
        ['upper-arm', place(M.upperArm.segs, sh, tu, m, fl('upper-arm'))],
        ['forearm', place(M.forearm.segs, E, tl, m, fl('forearm'))],
        ['hand', place(M.hands[a.hand] || M.hands.fist, Wr, th, m)],
      ],
      leg: [
        ['thigh', place(M.thigh.segs, hp, tt, m, fl('thigh'))],
        ['shin', place(M.shin.segs, Kn, ts, m, fl('shin'))],
        // the foot keeps its angle from the ground; drawn flat = ankle 0
        ['foot', dpMap(foot, (p) => { const q = rot(p, -l.ankle); return add(A, [m * q[0], q[1]]); })],
      ],
    };
  }
  const up3 = 180 - (lean + chest + neck);
  const nb = dpAttach(M, T, 'neck', false);
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
