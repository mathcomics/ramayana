// Composing a pose from a base × gesture pair (pose composition:
// docs/proposals/2026-11-07-pose-composition.md). Used by the recompose
// tool; the pose lab carries the same logic inline (poselab.template.html).
//
// compose(base, gesture): legs + tail + lean from the base's reference
// pose; arms + chest/neck/head + mouth from the gesture's. A gesture
// that tips the whole body carries `lean` (degrees, added to the base's
// lean); the base's planted feet are kept by a two-bone leg solve. A
// gesture with `join: true` (joined palms) re-runs the hand solves per
// base: the far hand laid exactly on the near one in the side view, and
// kept on the body's midline in the front view (forearm within 40° of
// the paper, past which the drawn hand foreshortens into a fan).

import { renderFigure, normalizePose } from '../src/figure.js';

const D2 = 180 / Math.PI;
const clone = (o) => JSON.parse(JSON.stringify(o));
const wrapA = (v) => ((v + 540) % 360) - 180;
const ang = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]) * D2;
const clamp = (lo, hi, v) => Math.max(lo, Math.min(hi, Math.round(v * 10) / 10));

export const baseOf = (index, name) => Object.keys(index.bases).find((k) => index.bases[k].poses.includes(name));
export const gestureOf = (index, name) => Object.keys(index.gestures).find((k) => index.gestures[k].poses.includes(name));

// near/far (normalised) -> the stored right/left form of poses.json
export function storedPose(p) {
  return clone({ name: p.name, mouth: p.mouth, spine: p.spine, right: p.near, left: p.far, tail: p.tail });
}

export function makeComposer(A, index, speciesId = 'male') {
  const S = A.species[speciesId];
  const jf = (pose, view) => renderFigure(S, pose, { x: 0, y: 0, scale: 1, facing: 1, ...(view === 'front' ? { view: 'front' } : {}) }).joints;
  const ref = (name) => {
    const p = A.poses.find((q) => q.name === name);
    if (!p) throw new Error(`no pose ${name}`);
    return normalizePose(clone(p));
  };

  function settleLegs(pose, pin) {
    for (let pass = 0; pass < 3; pass++) {
      const J = jf(pose), P = J.spine.pelvis;
      let moved = false;
      for (const sd of Object.keys(pin)) {
        const { hp, Kn, A: An } = J[sd], T = [P[0] + pin[sd][0], P[1] + pin[sd][1]];
        if (Math.hypot(An[0] - T[0], An[1] - T[1]) < 0.01) continue;
        moved = true;
        const L1 = Math.hypot(Kn[0] - hp[0], Kn[1] - hp[1]) || 1e-6;
        const L2 = Math.hypot(An[0] - Kn[0], An[1] - Kn[1]) || 1e-6;
        const D = [T[0] - hp[0], T[1] - hp[1]];
        const d = Math.max(Math.abs(L1 - L2) + 1e-4, Math.min(Math.hypot(D[0], D[1]), L1 + L2 - 1e-4));
        const phi = Math.atan2(D[0], D[1]) * D2;
        const alpha = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)))) * D2;
        const thT = phi + alpha;                       // the knee always flexes backward
        const KnT = [hp[0] + Math.sin(thT / D2) * L1, hp[1] + Math.cos(thT / D2) * L1];
        const shT = Math.atan2(T[0] - KnT[0], T[1] - KnT[1]) * D2;
        const leg = pose[sd].leg;
        leg.hip = clamp(-90, 150, leg.hip + wrapA(thT - ang(hp, Kn)));
        leg.knee = clamp(0, 160, leg.knee + wrapA(thT - shT) - wrapA(ang(hp, Kn) - ang(Kn, An)));
      }
      if (!moved) break;
    }
  }

  // the far hand exactly onto the near hand (side view), then back to the
  // body's midline (front view): the per-base part of joined palms
  function joinSolve(pose) {
    for (let round = 0; round < 3; round++) {
      for (let pass = 0; pass < 4; pass++) {          // far hand -> near hand
        const J = jf(pose);
        const T = J.near.grip, { sh, E, grip } = J.far;
        if (Math.hypot(grip[0] - T[0], grip[1] - T[1]) < 0.005) break;
        const L1 = Math.hypot(E[0] - sh[0], E[1] - sh[1]) || 1e-6;
        const L2 = Math.hypot(grip[0] - E[0], grip[1] - E[1]) || 1e-6;
        const D = [T[0] - sh[0], T[1] - sh[1]];
        const d = Math.max(Math.abs(L1 - L2) + 1e-4, Math.min(Math.hypot(D[0], D[1]), L1 + L2 - 1e-4));
        const phi = Math.atan2(D[0], D[1]) * D2;
        const alpha = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)))) * D2;
        const upT = phi - alpha;                       // the elbow flexes forward
        const ET = [sh[0] + Math.sin(upT / D2) * L1, sh[1] + Math.cos(upT / D2) * L1];
        const foT = Math.atan2(T[0] - ET[0], T[1] - ET[1]) * D2;
        const arm = pose.far.arm;
        arm.shoulder = clamp(-90, 230, arm.shoulder + wrapA(upT - ang(sh, E)));
        arm.elbow = clamp(0, 160, arm.elbow + wrapA(foT - upT) - wrapA(ang(E, grip) - ang(sh, E)));
      }
      for (let pass = 0; pass < 6; pass++) {          // far hand -> midline
        const J = jf(pose, 'front');
        const err = J.far.grip[0] - J.spine.pelvis[0];
        if (Math.abs(err) < 0.05) break;
        const arm = pose.far.arm, v = arm.elbowOut ?? 0;
        const probe = clone(pose);
        probe.far.arm.elbowOut = v + 3;
        const dx = jf(probe, 'front').far.grip[0] - jf(probe, 'front').spine.pelvis[0] - err;
        if (Math.abs(dx) < 1e-4) break;
        const dv = Math.max(-30, Math.min(30, -err * 3 / dx));
        const ao = arm.out ?? 0;
        arm.elbowOut = clamp(Math.max(-90, -40 - ao), Math.min(90, 40 - ao), v + dv);
      }
    }
  }

  // -> a normalised pose (near/far); storedPose() for poses.json form
  function compose(baseName, gestName, { name, mouth } = {}) {
    const B = index.bases[baseName], G = index.gestures[gestName];
    if (!B) throw new Error(`no base ${baseName}`);
    if (!G) throw new Error(`no gesture ${gestName}`);
    const bp = ref(B.poses[0]), gp = ref(G.poses[0]);
    const pose = normalizePose({
      name: name || `${baseName}-${gestName}`,
      mouth: mouth ?? gp.mouth,
      spine: { lean: bp.spine.lean + (G.lean ?? 0), chest: gp.spine.chest, neck: gp.spine.neck, head: gp.spine.head, turn: 0 },
      near: { arm: clone(gp.near.arm), leg: clone(bp.near.leg) },
      far: { arm: clone(gp.far.arm), leg: clone(bp.far.leg) },
      tail: clone(bp.tail),
    });
    const JB = jf(bp), PB = JB.spine.pelvis;
    const pin = {};
    // generous planted test (0.4): a base's foot that merely hovers (the
    // kneel forward foot, problem-poses) must still keep its place
    for (const sd of ['near', 'far']) if (JB[sd].low[1] > -0.4) pin[sd] = [JB[sd].A[0] - PB[0], JB[sd].A[1] - PB[1]];
    if (Object.keys(pin).length) settleLegs(pose, pin);
    if (G.join) joinSolve(pose);
    return pose;
  }

  return { compose, jf, ref };
}
