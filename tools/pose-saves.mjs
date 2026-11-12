// Report what pose-lab saves change (the commit-pose-lab skill). Writes
// nothing unless --write: merging takes judgment
// (docs/design/pose-picking.md).
//
//   node tools/pose-saves.mjs <dir> [--write]
//
// <dir> holds the saves as the lab stores them (ArtifactData list with
// out_dir writes <out_dir>/<collection>/<doc>.json; pass <out_dir>):
//   bases/<name>.json     { base, savedAt }      a base, whole
//   gestures/<name>.json  { gesture, savedAt }   a gesture, whole
//   poses/<name>.json     { pose, savedAt }      a pose's finding fields
//                         { removed: true, ... } take the pose out of the list
// Older saves in poses/ hold a whole pose (pose.spine ...): from before
// bases and gestures were split. They are reported as the change they
// make to the pose's base (legs, lean, tail) and gesture (arms, chest,
// neck, head, mouth); merge those by hand into a base / gesture save's
// shape, never per pose.
//
// Per save: same | changed (the values) | new, the checks (one-word
// name, a pose's base and gesture exist, known tags), and the poses that
// a base or gesture change reaches. --write applies every new and changed
// base, gesture and pose save to the data files (not older whole-pose
// saves); look at the renders before committing.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { json, writeOut, loadPoseData } from './lib.mjs';
import { normalizePose } from '../src/figure.js';
import { splitPoseName as split } from '../src/compose.js';

const dir = process.argv[2];
const write = process.argv.includes('--write');
if (!dir) { console.error('usage: node tools/pose-saves.mjs <out_dir> [--write]'); process.exit(1); }
const D = loadPoseData();
const files = { bases: json('data/bases.json'), gestures: json('data/gestures.json'), poses: json('data/poses.json') };
const FIELD = { bases: 'base', gestures: 'gesture', poses: 'pose' };

const flat = (o, p = '', out = {}) => {
  for (const [k, v] of Object.entries(o || {})) {
    const q = p ? `${p}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, q, out); else out[q] = v;
  }
  return out;
};
const fmt = (v) => (typeof v === 'number' ? Math.round(v * 10) / 10 : JSON.stringify(v));
const changes = (a, b) => {
  const A = flat(a), B = flat(b);
  return [...new Set([...Object.keys(A), ...Object.keys(B)])]
    .filter((k) => JSON.stringify(fmt(A[k])) !== JSON.stringify(fmt(B[k])))
    .map((k) => `${k}: ${fmt(A[k])} -> ${fmt(B[k])}`);
};
const users = (kind, name) => Object.keys(D.poses).filter((n) => split(n)[kind === 'bases' ? 0 : 1] === name);

let changed = 0;
for (const kind of ['bases', 'gestures', 'poses']) {
  const d = join(dir, kind);
  if (!existsSync(d)) continue;
  for (const f of readdirSync(d).filter((f) => f.endsWith('.json')).sort()) {
    const name = f.slice(0, -5), doc = JSON.parse(readFileSync(join(d, f), 'utf8'));
    const tag = `${kind.slice(0, -1)} ${name}`, when = `(saved ${doc.savedAt || '?'})`;
    // an older whole-pose save: what it would change in its base and gesture
    if (kind === 'poses' && doc.pose?.spine) {
      const p = normalizePose(JSON.parse(JSON.stringify(doc.pose)));
      const [b, g] = split(name);
      console.log(`${tag}: OLDER WHOLE-POSE SAVE ${when}: merge by hand as a base / gesture change`);
      if (D.bases[b]) for (const c of changes(D.bases[b], { ...D.bases[b], lean: p.spine.lean - (D.gestures[g]?.lean ?? 0), right: p.near.leg, left: p.far.leg, tail: p.tail }))
        console.log(`  base ${b} (${users('bases', b).length} poses): ${c}`);
      if (D.gestures[g]) for (const c of changes(D.gestures[g], { ...D.gestures[g], chest: p.spine.chest, neck: p.spine.neck, head: p.spine.head, mouth: p.mouth, right: p.near.arm, left: p.far.arm }))
        console.log(`  gesture ${g} (${users('gestures', g).length} poses): ${c}`);
      continue;
    }
    const notes = [];
    if (kind !== 'poses' && !/^[a-z]+$/.test(name)) notes.push('name is not one lower-case word');
    if (kind === 'poses') {
      const [b, g] = split(name);
      const known = (k, n) => D[k][n] || existsSync(join(dir, k, `${n}.json`));
      if (!known('bases', b)) notes.push(`no base ${b} (repo or saves)`);
      if (!known('gestures', g)) notes.push(`no gesture ${g} (repo or saves)`);
      for (const t of doc.pose?.use || []) if (!D.tags[t]) notes.push(`unknown tag ${t}`);
      for (const l of doc.pose?.like || []) if (!D.poses[l]) notes.push(`like: no pose ${l}`);
      if (doc.pose && !doc.pose.desc) notes.push('no desc');
    }
    const old = (kind === 'poses' ? D.poses : D[kind])[name];
    if (doc.removed) {
      console.log(`${tag}: REMOVE ${when}${old ? '' : ' (not in the repo: nothing to do)'}`);
      if (old) { changed++; if (write) delete files.poses.poses[name]; }
    } else {
      const item = doc[FIELD[kind]];
      if (!item) { console.log(`${tag}: skip, no ${FIELD[kind]}`); continue; }
      const cs = old ? changes(old, item) : [];
      console.log(`${tag}: ${!old ? 'NEW' : cs.length ? 'changed' : 'same'} ${when}`);
      for (const c of cs) console.log(`  ${c}`);
      if (kind !== 'poses' && (cs.length || !old)) {
        const u = users(kind, name);
        console.log(`  reaches ${u.length} pose${u.length === 1 ? '' : 's'}${u.length ? ': ' + u.join(', ') : ' (none yet)'}`);
      }
      if (!old || cs.length) {
        changed++;
        if (write) (kind === 'poses' ? files.poses.poses : files[kind][kind])[name] = item;
      }
    }
    for (const n of notes) console.log(`  ! ${n}`);
  }
}

if (write && changed) {
  const sorted = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
  files.bases.bases = sorted(files.bases.bases);
  files.gestures.gestures = sorted(files.gestures.gestures);
  files.poses.poses = sorted(files.poses.poses);
  for (const k of ['bases', 'gestures', 'poses']) writeOut(`data/${k}.json`, JSON.stringify(files[k], null, 2) + '\n');
  console.log(`written: ${changed} change(s) to data/bases.json, gestures.json, poses.json`);
} else if (write) console.log('nothing to write');
