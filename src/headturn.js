// Head orientation: 3×3 matrices from head-local coordinates (x across,
// y down, z toward the face) to picture coordinates (u right, v down, w
// toward the viewer). A head is drawn as the nearest of the face's drawn
// views (headView below; src/figure.js draws it); these give its orientation to
// pick it by.

import { RAD } from './geom.js';

// 3×3 matrix product A·B
const htMul = (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));

// yaw (degrees): 0 = the face toward the viewer, 90 = looking picture-right,
// 180 = the back of the head; pitch: + raises the face
export function htRot(yaw, pitch) {
  const cy = Math.cos(yaw * RAD), sy = Math.sin(yaw * RAD), cp = Math.cos(pitch * RAD), sp = Math.sin(pitch * RAD);
  // object (x right, y down, z toward the viewer at yaw 0) -> picture (u, v, w toward the viewer)
  const Ry = [[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]];
  const Rx = [[1, 0, 0], [0, cp, -sp], [0, sp, cp]];
  return htMul(Rx, Ry);
}

// A figure's head: head-local -> picture, from the side pose. The head
// tilts in the side plane by `tilt` (lean + chest + neck + head; + bows the
// face) and turns about its own up axis by `turn` (+ toward the body's near
// side). Front view: the camera looks at the body's front (picture-right =
// the near side). Side view: the camera looks at the side (picture-right =
// forward); the head is taken as symmetric, so the far side is shown, as in
// the side drawing.
export function headMatrix(tilt, turn, front) {
  const t = tilt * RAD, a = (front ? turn : -turn) * RAD;
  const ct = Math.cos(t), st = Math.sin(t), ca = Math.cos(a), sa = Math.sin(a);
  // head-local (x, y, z = face) -> body (X near side, Y down, Z forward): turn about Y, then tilt about X
  const turnM = [[ca, 0, sa], [0, 1, 0], [-sa, 0, ca]];
  const tiltM = [[1, 0, 0], [0, ct, st], [0, -st, ct]];
  const B = htMul(tiltM, turnM);
  // body -> picture (u, v, w toward the viewer)
  return front ? [B[0], B[1], B[2]] : [B[2], B[1], B[0].map((v) => -v)];
}

// The face's views (data/faces.json), each the head as drawn at a yaw and
// pitch (htRot): quarter looks picture-right; turns to the other side use the
// drawing mirrored. front-up is not one of the intended views but is used
// when drawn.
export const HEAD_VIEWS = [
  ['front', 0, 0], ['quarter', 30, 0], ['side', 90, 0], ['back-view', 180, 0],
  ['front-down', 0, -40], ['top', 0, -90], ['front-up', 0, 40],
];
// The intended views, in the order the pose lab shows them.
export const INTENDED_VIEWS = ['front', 'quarter', 'side', 'back-view', 'front-down', 'top'];

// The nearest drawn view for a head at R (head-local -> picture), among
// `have` (view names): the one seen from the most similar direction (a roll
// in the picture plane is free: the drawing is rotated). Returns { view,
// mirror, m } where m is the 2×2 [a b c d] placing the drawing in the
// picture (a rotation, or a reflection when mirrored), or null.
export function headView(R, have) {
  const eye = R[2];                                   // the viewer's direction, head-local
  let best = null;
  for (const [view, yaw, pitch] of HEAD_VIEWS) {
    if (!have.includes(view)) continue;
    for (const mirror of yaw % 180 ? [false, true] : [false]) {
      const Q = htRot(mirror ? -yaw : yaw, pitch);
      const score = eye[0] * Q[2][0] + eye[1] * Q[2][1] + eye[2] * Q[2][2];
      if (!best || score > best.score + 1e-9) best = { view, mirror, Q, score };
    }
  }
  if (!best) return null;
  // drawing (picture of the head at Q) -> picture of the head at R: R Qᵀ,
  // its in-plane part, made a pure rotation / reflection
  const { Q, mirror } = best;
  const RQ = (i, j) => R[i][0] * Q[j][0] + R[i][1] * Q[j][1] + R[i][2] * Q[j][2];
  let a = RQ(0, 0), b = RQ(0, 1), c = RQ(1, 0), d = RQ(1, 1);
  if (mirror) { a = -a; c = -c; }                     // the drawing mirrored first
  let m;
  if (a * d - b * c >= 0) { const t = Math.atan2(c - b, a + d); m = [Math.cos(t), Math.sin(t), -Math.sin(t), Math.cos(t)]; }
  else { const t = Math.atan2(c + b, a - d); m = [Math.cos(t), Math.sin(t), Math.sin(t), -Math.cos(t)]; }
  return { view: best.view, mirror, m };
}
