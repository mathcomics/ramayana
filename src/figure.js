// Figure model: solve a pose on a species skeleton, build filled shapes,
// emit SVG. Everything is authored FACING RIGHT; facing left mirrors.
//
// See geom.js for the angle convention (0 = down, +90 = forward).
//
// Limb rule (Mattesi "straight against curve", simplified):
//   the upper segment is curved on the OUTER side of the joint's bend and
//   straight on the inner side; the lower segment flips. For a leg that is
//   a curved thigh-front against a curved calf-back; for an arm a curved
//   triceps against a curved forearm-front.

import {
  dir, add, sub, mul, lerp, rot, quad, circlePts, roundRectPts, pathD, bbox,
} from './geom.js';

const ELBOW = +1; // forearm rotates toward +θ when the elbow flexes
const KNEE = -1;  // shin rotates toward -θ when the knee flexes

export const DEFAULT_COLORS = {
  body: '#5a2a12',
  cloth: '#e0541a',
  mouth: '#f4efe6',
};

const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);

// Normalise a pose, filling defaults.
export function normalizePose(p = {}) {
  const limb = (l = {}) => ({
    arm: {
      shoulder: num(l.arm?.shoulder, 0), elbow: num(l.arm?.elbow, 10), wrist: num(l.arm?.wrist, 0),
      hand: ['fist', 'out', 'in'].includes(l.arm?.hand) ? l.arm.hand : 'fist',
    },
    leg: { hip: num(l.leg?.hip, 0), knee: num(l.leg?.knee, 5), ankle: num(l.leg?.ankle, 0) },
  });
  return {
    name: p.name || 'untitled',
    view: p.view === 'front' ? 'front' : 'side',
    headView: (p.headView || p.view) === 'front' ? 'front' : 'side',
    mouth: [1, 2, 3].includes(p.mouth) ? p.mouth : 2,
    spine: {
      lean: num(p.spine?.lean, 0),
      chest: num(p.spine?.chest, 0),
      neck: num(p.spine?.neck, 0),
      head: num(p.spine?.head, 0),
    },
    near: limb(p.near),
    far: limb(p.far),
    tail: { lift: num(p.tail?.lift, 30), curl: num(p.tail?.curl, 200) },
  };
}

// ---------------------------------------------------------------- skeleton

export function solve(species, poseIn) {
  const pose = normalizePose(poseIn);
  const S = species;
  const front = pose.view === 'front';
  const { lean, chest, neck, head } = pose.spine;

  const P = [0, 0];
  const up1 = 180 - lean;
  const up2 = 180 - (lean + chest);
  const up3 = 180 - (lean + chest + neck);
  const headRot = lean + chest + neck + head;

  const W = add(P, mul(dir(up1), S.spine.lower));
  // The torso is two blocks hinged at the waist. The hinge sits on the
  // OUTER side of the bend (back edge for a forward bend, front edge for
  // an arch back), so that side stays continuous and a notch opens on the
  // inner side. W2 is the centre of the upper block's bottom edge.
  const tw0 = front ? S.torso.front : S.torso.side;
  const wh = tw0.waist / 2;
  const hs = chest >= 0 ? -1 : 1;                       // -1: hinge on back
  const fw1 = dir(up1 - 90), fw2 = dir(up2 - 90);
  const hinge = add(W, mul(fw1, hs * wh));
  const W2 = add(hinge, mul(fw2, -hs * wh));
  const N = add(W2, mul(dir(up2), S.spine.upper));
  const neckEnd = add(N, mul(dir(up3), S.neck));
  const H = add(neckEnd, mul(dir(180 - headRot), S.head.size * 0.42));
  const C = lerp(W2, N, 0.78); // widest part of the chest

  const fwd = (u) => dir(u - 90); // forward normal of a spine segment
  const tw = front ? S.torso.front : S.torso.side;

  // limb anchors
  const limbs = {};
  for (const side of ['near', 'far']) {
    const m = front && side === 'far' ? -1 : 1; // front view: far = picture-left, mirrored
    const lat = front ? (side === 'near' ? 1 : -1) : 0;
    const dirM = (t) => { const d = dir(t); return [m * d[0], d[1]]; };

    // Shoulder anchor. Front view: spread across the chest. Side view: each
    // arm has its own anchor along the chest's depth (near forward, far
    // back), as a fraction of the chest's half-depth (+ = forward).
    const sideAnchor = (S.shoulder?.side?.[side] ?? 0) * tw.chest / 2;
    const sh = add(lerp(C, N, 0.45), mul(fwd(up2), front ? lat * tw.chest * 0.42 : sideAnchor));
    const hp = add(P, mul(fwd(up1), front ? lat * tw.hip * 0.3 : 0.03));

    const a = pose[side].arm, l = pose[side].leg;
    const tu = m * -(lean + chest) + a.shoulder;
    const tl = tu + a.elbow;
    const th = tl + a.wrist;
    const E = add(sh, mul(dirM(tu), S.arm.upper));
    const Wr = add(E, mul(dirM(tl), S.arm.lower));

    const tt = m * -lean + l.hip;
    const ts = tt - l.knee;
    const tf = ts + 90 + l.ankle;
    const K = add(hp, mul(dirM(tt), S.leg.upper));
    const A = add(K, mul(dirM(ts), S.leg.lower));

    limbs[side] = { m, dirM, sh, E, Wr, tu, tl, th, hp, K, A, tt, ts, tf, hand: a.hand };
  }

  return { pose, front, P, W, W2, hinge, hs, C, N, neckEnd, H, up1, up2, up3, headRot, fwd, tw, limbs };
}

// ------------------------------------------------------------------ shapes

// One limb segment A->B, straight on one side, curved on the other.
// cs = +1 puts the curve on the dirM(θ+90) side, -1 on dirM(θ-90).
function segment(A, B, wa, wb, theta, cs, dirM, bulge) {
  const nC = dirM(theta + cs * 90);
  const nS = mul(nC, -1);
  const sA = add(A, mul(nS, wa / 2)), sB = add(B, mul(nS, wb / 2));
  const cA = add(A, mul(nC, wa / 2)), cB = add(B, mul(nC, wb / 2));
  const ctrl = add(lerp(cA, cB, 0.38), mul(nC, bulge * (wa + wb) / 2));
  return [sA, sB, cB, ...quad(cB, ctrl, cA, 12)];
}

// Knotty joints: the upper segment runs full width into the joint (the
// knot), the lower segment starts thinner (knot × joint width), swells
// along its curved side, then tapers to the wrist or ankle.
function limbShapes(S, L, kind) {
  const out = [];
  const bulge = S.bulge;
  const lowBulge = S.lowerBulge ?? bulge;
  if (kind === 'arm') {
    const [w0, w1, w2] = S.arm.w;
    const k = S.arm.knot ?? 1;
    out.push(circlePts(L.sh, w0 / 2));
    out.push(segment(L.sh, L.E, w0, w1, L.tu, -ELBOW, L.dirM, bulge));
    out.push(circlePts(L.E, w1 / 2));
    out.push(segment(L.E, L.Wr, w1 * k, w2, L.tl, +ELBOW, L.dirM, lowBulge));
    out.push(...handShapes(S, L, w2));
  } else {
    const [w0, w1, w2] = S.leg.w;
    const k = S.leg.knot ?? 1;
    out.push(circlePts(L.hp, w0 / 2));
    out.push(segment(L.hp, L.K, w0, w1, L.tt, -KNEE, L.dirM, bulge));
    out.push(circlePts(L.K, w1 / 2));
    out.push(segment(L.K, L.A, w1 * k, w2, L.ts, +KNEE, L.dirM, lowBulge));
    out.push(circlePts(L.A, w2 / 2));
    // foot: a wedge, flat top, slightly rounded sole
    const heel = add(L.A, mul(L.dirM(L.tf), -0.1));
    const toe = add(L.A, mul(L.dirM(L.tf), S.leg.foot));
    out.push(segment(heel, toe, w2 * 1.05, 0.07, L.tf, -1, L.dirM, 0.25));
  }
  return out;
}

// Hands, three configurations (see reference/sketch-hands.jpg):
//   fist: a wedge widening from the wrist to a rounded end;
//   out / in: a blunt paddle for the fingers with a thin pointed thumb,
//   thumb on the side away from the body (out) or toward it (in).
// "Out" is the dirM(θ+90) side: forward in side view, away from the
// midline in front view.
function handShapes(S, L, wristW) {
  const len = S.arm.hand ?? 0.42;
  const u = L.dirM(L.th), n = L.dirM(L.th + 90);
  const at = (a, b) => add(add(L.Wr, mul(u, a * len)), mul(n, b));
  if (L.hand === 'fist') {
    // widens from the wrist to a flat top with rounded corners
    // and is shorter than the open hand (FIST × hand length)
    const hw = 0.18, r = 0.07, F = S.arm.fist ?? 0.65;
    // base starts inside the forearm, with a wrist disc, so no gap opens
    // at the wrist whatever the angle
    return [circlePts(L.Wr, wristW / 2, 14), [
      at(-0.3, wristW * 0.5),
      at(F - r / len, hw), ...quad(at(F - r / len, hw), at(F, hw), at(F, hw - r), 5),
      at(F, -hw + r), ...quad(at(F, -hw + r), at(F, -hw), at(F - r / len, -hw), 5),
      at(-0.3, -wristW * 0.5),
    ]];
  }
  const s = L.hand === 'out' ? 1 : -1;
  const palm = [at(-0.05, s * wristW * 0.48), at(0.9, s * 0.16), at(1.0, -s * 0.13), at(-0.05, -s * wristW * 0.48)];
  // thumb: a strip with parallel sides and a blunt end
  const td = L.dirM(L.th + s * 42), tn = L.dirM(L.th + s * 42 + 90);
  const tw = 0.09, tl = len * 0.7;
  const b = at(0.16, s * 0.04);
  const thumb = [add(b, mul(tn, tw / 2)), add(add(b, mul(td, tl)), mul(tn, tw / 2)),
    add(add(b, mul(td, tl)), mul(tn, -tw / 2)), add(b, mul(tn, -tw / 2))];
  return [palm, thumb];
}

// The upper leg alone (hip disc + thigh), as drawn in limbShapes.
function upperLegShapes(S, L) {
  const [w0, w1] = S.leg.w;
  return [circlePts(L.hp, w0 / 2), segment(L.hp, L.K, w0, w1, L.tt, -KNEE, L.dirM, S.bulge)];
}

// Convex hull (monotone chain) of a point set.
function hull(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  for (const p of pts.reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

// Loincloth = the span across both upper legs (one shape enclosing both
// thighs), clipped to the torso outline. It follows the legs, and in
// front view it bridges the crotch as one piece.
function loincloth(S, sk, torso) {
  const thighs = [...upperLegShapes(S, sk.limbs.near), ...upperLegShapes(S, sk.limbs.far)];
  return { role: 'cloth', pts: [], parts: [hull(thighs.flat())], clipPts: torso };
}

function torsoShape(sk) {
  // Two blocks hinged at the waist (see reference/sketch-torso-curl.jpg):
  // lower block hip→waist, upper block waist→chest. The outer side of the
  // bend turns smoothly round the hinge; the inner side opens a notch that
  // deepens with the bend. Side view: back edge straight, front curved.
  const { P, W, W2, hinge, hs, C, N, up1, up2, fwd, tw, front } = sk;
  const f1 = fwd(up1), f2 = fwd(up2), u1 = dir(up1), u2 = dir(up2);
  const wh = tw.waist / 2;
  const hipF = add(P, mul(f1, tw.hip / 2)), hipB = add(P, mul(f1, -tw.hip / 2));
  const lwF = add(W, mul(f1, wh)), lwB = add(W, mul(f1, -wh));     // lower block top
  const uwF = add(W2, mul(f2, wh)), uwB = add(W2, mul(f2, -wh));   // upper block bottom
  const chF = add(C, mul(f2, tw.chest / 2)), chB = add(C, mul(f2, -tw.chest / 2));
  const topF = add(add(N, mul(f2, tw.chest * 0.28)), mul(u2, 0.06));
  const topB = add(add(N, mul(f2, -tw.chest * 0.28)), mul(u2, 0.06));

  // outer side: round the corner at the hinge
  const fillet = (lowerUp, upperUp, sign) => {
    const d = 0.16;
    // walking up: lower edge → hinge → upper edge (sign -1), or reverse
    const a = add(hinge, mul(u1, -d)), b = add(hinge, mul(u2, d));
    return sign < 0 ? [a, ...quad(a, hinge, b, 6)] : [b, ...quad(b, hinge, a, 6)];
  };
  // inner side: notch between the upper block's bottom corner and the
  // lower block's top corner, deepening with the bend
  const notch = (uCorner, lCorner) => {
    const mid = lerp(uCorner, lCorner, 0.5);
    const gap = Math.hypot(uCorner[0] - lCorner[0], uCorner[1] - lCorner[1]);
    const depth = 0.45 * Math.min(1, gap / tw.waist);
    return lerp(mid, hinge, depth);
  };
  const bulge = (a, b, n, amt, k = 6) => quad(a, add(lerp(a, b, 0.5), mul(n, amt)), b, k);
  const backBow = front ? -0.05 : 0, frontBow = front ? 0.06 : 0.12;

  const pts = [hipB];
  // back side, going up
  if (hs < 0) {                       // forward bend: back is the outer side
    pts.push(...bulge(hipB, add(hinge, mul(u1, -0.16)), f1, backBow));
    pts.push(...fillet(null, null, -1).slice(1));
    pts.push(...bulge(add(hinge, mul(u2, 0.16)), chB, f2, backBow));
  } else {                            // arched back: notch on the back
    pts.push(...bulge(hipB, lwB, f1, backBow), notch(uwB, lwB), uwB);
    pts.push(...bulge(uwB, chB, f2, backBow));
  }
  // over the top
  pts.push(...quad(chB, add(N, mul(f2, -tw.chest * 0.45)), topB, 6));
  pts.push(topF);
  pts.push(...quad(topF, add(N, mul(f2, tw.chest * 0.5)), chF, 6));
  // front side, going down
  if (hs < 0) {                       // forward bend: notch on the front
    pts.push(...bulge(chF, uwF, f2, frontBow), notch(uwF, lwF), lwF);
    pts.push(...bulge(lwF, hipF, f1, frontBow * 0.7));
  } else {                            // arched back: front is the outer side
    pts.push(...bulge(chF, add(hinge, mul(u2, 0.16)), f2, frontBow));
    pts.push(...fillet(null, null, 1).slice(1));
    pts.push(...bulge(add(hinge, mul(u1, -0.16)), hipF, f1, frontBow * 0.7));
  }
  // bottom: rounded
  pts.push(...quad(hipF, add(P, mul(dir(-sk.pose.spine.lean), 0.3)), hipB, 8));
  return pts;
}

function neckShape(S, sk) {
  const w = S.neckWidth || 0.3;
  const base = lerp(sk.C, sk.N, 0.5);
  const top = lerp(sk.neckEnd, sk.H, 0.5);
  const th = 180 - (sk.pose.spine.lean + sk.pose.spine.chest + sk.pose.spine.neck);
  return segment(base, top, w * 1.15, w, th, -1, dir, 0.15);
}

function tailShape(S, sk) {
  const T = S.tail;
  if (!T) return null;
  const { P, up1, fwd, tw, pose } = sk;
  const back = mul(fwd(up1), -1);
  let p = add(add(P, mul(back, tw.hip * 0.38)), mul(dir(up1), 0.12));
  let theta = -90 - pose.spine.lean - pose.tail.lift;
  const n = T.segments, segLen = T.length / n;
  const weights = Array.from({ length: n }, (_, k) => Math.pow(k + 1, 1.7));
  const wsum = weights.reduce((a, b) => a + b, 0);
  const spine = [p];
  const angles = [];
  for (let k = 0; k < n; k++) {
    theta -= pose.tail.curl * (weights[k] / wsum);
    angles.push(theta);
    p = add(p, mul(dir(theta), segLen));
    spine.push(p);
  }
  const left = [], right = [];
  for (let i = 0; i < spine.length; i++) {
    const t = i / (spine.length - 1);
    const w = T.w[0] + (T.w[1] - T.w[0]) * t;
    const a = angles[Math.min(i, angles.length - 1)];
    const nrm = dir(a + 90);
    left.push(add(spine[i], mul(nrm, w / 2)));
    right.push(add(spine[i], mul(nrm, -w / 2)));
  }
  return { body: [...left, ...right.reverse()], tip: circlePts(spine[spine.length - 1], T.w[1] / 2, 10), root: circlePts(spine[0], T.w[0] / 2, 10) };
}


// Head shapes in head-local coords (x forward, y down, centred), then
// rotated and translated. Returns [{pts, role, stroke?}].
// Mouth openings, levels 1-3 (never closed): [half width, arch height,
// shape exponent]. Exponent < 1 squares the arch off, > 1 makes it peaked.
const MOUTHS = { 1: [0.2, 0.09, 1], 2: [0.19, 0.21, 1.25], 3: [0.26, 0.33, 0.6] };

function headShapes(S, sk) {
  const s = S.head.size, hw = s / 2;
  const view = sk.pose.headView;
  const local = [];
  // Tapered rounded square: top narrower than bottom.
  const taper = S.head.taper ?? 1; // top width / bottom width
  const wAt = (y) => taper + (1 - taper) * ((y + hw) / s); // x-scale at height y
  const edge = (y) => hw * wAt(y); // half width of the head at height y
  const square = roundRectPts(hw, hw, S.head.radius).map(([x, y]) => [x * wAt(y), y]);

  // Ears: solid loops outside the head (same colour, no outline), the lower
  // half hanging longer than the upper. Front: both sides. Side: the back.
  const ear = (dirX) => {
    const y0 = -0.06, rx = 0.17, top = 0.13, bot = 0.21, inset = 0.05;
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const a = -Math.PI / 2 + Math.PI * (i / 16); // top -> outward -> bottom
      const sy = Math.sin(a);
      const y = y0 + sy * (sy < 0 ? top : bot);
      pts.push([dirX * (edge(y) - inset + Math.cos(a) * (rx + inset)), y]);
    }
    return pts;
  };
  if (view === 'front') { local.push({ role: 'body', pts: ear(-1) }, { role: 'body', pts: ear(1) }); }
  else local.push({ role: 'body', pts: ear(-1) });
  local.push({ role: 'body', pts: square, head: true });

  // Eyes
  const eye = (c) => local.push({ role: 'eye', pts: circlePts(c, 0.075, 12) });
  if (view === 'front') { eye([-0.19, -0.12]); eye([0.19, -0.12]); }
  else eye([0.14, -0.16]);

  // Mouth: flat bottom, arched top. In side view the arch is centred near
  // the front edge so the opening runs out to the face's edge.
  const [a, b, p] = MOUTHS[sk.pose.mouth];
  const yb = 0.37;
  const cx = view === 'front' ? 0 : edge(yb) - 0.12;
  const m = [];
  for (let i = 0; i <= 20; i++) {
    const t = Math.PI * (i / 20);
    const c = Math.cos(t), sn = Math.sin(t);
    m.push([cx + a * Math.sign(c) * Math.pow(Math.abs(c), p), yb - b * Math.pow(sn, p)]);
  }
  local.push({ role: 'mouth', pts: m });

  return local.map((sh) => ({ ...sh, pts: sh.pts.map((q) => add(sk.H, rot(q, sk.headRot))) }));
}

// Build all shapes in draw order: [{pts, role, open?}]
export function buildShapes(species, pose) {
  const sk = solve(species, pose);
  const S = species;
  const out = [];
  const push = (list, role = 'body') => list.forEach((pts) => out.push({ pts, role }));
  const tail = tailShape(S, sk);

  if (sk.front) {
    if (tail) { push([tail.root, tail.body, tail.tip]); }
    push(limbShapes(S, sk.limbs.far, 'leg'));
    push(limbShapes(S, sk.limbs.near, 'leg'));
    const torso = torsoShape(sk);
    push([neckShape(S, sk), torso]);
    out.push(loincloth(S, sk, torso));
    push(limbShapes(S, sk.limbs.far, 'arm'));
    push(limbShapes(S, sk.limbs.near, 'arm'));
    out.push(...headShapes(S, sk));
  } else {
    push(limbShapes(S, sk.limbs.far, 'arm'));
    push(limbShapes(S, sk.limbs.far, 'leg'));
    if (tail) { push([tail.root, tail.body, tail.tip]); }
    push(limbShapes(S, sk.limbs.near, 'leg'));
    const torso = torsoShape(sk);
    push([neckShape(S, sk), torso]);
    out.push(loincloth(S, sk, torso));
    out.push(...headShapes(S, sk));
    push(limbShapes(S, sk.limbs.near, 'arm'));
  }

  // Lowest point at y = 0. Where the figure sits in a panel is the
  // scene layout's job, not the pose's.
  const bb = bbox(out.filter((s) => !s.open).map((s) => s.pts));
  const dy = -bb.y1;
  const dx = -(bb.x0 + bb.x1) / 2;
  const mv = (pts) => pts.map((q) => [q[0] + dx, q[1] + dy]);
  for (const s of out) {
    s.pts = mv(s.pts);
    if (s.parts) s.parts = s.parts.map(mv);
    if (s.clipPts) s.clipPts = mv(s.clipPts);
  }
  return { shapes: out, sk, bbox: bbox(out.map((s) => s.pts)) };
}

// Every body part as its own list of shapes, for inspection
// (tools/parts-sheet.mjs). Parts are in solved-pose coordinates.
export function anatomy(species, pose) {
  const S = species, sk = solve(species, pose);
  const arm = limbShapes(S, sk.limbs.near, 'arm');
  const leg = limbShapes(S, sk.limbs.near, 'leg');
  const torso = torsoShape(sk);
  const tail = tailShape(S, sk);
  const body = (list) => list.map((pts) => ({ pts, role: 'body' }));
  const parts = {
    head: headShapes(S, sk),
    neck: body([neckShape(S, sk)]),
    torso: body([torso]),
    'upper arm': body(arm.slice(0, 3)),
    forearm: body(arm.slice(3, 4)),
    hand: body(arm.slice(4)),
    thigh: body(leg.slice(0, 3)),
    shin: body(leg.slice(3, 5)),
    foot: body(leg.slice(5)),
  };
  if (tail) parts.tail = body([tail.root, tail.body, tail.tip]);
  const lc = loincloth(S, sk, torso);
  parts.loincloth = lc.parts.map((pts) => ({ pts, role: 'cloth', clipPts: torso }));
  return parts;
}

// Render a figure as an SVG <g>. Ground point at (x, y) in px; `scale` is
// px per head-unit; facing 1 (right) or -1 (left).
let clipSeq = 0;

// Relative luminance (WCAG) of a #rgb / #rrggbb colour, 0..1.
function luminance(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const [r, g, b] = [0, 2, 4].map((i) => lin(parseInt(h.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Eyes (and ear curls) are always pure white or black, whichever has
// more contrast with the body colour.
export function eyeColor(body) {
  const L = luminance(body);
  return (1.05) / (L + 0.05) >= (L + 0.05) / 0.05 ? '#ffffff' : '#000000';
}

export function renderFigure(species, pose, opts = {}) {
  const { x = 0, y = 0, scale = 20, facing = 1 } = opts;
  const colors = { ...DEFAULT_COLORS, ...(opts.colors || {}) };
  colors.eye = eyeColor(colors.body);
  const { shapes, bbox: bb } = buildShapes(species, pose);
  // Shapes are emitted in draw order; consecutive body shapes share one
  // <g fill> so the silhouette merges visually.
  let svg = `<g transform="translate(${x} ${y}) scale(${facing * scale} ${scale})">`;
  const clipId = `face${++clipSeq}`;
  const faceD = shapes.filter((s) => s.head).map((s) => pathD(s.pts)).join('');
  if (faceD) svg += `<clipPath id="${clipId}"><path d="${faceD}"/></clipPath>`;
  let inBody = false;
  for (const s of shapes) {
    if (s.role === 'body') {
      if (!inBody) { svg += `<g fill="${colors.body}">`; inBody = true; }
      svg += `<path d="${pathD(s.pts)}"/>`;
      continue;
    }
    if (inBody) { svg += '</g>'; inBody = false; }
    if (s.parts) {
      const id = `${clipId}c${shapes.indexOf(s)}`;
      svg += `<clipPath id="${id}"><path d="${pathD(s.clipPts)}"/></clipPath>` +
        `<g fill="${colors[s.role]}" clip-path="url(#${id})">${s.parts.map((p) => `<path d="${pathD(p)}"/>`).join('')}</g>`;
    } else if (s.role === 'ear') {
      svg += `<path d="${pathD(s.pts, false)}" fill="none" stroke="${colors.eye}" stroke-width="0.06" stroke-linecap="round"/>`;
    } else {
      const clip = s.role === 'mouth' && faceD ? ` clip-path="url(#${clipId})"` : '';
      svg += `<path d="${pathD(s.pts)}" fill="${colors[s.role]}"${clip}/>`;
    }
  }
  if (inBody) svg += '</g>';
  svg += '</g>';
  return { svg, bbox: bb };
}
