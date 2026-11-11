// Composing a pose from its base and gesture (docs/design/pose-picking.md).
// A pose is named <base>-<gesture>; data/bases.json holds each base's
// lower body (legs, lean, tail), data/gestures.json each gesture's upper
// body (arms, chest, neck, head, mouth). The pose is exactly what the two
// give — nothing per pose. Used by the asset loader (tools/lib.mjs), the
// tests and the pose lab (bundled), so all three compose the same way.
//
// A gesture that tips the whole body (a bow) carries `lean`, degrees
// added to the base's lean; the base's planted feet are then kept by a
// two-bone leg solve. A gesture with `join: true` (joined palms) re-runs
// the hand solves per base: the far hand laid exactly on the near one in
// the side view, and kept on the body's midline in the front view
// (forearm within 40° of the paper, past which the drawn hand
// foreshortens into a fan).
//
// Solves run on the `male` species proportions (the shared skeleton), so
// a pose is the same for every species.

import { renderFigure, normalizePose } from './figure.js';

// "<base>-<gesture>" -> [base, gesture]; base names are one word
export function splitPoseName(name) {
  const i = name.indexOf('-');
  return i < 0 ? [name, ''] : [name.slice(0, i), name.slice(i + 1)];
}

// A base and a gesture as a whole stored pose (right / left limbs), before
// any solve. `name` defaults to <base>-<gesture>.
export function rawPose(baseName, base, gesture, name) {
  const c = (o) => JSON.parse(JSON.stringify(o ?? {}));
  const [, gName] = splitPoseName(name || '');
  return {
    name: name || `${baseName}-${gName}`,
    mouth: gesture.mouth ?? 2,
    spine: { lean: (base.lean ?? 0) + (gesture.lean ?? 0), chest: gesture.chest ?? 0, neck: gesture.neck ?? 0, head: gesture.head ?? 0, turn: 0 },
    right: { arm: c(gesture.right), leg: c(base.right) },
    left: { arm: c(gesture.left), leg: c(base.left) },
    tail: c(base.tail),
  };
}

// poseComposer(S) -> compose(bases, gestures, name): the stored pose
// (right / left), solved for planted feet and joined palms.
export function poseComposer(S) {
  const D2 = 180 / Math.PI;
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const wrapA = (v) => ((v + 540) % 360) - 180;
  const ang = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]) * D2;
  const clamp = (lo, hi, v) => Math.max(lo, Math.min(hi, Math.round(v * 10) / 10));
  const jf = (pose, view) => renderFigure(S, pose, { x: 0, y: 0, scale: 1, facing: 1, ...(view === 'front' ? { view: 'front' } : {}) }).joints;

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

  // The base's planted feet (pelvis-relative ankles), drawn on its own
  // lean with the arms hanging. A generous test (0.4): a foot that merely
  // hovers (the kneel forward foot, problem-poses) still keeps its place.
  function plantedFeet(base) {
    const J = jf(normalizePose(rawPose('', base, {}, 'probe'))), P = J.spine.pelvis;
    const pin = {};
    for (const sd of ['near', 'far']) if (J[sd].low[1] > -0.4) pin[sd] = [J[sd].A[0] - P[0], J[sd].A[1] - P[1]];
    return pin;
  }

  // -> the stored pose (right / left), or throws on an unknown half
  return function compose(bases, gestures, name) {
    const [b, g] = splitPoseName(name);
    const B = bases[b], G = gestures[g];
    if (!B) throw new Error(`${name}: no base ${b}`);
    if (!G) throw new Error(`${name}: no gesture ${g}`);
    const pose = normalizePose(rawPose(b, B, G, name));
    if (G.lean) {
      const pin = plantedFeet(B);
      if (Object.keys(pin).length) settleLegs(pose, pin);
    }
    if (G.join) joinSolve(pose);
    return { name, mouth: pose.mouth, spine: pose.spine, right: pose.near, left: pose.far, tail: pose.tail };
  };
}

// Every pose named in data/poses.json, composed, in its order.
export function composePoses(S, bases, gestures, names) {
  const compose = poseComposer(S);
  return names.map((n) => compose(bases, gestures, n));
}
