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

import { dir, add, mul, lerp, rot, quad, circlePts, pathD, bbox } from './geom.js';
import { buildParts, dpSegD } from './parts.js';
import { headTurn, headMatrix } from './headturn.js';

const ELBOW = +1; // forearm rotates toward +θ when the elbow flexes
const KNEE = -1;  // shin rotates toward -θ when the knee flexes

export const DEFAULT_COLORS = {
  body: '#5a2a12',
  cloth: '#c8322a',
};

export const HANDS = ['fist', 'out', 'in', 'point'];
const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);

// Normalise a pose, filling defaults.
export function normalizePose(p = {}) {
  const limb = (l = {}) => ({
    arm: {
      shoulder: num(l.arm?.shoulder, 0), out: num(l.arm?.out, 0), elbow: num(l.arm?.elbow, 10), wrist: num(l.arm?.wrist, 0), twist: num(l.arm?.twist, 0),
      hand: HANDS.includes(l.arm?.hand) ? l.arm.hand : 'fist',
    },
    leg: { hip: num(l.leg?.hip, 0), out: num(l.leg?.out, 0), knee: num(l.leg?.knee, 5), ankle: num(l.leg?.ankle, 0) },
  });
  return {
    name: p.name || 'untitled',
    view: p.view === 'front' ? 'front' : 'side',
    // where the head looks, relative to the body: front (the way the body
    // faces), left (toward the near side), right (toward the far side).
    // Older poses had headView (relative to the paper): front = left.
    look: ['front', 'left', 'right'].includes(p.look) ? p.look : (p.headView || p.view) === 'front' ? 'left' : 'front',
    headView: (p.view === 'front' || p.look === 'left' || (!p.look && p.headView === 'front')) ? 'front' : 'side',
    mouth: [1, 2, 3].includes(p.mouth) ? p.mouth : 2,
    spine: {
      lean: num(p.spine?.lean, 0),
      chest: num(p.spine?.chest, 0),
      neck: num(p.spine?.neck, 0),
      head: num(p.spine?.head, 0),
    },
    near: limb(p.near),
    far: limb(p.far),
    tail: { lift: num(p.tail?.lift, 30), curl: num(p.tail?.curl, 200), turn: num(p.tail?.turn, 35) },
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
  const tw = front ? S.torso.front : S.torso.side;
  const wh = tw.waist / 2;
  const hs = chest >= 0 ? -1 : 1;                       // -1: hinge on back
  const fw1 = dir(up1 - 90), fw2 = dir(up2 - 90);
  const hinge = add(W, mul(fw1, hs * wh));
  const W2 = add(hinge, mul(fw2, -hs * wh));
  const N = add(W2, mul(dir(up2), S.spine.upper));
  const neckEnd = add(N, mul(dir(up3), S.neck));
  const H = add(neckEnd, mul(dir(180 - headRot), S.head.size * 0.42));
  const C = lerp(W2, N, 0.78); // widest part of the chest

  const fwd = (u) => dir(u - 90); // forward normal of a spine segment

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
    // foot angle from the ground, not the shin: 0 = flat, toes forward
    // (side view) or outward (front view); + lifts the toes
    const tf = 90 + l.ankle;
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
//   thumb on the side away from the body (out) or toward it (in);
//   point: like out, but the single finger is longer (POINT.finger × the
//   thumb) and the grouped fingers shorter (POINT.palm × the paddle).
// "Out" is the dirM(θ+90) side: forward in side view, away from the
// midline in front view.
const POINT = { finger: 1.6, palm: 0.6 };
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
  const s = L.hand === 'in' ? -1 : 1;
  const pt = L.hand === 'point';
  const pl = pt ? POINT.palm : 1;                     // paddle length factor
  const palm = [at(-0.05, s * wristW * 0.48), at(0.9 * pl, s * 0.16), at(1.0 * pl, -s * 0.13), at(-0.05, -s * wristW * 0.48)];
  // thumb (or pointing finger): a strip with parallel sides and a blunt end
  const td = L.dirM(L.th + s * 42), tn = L.dirM(L.th + s * 42 + 90);
  const tw = 0.09, tl = len * 0.7 * (pt ? POINT.finger : 1);
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
  const fillet = (sign) => {
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
    pts.push(...fillet(-1).slice(1));
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
    pts.push(...fillet(1).slice(1));
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


// The generated head is only a guide: a plain rectangle, `size` tall and
// `size × width` wide, in head-local coords (x forward, y down, centred),
// then rotated and translated. Every character has a drawn face
// (data/faces) that is placed on it; the rectangle shows only on species
// sheets and as the size guide in the face templates.
function headShapes(S, sk) {
  const hh = S.head.size / 2, hw = hh * (S.head.width ?? 1);
  const rect = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
  return [{ role: 'body', head: true, headPart: true, pts: rect.map((q) => add(sk.H, rot(q, sk.headRot))) }];
}

// Front view, derived from a side-view pose (style bible §6): the torso
// stands upright, shortened to its height in the side view; the head is
// upright and front-facing at full size; each arm and leg keeps its
// side-view angles but is mirrored if needed so it points to its own side
// (near = picture-right, far = picture-left); feet point outward and keep
// their tilt from the ground. Returns a front-view pose and a species
// with the shortened spine.
const wrap180 = (v) => { while (v > 180) v -= 360; while (v <= -180) v += 360; return v; };
const MIN_TORSO = 0.35;
export function frontOf(species, sidePose) {
  const side = normalizePose(sidePose);
  if (side.view === 'front') return { species, pose: side };   // already front
  const sk = solve(species, side);
  const { lean, chest } = side.spine;
  const dx = sk.N[0] - sk.P[0], dy = sk.N[1] - sk.P[1];
  const k = Math.max(MIN_TORSO, Math.abs(dy) / Math.hypot(dx, dy));
  const S = { ...species, spine: { ...species.spine, lower: species.spine.lower * k, upper: species.spine.upper * k } };
  const f = JSON.parse(JSON.stringify(side));
  f.view = 'front'; f.headView = 'front';
  f.spine = { lean: 0, chest: 0, neck: 0, head: 0 };
  for (const s of ['near', 'far']) {
    const a = side[s].arm, l = side[s].leg;
    const up = wrap180(-(lean + chest) + a.shoulder), fo = up + a.elbow;   // side-view screen angles
    const th = wrap180(-lean + l.hip), sh = th - l.knee;
    const ga = up >= 0 ? 1 : -1, g = th >= 0 ? 1 : -1;                    // mirror toward its own side
    f[s].arm = { ...a, shoulder: ga * up, elbow: ga * (fo - up) };
    f[s].leg = { hip: g * th, knee: g * (th - sh), ankle: Math.abs(wrap180(90 + l.ankle)) - 90 };
  }
  return { species: S, pose: f };
}

export const DEFAULT_OUTFIT = { bottom: 'briefs', top: 'bare' };

// Build all shapes in draw order: [{pts, role, ...}].
// Outfit (a rendering choice, not part of the pose):
//   bottom: 'briefs' (loincloth only) | 'dhoti' (thighs in cloth colour)
//   top:    'bare' | 'full' (whole torso in cloth colour)
// view: 'side' (default) or 'front' (derived from the side pose; see frontOf).
export function buildShapes(species, pose, outfit = DEFAULT_OUTFIT, view = 'side', bodyScale = 1) {
  if (species.parts && typeof species.parts === 'object') return partsShapes(species, pose, outfit, view, bodyScale);
  if (view === 'front') ({ species, pose } = frontOf(species, pose));
  const sk = solve(species, pose);
  const S = species;
  const out = [];
  // every shape carries `part`, the body part it belongs to (e.g.
  // "near-forearm"); several shapes can make one part (discs + segment)
  const tail = tailShape(S, sk);
  const dhoti = outfit.bottom === 'dhoti', fullTop = outfit.top === 'full';
  const side = (L) => (L === sk.limbs.near ? 'near' : 'far');
  // limbShapes order: arm = shoulder disc, upper arm, elbow disc, forearm, hand…;
  // leg = hip disc, thigh, knee disc, shin, ankle disc, foot
  const armPart = (i) => (i < 3 ? 'upper-arm' : i === 3 ? 'forearm' : 'hand');
  const legPart = (i) => (i < 3 ? 'thigh' : i < 5 ? 'shin' : 'foot');
  // legs: hip disc, thigh and knee disc take the cloth colour in a dhoti
  const pushLeg = (L) => limbShapes(S, L, 'leg').forEach((pts, i) =>
    out.push({ pts, role: dhoti && i < 3 ? 'cloth' : 'body', part: `${side(L)}-${legPart(i)}` }));
  const pushTail = () => { if (tail) [tail.root, tail.body, tail.tip].forEach((pts) => out.push({ pts, role: 'body', part: 'tail' })); };
  const pushArm = (L) => limbShapes(S, L, 'arm').forEach((pts, i) =>
    out.push({ pts, role: 'body', part: `${side(L)}-${armPart(i)}` }));
  const torso = torsoShape(sk);
  const pushTorso = () => out.push(
    { pts: neckShape(S, sk), role: 'body', part: 'neck' },
    { pts: torso, role: fullTop ? 'cloth' : 'body', top: fullTop, part: 'torso' },
    { ...loincloth(S, sk, torso), part: 'loincloth' });
  const head = headShapes(S, sk).map((h) => ({ ...h, part: 'head' }));

  if (sk.front) {
    pushTail(); pushLeg(sk.limbs.far); pushLeg(sk.limbs.near); pushTorso();
    pushArm(sk.limbs.far); pushArm(sk.limbs.near);
    out.push(...head);
  } else {
    // far limbs behind the torso, near limbs in front; near arm over the head
    pushArm(sk.limbs.far); pushLeg(sk.limbs.far); pushTail(); pushLeg(sk.limbs.near); pushTorso();
    out.push(...head);
    pushArm(sk.limbs.near);
  }

  // Lowest point at y = 0. Where the figure sits in a panel is the
  // scene layout's job, not the pose's.
  const bb = bbox(out.map((s) => s.pts));
  const dy = -bb.y1;
  const dx = -(bb.x0 + bb.x1) / 2;
  const mv = (pts) => pts.map((q) => [q[0] + dx, q[1] + dy]);
  for (const s of out) {
    s.pts = mv(s.pts);
    if (s.parts) s.parts = s.parts.map(mv);
    if (s.clipPts) s.clipPts = mv(s.clipPts);
  }
  // where the head ends up, for drawn faces (head-local origin and angle)
  const headAnchor = { at: [sk.H[0] + dx, sk.H[1] + dy], rot: sk.headRot };
  return { shapes: out, sk, headAnchor, bbox: bbox(out.map((s) => s.pts)) };
}

// Drawn-parts figure (species.parts, src/parts.js): same result shape as
// buildShapes. Each shape also has `d`, the drawn curves as path data.
function partsShapes(S, poseIn, outfit, view, bodyScale = 1) {
  // everything comes from the side pose (src/parts.js projects it); the
  // front view only takes its head settings from frontOf
  const side = normalizePose(poseIn);
  const front = view === 'front';
  const pose = front ? normalizePose(frontOf(S, side).pose) : side;
  const { shapes, H, headRot, hair } = buildParts(S.parts, S, side, outfit, front ? 'front' : 'side', bodyScale);
  // Which drawn face shows, from where the head looks (relative to the body)
  // and the view. Side view (the near side is the body's left): front -> the
  // side face, left (toward the viewer) -> the front face, right (away) ->
  // the side face until a back of the head is drawn. Front view: front ->
  // the front face, left -> the side face looking picture-right, right ->
  // the side face mirrored, looking picture-left.
  const L = side.look;
  const face = front ? { view: L === 'front' ? 'front' : 'side', mirror: L === 'right' }
    : { view: L === 'left' ? 'front' : 'side', mirror: false };
  // Front view, front face: the head raised or lowered (as the viewer sees
  // it: lean + chest + neck + head, folded past level) picks the base
  // face's front-up / front-down version, from 25°.
  if (front && face.view === 'front') {
    const sp = side.spine;
    let t = (((sp.lean + sp.chest + sp.neck + sp.head) % 360) + 540) % 360 - 180;
    if (t > 90) t = 180 - t; else if (t < -90) t = -180 - t;
    if (t >= 25) face.nod = 'down'; else if (t <= -25) face.nod = 'up';
  }
  // The head in 3D (faces with turn data, src/headturn.js): tilted in the
  // side plane by lean + chest + neck + head, turned by where it looks
  // (front 0, left 90 toward the near side, right -90). Replaces the face
  // switch above, the up / down faces and the face turning over.
  const sp0 = side.spine;
  face.R = headMatrix(sp0.lean + sp0.chest + sp0.neck + sp0.head, { front: 0, left: 90, right: -90 }[L] ?? 0, front);
  const bb = bbox(shapes.map((s) => s.pts));
  const dx = -(bb.x0 + bb.x1) / 2, dy = -bb.y1;
  const mv = (q) => [q[0] + dx, q[1] + dy];
  for (const s of shapes) {
    s.pts = s.pts.map(mv);
    if (s.segs) { s.segs = s.segs.map((g) => g.map(mv)); s.d = dpSegD(s.segs); }
  }
  return { shapes, sk: { pose, front }, headAnchor: { at: mv(H), rot: headRot, ...face }, hairAnchor: { ...hair, at: mv(hair.at) }, bbox: bbox(shapes.map((s) => s.pts)) };
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

// Cloth patterns for the upper body (a full top), style bible §5.4. A cloth
// name is a palette colour, optionally followed by a pattern:
// "red", "red-check", "red-diamond", "red-stripe". The pattern is drawn in
// black, in head-units, so it scales with the figure.
export const CLOTH_PATTERNS = ['check', 'diamond', 'stripe'];
export function parseCloth(name, palette = {}) {
  const [base, pattern] = String(name || '').split('-');
  return { color: palette[base] ?? palette[name], pattern: CLOTH_PATTERNS.includes(pattern) ? pattern : null };
}
function patternDef(id, kind, ink) {
  const t = 0.54;                                   // tile, head-units
  const body = {
    check: `<rect width="${t / 2}" height="${t / 2}"/><rect x="${t / 2}" y="${t / 2}" width="${t / 2}" height="${t / 2}"/>`,
    diamond: `<path d="M${t / 2} ${t * 0.18}L${t * 0.82} ${t / 2}L${t / 2} ${t * 0.82}L${t * 0.18} ${t / 2}Z"/>`,
    stripe: `<rect y="${t * 0.36}" width="${t}" height="${t * 0.28}"/>`,
  }[kind];
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${t}" height="${t}"><g fill="${ink}">${body}</g></pattern>`;
}

// Render a figure as an SVG <g>. Ground point at (x, y) in px; `scale` is
// px per head-unit; facing 1 (right) or -1 (left); view 'side' (default)
// or 'front' (derived from the side pose). `id` prefixes the figure's clip
// and pattern ids; give each figure on a page its own (default: a counter).
// The other options are a character look (see characterLook): colors,
// outfit, pattern, face, bodyScale (torso and legs; drawn parts only).
let clipSeq = 0;
export function renderFigure(species, pose, opts = {}) {
  const { x = 0, y = 0, scale = 20, facing = 1 } = opts;
  const colors = { ...DEFAULT_COLORS, ...(opts.colors || {}) };
  const { shapes, headAnchor, hairAnchor, sk, bbox: bb } = buildShapes(species, pose, { ...DEFAULT_OUTFIT, ...(opts.outfit || {}) }, opts.view, opts.bodyScale ?? 1);
  // Drawn face (data/faces): replaces the guide head (every character has
  // one; the guide shows on species sheets only). Its layers are
  // copied unchanged, colours included, and placed with one transform.
  const drawn = opts.face?.[headAnchor.view ?? (sk.pose.headView === 'front' ? 'front' : 'side')];
  const place = (g) => `<g transform="translate(${headAnchor.at[0]} ${headAnchor.at[1]}) rotate(${headAnchor.rot})${headAnchor.mirror ? ' scale(-1 1)' : ''}">${g}</g>`;
  // a raised / lowered head uses that version of the face when drawn
  const ver = (headAnchor.nod && drawn?.[headAnchor.nod]) || drawn;
  // the base face's skin is currentColor: the body colour
  const clipId0 = opts.id ?? `face${clipSeq + 1}`;
  // a face with turn data is drawn in 3D (src/headturn.js) at the head's place
  const turned = opts.face?.turn && headAnchor.R;
  const at = `translate(${headAnchor.at[0]} ${headAnchor.at[1]})`;
  const turnPart = (part) => `<g transform="${at}" color="${colors.body}">${headTurn(opts.face.turn, 0, 0, { R: headAnchor.R, part, mouth: sk.pose.mouth, id: `${clipId0}${part}` })}</g>`;
  const faceHead = turned ? turnPart('head') : drawn && place(`<g color="${colors.body}">${ver.head || ''}${ver.mouth?.[sk.pose.mouth] || ''}</g>`);
  // Shapes are emitted in draw order; consecutive body shapes share one
  // <g fill> so the silhouette merges visually.
  let svg = `<g transform="translate(${x} ${y}) scale(${facing * scale} ${scale})">`;
  const clipId = opts.id ?? `face${++clipSeq}`;
  let inBody = false;
  if (drawn?.defs) svg += `<defs>${drawn.defs}</defs>`;
  if (turned) svg += turnPart('back');                 // behind the whole body
  else if (drawn?.back) svg += place(drawn.back);
  let headDone = false;
  for (const s of shapes) {
    if (s.hairBody) {                                   // the face's body hair, moved with the upper body
      if (drawn?.hairBody && hairAnchor) {
        if (inBody) { svg += '</g>'; inBody = false; }
        const [nx, ny] = drawn.nape || [0, 0.65];
        svg += `<g transform="translate(${hairAnchor.at[0]} ${hairAnchor.at[1]}) rotate(${hairAnchor.rot}) scale(1 ${hairAnchor.sy}) translate(${-nx} ${-ny})">${drawn.hairBody}</g>`;
      }
      continue;
    }
    if (faceHead && s.headPart) {                       // drawn face instead of the generated head
      // placed where the guide head would go
      if (!headDone) { if (inBody) { svg += '</g>'; inBody = false; } svg += faceHead; headDone = true; }
      continue;
    }
    if (s.role === 'body') {
      if (!inBody) { svg += `<g fill="${colors.body}">`; inBody = true; }
      svg += `<path d="${s.d ?? pathD(s.pts)}"/>`;
      continue;
    }
    if (inBody) { svg += '</g>'; inBody = false; }
    if (s.parts) {
      const id = `${clipId}c${shapes.indexOf(s)}`;
      svg += `<clipPath id="${id}"><path d="${pathD(s.clipPts)}"/></clipPath>` +
        `<g fill="${colors[s.role]}" clip-path="url(#${id})">${s.parts.map((p) => `<path d="${pathD(p)}"/>`).join('')}</g>`;
    } else if (s.top && opts.pattern && CLOTH_PATTERNS.includes(opts.pattern)) {
      // patterned top: the cloth colour, then the pattern over it
      const id = `${clipId}p${shapes.indexOf(s)}`, d = s.d ?? pathD(s.pts);
      svg += `<defs>${patternDef(id, opts.pattern, '#000000')}</defs>` +
        `<path d="${d}" fill="${colors.cloth}"/><path d="${d}" fill="url(#${id})"/>`;
    } else {
      svg += `<path d="${s.d ?? pathD(s.pts)}" fill="${colors[s.role]}"/>`;
    }
  }
  if (inBody) svg += '</g>';
  svg += '</g>';
  return { svg, bbox: bb };
}

// Look of a character from data/characters.json: species id plus the
// render options (colours, outfit) for renderFigure.
// `cloth` overrides the character's cloth (e.g. a pattern for one figure).
export function characterLook(character, palette, faces, cloth = character.cloth) {
  const c = parseCloth(cloth, palette.cloth);
  return {
    face: faces?.faces?.[character.id],
    species: character.species,
    pattern: c.pattern,
    colors: { body: character.body, cloth: c.color },
    outfit: { top: character.top, bottom: character.bottom },
    bodyScale: character.scale ?? 1,
  };
}
