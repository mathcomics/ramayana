// Recompose poses from their base × gesture coordinates (the index),
// re-running the contact solves — the pose becomes exactly what the grid
// derives, and any difference from the stored pose was per-pose tuning.
//
//   node tools/recompose.mjs <pose ...>        # these poses
//   node tools/recompose.mjs --base kneel      # every pose of a base
//   node tools/recompose.mjs --gesture palms   # every pose of a gesture
//   node tools/recompose.mjs --all             # every pose
//   ... --dry                                  # report only, write nothing
//
// Writes data/poses.json (keeping each pose's own mouth and order).
// Review: git diff, the contact sheet / catalogues, npm test (snapshot).

import { loadAssets, json, writeOut } from './lib.mjs';
import { normalizePose } from '../src/figure.js';
import { makeComposer, baseOf, gestureOf, storedPose } from './compose-lib.mjs';

const args = process.argv.slice(2);
const flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const dry = args.includes('--dry');

const A = loadAssets();
const index = json('data/pose-index.json');
const names = A.poses.map((p) => p.name);
let targets;
if (args.includes('--all')) targets = names;
else if (flag('--base')) targets = index.bases[flag('--base')]?.poses ?? [];
else if (flag('--gesture')) targets = index.gestures[flag('--gesture')]?.poses ?? [];
else targets = args.filter((a) => !a.startsWith('--'));
targets = targets.filter((n) => names.includes(n));
if (!targets.length) throw new Error('nothing to recompose (pose names, --base, --gesture or --all)');

const { compose } = makeComposer(A, index);
const clone = (o) => JSON.parse(JSON.stringify(o));

// largest numeric difference between two normalised poses (worst joint)
function drift(a, b) {
  let worst = { d: 0, at: '' };
  const walk = (x, y, path) => {
    for (const k of new Set([...Object.keys(x ?? {}), ...Object.keys(y ?? {})])) {
      const vx = x?.[k], vy = y?.[k];
      if (typeof vx === 'object' || typeof vy === 'object') walk(vx, vy, `${path}${k}.`);
      else if (typeof vx === 'number' || typeof vy === 'number') {
        const d = Math.abs((vx ?? 0) - (vy ?? 0));
        if (d > worst.d) worst = { d, at: path + k };
      } else if (vx !== vy && worst.d < 0.1) worst = { d: 0.1, at: `${path}${k} (${vx} -> ${vy})` };
    }
  };
  for (const part of ['spine', 'near', 'far', 'tail']) walk(a[part], b[part], part + '.');
  return worst;
}

const d = json('data/poses.json');
const report = [];
for (const name of targets) {
  const b = baseOf(index, name), g = gestureOf(index, name);
  const stored = normalizePose(clone(d.poses.find((p) => p.name === name)));
  const composed = compose(b, g, { name, mouth: stored.mouth });
  // what stays the pose's own: gaze (rule 3), mouth, tail (expressive,
  // not stance) and turn — the grid owns legs + lean + arms + chest
  composed.spine.turn = stored.spine.turn ?? 0;
  composed.spine.neck = stored.spine.neck;
  composed.spine.head = stored.spine.head;
  composed.tail = clone(stored.tail);
  const w = drift(stored, composed);
  report.push({ name, b, g, w });
  if (!dry) {
    const i = d.poses.findIndex((p) => p.name === name);
    d.poses[i] = storedPose(composed);
  }
}
report.sort((x, y) => y.w.d - x.w.d);
console.log(`${targets.length} pose(s) ${dry ? 'checked' : 'recomposed'} (drift = what per-pose tuning differed, worst joint):`);
for (const r of report) console.log(`  ${r.name.padEnd(26)} ${r.b} × ${r.g}`.padEnd(50) + (r.w.d ? ` ${r.w.d.toFixed(1).padStart(6)}°  ${r.w.at}` : '      —'));
if (!dry) {
  writeOut('data/poses.json', JSON.stringify(d, null, 2) + '\n');
  console.log('data/poses.json written: look at the sheets, then npm test.');
}
