// Report what pose-lab saves change (the commit-pose-lab skill). Writes
// nothing: merging a pose takes judgment (docs/design/pose-picking.md).
//
//   node tools/pose-saves.mjs <dir>
//
// <dir> holds the saves as JSON files, as the lab stores them:
// { pose, savedAt } (ArtifactData list with out_dir writes
// <out_dir>/poses/<doc>.json; pass that poses folder).
// Per save: same | changed | new, the name check (<base>-<gesture> from
// data/pose-index.json), and the changed values grouped by the half they
// belong to. The lower body (legs, tail, spine.lean) belongs to the base:
// a change there is a retune of the base's reference pose (the first in
// its list) and is merged by applying it there and recomposing the
// family (tools/recompose.mjs --base <base>). The upper body (arms, chest,
// neck, head, mouth) belongs to the gesture's reference pose likewise;
// neck, head, mouth, turn stay a pose's own through a recompose.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { json } from './lib.mjs';

const dir = process.argv[2];
if (!dir) { console.error('usage: node tools/pose-saves.mjs <dir of saved pose JSON>'); process.exit(1); }
const poses = json('data/poses.json').poses, index = json('data/pose-index.json');
const byName = new Map(poses.map((p) => [p.name, p]));
const baseOf = (n) => Object.keys(index.bases).find((k) => index.bases[k].poses.includes(n));
const gestureOf = (n) => Object.keys(index.gestures).find((k) => index.gestures[k].poses.includes(n));

const flat = (o, p = '', out = {}) => {
  for (const [k, v] of Object.entries(o || {})) {
    const q = p ? `${p}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, q, out); else out[q] = v;
  }
  return out;
};
const half = (path) => /^(right|left)\.leg\.|^tail\.|^spine\.lean$/.test(path) ? 'base'
  : /^spine\.turn$/.test(path) ? 'own' : 'gesture';
const fmt = (v) => (typeof v === 'number' ? Math.round(v * 10) / 10 : JSON.stringify(v));

for (const f of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
  const d = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const p = d.pose;
  if (!p?.name) { console.log(`${f}: skip, no pose`); continue; }
  const name = p.name, old = byName.get(name);
  // name check: <base>-<gesture>, both known to the index
  const [b, ...g] = name.split('-'), gest = g.join('-');
  const nameOk = index.bases[b] && index.gestures[gest];
  const listed = baseOf(name) && gestureOf(name);
  const notes = [];
  if (!nameOk) notes.push(`name is not <base>-<gesture> from the index (base "${b}"${index.bases[b] ? '' : ' unknown'}, gesture "${gest}"${index.gestures[gest] ? '' : ' unknown'})`);
  else if (!listed) notes.push(`not in the index yet: add "${name}" to bases.${b}.poses, gestures.${gest}.poses and a poses entry`);
  const wanted = Object.keys(index.wanted || {}).filter((w) => (index.wanted[w].until || '').includes(name));
  if (wanted.length) notes.push(`mentioned by wanted: ${wanted.join(', ')}`);
  if (!old) { console.log(`${name}: new  (saved ${d.savedAt || '?'})`); notes.forEach((n) => console.log(`  ! ${n}`)); continue; }
  const A = flat(old), B = flat(p);
  const keys = [...new Set([...Object.keys(A), ...Object.keys(B)])].filter((k) => k !== 'name' && JSON.stringify(A[k]) !== JSON.stringify(B[k]));
  const round = (v) => (typeof v === 'number' ? Math.round(v * 10) / 10 : v);
  const real = keys.filter((k) => JSON.stringify(round(A[k])) !== JSON.stringify(round(B[k])));
  if (!real.length) { console.log(`${name}: same`); continue; }
  console.log(`${name}: changed  (saved ${d.savedAt || '?'})`);
  for (const h of ['base', 'gesture', 'own']) {
    const ks = real.filter((k) => half(k) === h);
    if (!ks.length) continue;
    const ref = h === 'base' ? index.bases[baseOf(name)]?.poses[0] : h === 'gesture' ? index.gestures[gestureOf(name)]?.poses[0] : null;
    const who = h === 'base' ? `base ${baseOf(name)} (reference ${ref}${ref === name ? ', this pose' : ''})`
      : h === 'gesture' ? `gesture ${gestureOf(name)} (reference ${ref}${ref === name ? ', this pose' : ''})` : 'the pose\'s own';
    console.log(`  ${who}:`);
    for (const k of ks) console.log(`    ${k}: ${fmt(A[k])} -> ${fmt(B[k])}`);
  }
  notes.forEach((n) => console.log(`  ! ${n}`));
}
