// Renumber one chapter's panels to plain consecutive ids, once the
// chapter is settled (docs/design/panels.md, Ids): inserted panels carry
// letter ids (05.01a) so nothing moves while the chapter is being drawn.
//
//   node tools/renumber-panels.mjs 05 --dry   # print the mapping only
//   node tools/renumber-panels.mjs 05         # rename and rewrite references
//
// Renames the panel files (and a background <id>.svg) with git mv, and
// rewrites every mention of a moved id in the live docs and data (not in
// docs/proposals, which keep the ids of their day). Afterwards: regenerate
// the issue lists, render and look, accept the snapshot, rebuild the lab.
// Panel-lab drafts are stored by id: merge or delete the chapter's drafts
// first, or they land on the wrong panel.
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { root } from './lib.mjs';

const [chapter, flag] = process.argv.slice(2);
if (!/^\d{2}$/.test(chapter || '')) { console.error('usage: node tools/renumber-panels.mjs <chapter, e.g. 05> [--dry]'); process.exit(1); }
const dry = flag === '--dry';

const dirName = readdirSync(join(root, 'panels')).find((d) => d.startsWith(chapter + '-'));
if (!dirName) { console.error(`no panels/${chapter}-* folder`); process.exit(1); }
const dir = join(root, 'panels', dirName);
const ids = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5))
  .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
const width = Math.max(2, String(ids.length).length);
const map = new Map();
ids.forEach((id, i) => { const to = `${chapter}.${String(i + 1).padStart(width, '0')}`; if (to !== id) map.set(id, to); });
if (!map.size) { console.log(`${dirName}: already numbered 1..${ids.length}`); process.exit(0); }
for (const [a, b] of map) console.log(`${a} -> ${b}`);
if (dry) process.exit(0);

// 1. rename, through temporary names so no rename lands on a file still to move
const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'inherit' });
const files = (id) => ['.json', '.svg'].map((e) => id + e).filter((f) => existsSync(join(dir, f)));
for (const id of map.keys()) for (const f of files(id)) git('mv', join(dir, f), join(dir, '~' + f));
for (const [a, b] of map) for (const f of files('~' + a)) git('mv', join(dir, f), join(dir, f.replace('~' + a, b)));

// 2. references: an id not followed by more of an id (05.1 must not match 05.10)
const re = new RegExp(`(^|[^0-9.])(${chapter}\\.\\d+[a-z]*)(?![0-9a-z])`, 'g');
const skip = new Set(['node_modules', 'out', '_site', '.git', 'proposals']);
const walk = (d) => readdirSync(d).flatMap((n) => {
  const p = join(d, n);
  if (skip.has(n)) return [];
  return statSync(p).isDirectory() ? walk(p) : /\.(md|json)$/.test(n) && n !== 'render-snapshot.json' ? [p] : [];
});
for (const f of walk(root)) {
  const s = readFileSync(f, 'utf8');
  const t = s.replace(re, (m, pre, id) => pre + (map.get(id) || id));
  if (t !== s) { writeFileSync(f, t); console.log('updated', relative(root, f)); }
}
console.log(`\nNext: node tools/pose-gaps.mjs; node tools/prop-gaps.mjs; node tools/render-panels.mjs ${chapter};`
  + ' look; UPDATE_SNAPSHOT=1 npm test; node tools/build-panellab.mjs and republish.');
