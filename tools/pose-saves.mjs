// Report what pose-lab saves change (the commit-pose-lab skill). Writes
// nothing unless --write: merging takes judgment
// (docs/design/pose-picking.md).
//
//   node tools/pose-saves.mjs <dir> [--write]
//
// <dir> holds the saves as the lab stores them (ArtifactData list with
// out_dir writes <out_dir>/<collection>/<doc>.json; pass <out_dir>):
//   bases/<name>.json     { base, savedAt }      a base, whole (angles and finding fields)
//   gestures/<name>.json  { gesture, savedAt }   a gesture, whole
// There are no pose saves: a pose is any <base>-<gesture>, and what it is
// for is its base's and gesture's `use`. A file left in poses/ is from
// before that (2026-11-14) and is only named.
//
// Per save: same | changed (the values) | new, the checks (one-word
// name, known tags), and the panels' poses that a base or gesture change
// reaches. --write applies every new and changed save to the data files;
// look at the renders before committing.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { json, writeOut, loadPoseData, panelPairs } from './lib.mjs';
import { splitPoseName as split } from '../src/compose.js';

const dir = process.argv[2];
const write = process.argv.includes('--write');
if (!dir) { console.error('usage: node tools/pose-saves.mjs <out_dir> [--write]'); process.exit(1); }
const D = loadPoseData();
const files = { bases: json('data/bases.json'), gestures: json('data/gestures.json') };
const FIELD = { bases: 'base', gestures: 'gesture' };
const PAIRS = Object.keys(panelPairs(D));

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
const users = (kind, name) => PAIRS.filter((n) => split(n)[kind === 'bases' ? 0 : 1] === name);

let changed = 0;
if (existsSync(join(dir, 'poses'))) for (const f of readdirSync(join(dir, 'poses')).filter((f) => f.endsWith('.json')))
  console.log(`pose ${f.slice(0, -5)}: RETIRED pose save, not merged (put what it says on its base or gesture by hand)`);

for (const kind of ['bases', 'gestures']) {
  const d = join(dir, kind);
  if (!existsSync(d)) continue;
  for (const f of readdirSync(d).filter((f) => f.endsWith('.json')).sort()) {
    const name = f.slice(0, -5), doc = JSON.parse(readFileSync(join(d, f), 'utf8'));
    const tag = `${kind.slice(0, -1)} ${name}`, when = `(saved ${doc.savedAt || '?'})`;
    const notes = [];
    if (!/^[a-z]+$/.test(name)) notes.push('name is not one lower-case word');
    const it = doc[FIELD[kind]];
    for (const t of it?.use || []) if (!D.tags[t]) notes.push(`unknown tag ${t}`);
    if (it && !it.desc) notes.push('no desc');
    const old = D[kind][name];
    const item = doc[FIELD[kind]];
    if (!item) { console.log(`${tag}: skip, no ${FIELD[kind]}`); continue; }
    const cs = old ? changes(old, item) : [];
    console.log(`${tag}: ${!old ? 'NEW' : cs.length ? 'changed' : 'same'} ${when}`);
    for (const c of cs) console.log(`  ${c}`);
    if (cs.length || !old) {
      const u = users(kind, name);
      console.log(`  reaches ${u.length} pose${u.length === 1 ? '' : 's'} in panels${u.length ? ': ' + u.join(', ') : ''}`);
      changed++;
      if (write) files[kind][kind][name] = item;
    }
    for (const n of notes) console.log(`  ! ${n}`);
  }
}

if (write && changed) {
  const sorted = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
  files.bases.bases = sorted(files.bases.bases);
  files.gestures.gestures = sorted(files.gestures.gestures);
  for (const k of ['bases', 'gestures']) writeOut(`data/${k}.json`, JSON.stringify(files[k], null, 2) + '\n');
  console.log(`written: ${changed} change(s) to data/bases.json, gestures.json`);
} else if (write) console.log('nothing to write');
