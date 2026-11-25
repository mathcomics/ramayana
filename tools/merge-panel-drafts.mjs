// Merge panel-lab drafts into panels/ (the commit-panel-lab skill).
//
//   node tools/merge-panel-drafts.mjs <dir> [--dry]
//
// <dir> holds the drafts as JSON files, one per draft, as the lab stores
// them: { id, panel, section, savedAt } (ArtifactData list with out_dir
// writes <out_dir>/panels/<doc>.json; pass that panels folder).
// For each draft it prints: same (nothing to merge), changed (the repo
// file rewritten), new (a new file: an inserted panel) or skip (with
// why). The repo file's key order is kept, so a diff shows only what the
// artist changed; `tags` is carried over (the lab drops it, and the
// tagged reference panels are locked: docs/design/panels.md). A draft
// still using the retired `row` is converted to `depth` first, drawing
// exactly as it did (tools/migrate-depth.mjs); a prop's retired `body`
// becomes `color`.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { root, loadAssets } from './lib.mjs';
import { convertDef, usesRow } from './migrate-depth.mjs';

const [dir, flag] = process.argv.slice(2);
if (!dir) { console.error('usage: node tools/merge-panel-drafts.mjs <dir of draft JSON> [--dry]'); process.exit(1); }
const dry = flag === '--dry';

const TOP = ['scene', 'tall', 'ground', 'sky', 'horizon', 'camera', 'mode', 'figures', 'needs', 'tags'];
const FIG = ['id', 'character', 'show', 'prop', 'foreground', 'color', 'pose', 'view', 'facing', 'at', 'depth', 'on', 'nudge', 'scale', 'mouth', 'cloth', 'turn', 'hands', 'adjust'];
const sortBy = (order) => (a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99);
const sortKeys = (o, order) => Object.fromEntries(Object.keys(o).sort(sortBy(order)).map((k) => [k, o[k]]));
const canon = (x) => Array.isArray(x) ? x.map(canon)
  : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, canon(x[k])])) : x;
const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));

// figures match by id, else by what they are, else by position
const kind = (g) => (g?.prop ? 'prop' : g?.foreground != null ? 'foreground' : 'figure');
const key = (g) => g && (g.id || (g.character ? `${g.character}|${g.cloth || ''}|${g.pose}` : g.foreground != null ? 'foreground' : g.prop));
// the new value laid out in the old one's key order; new keys after
function keepOrder(n, o) {
  if (Array.isArray(n)) {
    if (!Array.isArray(o)) return n;
    const used = new Set();
    return n.map((x, i) => {
      let j = o.findIndex((y, k) => !used.has(k) && key(y) && key(y) === key(x));
      if (j < 0 && !used.has(i) && o[i] && typeof o[i] === 'object' && kind(o[i]) === kind(x)) j = i;
      if (j < 0) return x && typeof x === 'object' && !Array.isArray(x) && (x.character || x.prop || x.foreground != null) ? sortKeys(x, FIG) : x;
      used.add(j); return keepOrder(x, o[j]);
    });
  }
  if (n && typeof n === 'object' && o && typeof o === 'object') {
    const r = {};
    for (const k of Object.keys(o)) if (k in n) r[k] = keepOrder(n[k], o[k]);
    for (const k of Object.keys(n)) if (!(k in r)) r[k] = n[k];
    return r;
  }
  return n;
}
// short arrays of plain strings on one line, as the panels write `tags`
const write = (f, o) => writeFileSync(f, JSON.stringify(o, null, 2)
  .replace(/"tags": \[\s*([^\]]*?)\s*\]/, (m, a) => `"tags": [${a.split(/,\s*/).join(', ')}]`) + '\n');

let assets;
const panelsDir = join(root, 'panels');
const sections = readdirSync(panelsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
for (const f of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
  const d = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const tag = `${d.id || f}`.padEnd(8);
  if (!d.id || !d.panel) { console.log(`${tag} skip: not a draft (no id or panel)`); continue; }
  const section = d.section && sections.includes(d.section) ? d.section
    : sections.find((s) => existsSync(join(panelsDir, s, d.id + '.json'))) || sections.find((s) => s.startsWith(d.id.split('.')[0] + '-'));
  if (!section) { console.log(`${tag} skip: no section for it`); continue; }
  const file = join(panelsDir, section, d.id + '.json');
  let panel = { ...d.panel }; delete panel.id;
  let converted = '';
  if (usesRow(panel)) {
    const res = convertDef(panel, assets ??= loadAssets());
    panel = res.def;
    converted = `  (row → depth: ${res.changed.length} entries${res.worst.px > 0.25 ? `, ! off by ${res.worst.px.toFixed(2)} px` : ''})`;
  }
  const usesBody = (g) => g?.prop && g.body != null;
  if (panel.figures?.some(usesBody)) {
    panel.figures = panel.figures.map((g) => (!usesBody(g) ? g
      : Object.fromEntries(Object.entries(g).filter(([k]) => k !== 'color').map(([k, v]) => [k === 'body' ? 'color' : k, v]))));
    converted += '  (body → color)';
  }
  const old = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
  if (old?.tags && !panel.tags) panel.tags = old.tags;
  const retired = ['size', 'shot', 'zoom', 'props'].filter((k) => k in panel);
  const warn = retired.length ? `  (retired fields: ${retired.join(', ')} - fix before committing: docs/design/panels.md)` : '';
  if (old && same(panel, old)) { console.log(`${tag} same${warn}${converted}`); continue; }
  const out = old ? keepOrder(panel, old) : sortKeys({ ...panel, figures: (panel.figures || []).map((g) => sortKeys(g, FIG)) }, TOP);
  if (!dry) write(file, out);
  console.log(`${tag} ${old ? 'changed' : 'new'}  panels/${section}/${d.id}.json${old?.tags ? '  [locked reference panel]' : ''}${warn}${converted}`);
}
