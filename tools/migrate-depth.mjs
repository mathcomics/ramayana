// "row" → "depth" (docs/proposals/2026-11-20-readable-panels.md, 2): rewrite
// panels so they draw exactly as before with the new fields.
//
//   node tools/migrate-depth.mjs [--dry]     every panel in panels/, and panels/icons.json
//
// Per entry:
//   a named row             → the same name in "depth"
//   a number, top view      → "depth" the same number; the panel gets "camera": "top"
//   a number on the ground  → "depth" row ÷ horizon (when that depth's size is
//                             within 0.5–1.5 of the entry's own)
//   any other number        → lifted: no depth (front) and the "nudge" up that
//                             keeps it where it was
//   on a foreground         → its "scale" becomes its "depth" (1 − 0.92 × scale)
//   "on" a prop or figure   → "row" dropped (it did nothing)
// then every entry's "scale" is set so its size is what it was (a figure on a
// prop takes the prop's new depth), and each panel is drawn both ways and
// compared: every entry within 0.25 px and 0.1 % of its old place and size.
// convertDef is also used by tools/merge-panel-drafts.mjs for old lab drafts.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { root, loadAssets, loadSections } from './lib.mjs';
import { renderPanel, DEPTH, HORIZON, MAX_DEPTH } from '../src/scene.js';

const r4 = (v) => Math.round(v * 1e4) / 1e4, r3 = (v) => Math.round(v * 1e3) / 1e3;
export const usesRow = (def) => (def.figures || []).some((e) => e && e.row != null);
const isTopView = (def) => (def.tags || []).includes('topview') || (def.figures || []).some((e) => /-top(-|$)/.test(e?.prop || ''));

// the panel's entries matched to the layout (repeat copies left out)
function layoutByEntry(def, layout) {
  const own = layout.filter((l) => !l.copy);
  const list = (def.figures || []).filter((e) => e && (e.foreground != null || e.prop || e.character || e.who));
  if (own.length !== list.length) throw new Error(`layout has ${own.length} entries, the panel ${list.length}`);
  return new Map(list.map((e, i) => [e, own[i]]));
}

// a new entry with `changes` applied, keeping the key order ("depth" where
// "row" was; new keys at the end); a value undefined deletes the key
function rekey(e, changes) {
  const out = {};
  for (const k of Object.keys(e)) {
    if (k === 'row') { if (changes.depth !== undefined) out.depth = changes.depth; continue; }
    if (k in changes) { if (changes[k] !== undefined) out[k] = changes[k]; continue; }
    out[k] = e[k];
  }
  for (const [k, v] of Object.entries(changes)) if (!(k in out) && v !== undefined && !(k in e && k !== 'row')) out[k] = v;
  return out;
}

// convertDef(def, assets) → { def, changed: [index…], camera, counts, worst }
export function convertDef(def, assets) {
  const old = renderPanel(def, assets, { id: 'old' });
  const H = old.h, hz = def.horizon ?? HORIZON, top = isTopView(def);
  const byEntry = layoutByEntry(def, old.layout);
  const bands = new Set((def.figures || []).filter((e) => e?.foreground != null).map((e) => e.id || 'foreground'));
  const onBand = (e) => e.on != null && bands.has(String(e.on).split('#')[0]);
  const unitAt = (t) => 0.75 * (1 - t) * H / 6.1;
  const counts = { named: 0, top: 0, ground: 0, lifted: 0, band: 0, on: 0 };
  let camera = false;
  const step1 = (def.figures || []).map((e) => {
    if (!e || e.foreground != null) return e;
    const l = byEntry.get(e);
    if (onBand(e)) {
      const c = {};
      if (e.row != null) c.depth = undefined;              // flagged before: did nothing
      if (e.scale != null && e.depth == null) { c.depth = r4(1 - (1 - DEPTH.front) * e.scale); c.scale = undefined; counts.band++; }
      return Object.keys(c).length || e.row != null ? rekey(e, c) : e;
    }
    if (e.row == null) return e;
    if (e.on != null) { counts.on++; return rekey(e, { depth: undefined }); }
    if (typeof e.row === 'string') { counts.named++; return rekey(e, { depth: e.row }); }
    const r = e.row;
    if (top) { counts.top++; camera = true; return rekey(e, { depth: r }); }
    const t = r / hz, ratio = t < MAX_DEPTH ? l.unit / unitAt(t) : Infinity;
    if (t < MAX_DEPTH && ratio >= 0.5 && ratio <= 1.5) { counts.ground++; return rekey(e, { depth: r4(t) }); }
    // lifted (or sunk): front, nudged to where it was
    counts.lifted++;
    const n0 = e.nudge ?? 0, [dx, dy] = typeof n0 === 'number' ? [n0, 0] : n0;
    const ny = r3(dy + (H * (r - DEPTH.front * hz)) / l.unit);
    return rekey(e, { depth: undefined, nudge: ny ? [dx, ny] : dx || undefined });
  });
  const mid = { ...def, ...(camera ? { camera: 'top' } : {}), figures: step1 };
  // sizes: each entry's scale so its unit is what it was
  const now = renderPanel(mid, assets, { id: 'mid' });
  const byMid = layoutByEntry(mid, now.layout);
  const figures = step1.map((e, i) => {
    if (!e || e.foreground != null) return e;
    if (e.on && /#(face|inside)$/.test(e.on)) return e;     // sized by the anchor, not a depth
    const lo = byEntry.get(def.figures[i]), ln = byMid.get(e);
    const s = r4(lo.unit / ln.rowUnit);
    const want = Math.abs(s - 1) < 1e-4 ? undefined : s;
    if (want === e.scale) return e;
    return rekey(e, { scale: want });
  });
  const out = { ...mid, figures };
  // place the camera after the horizon / sky / ground
  if (camera) {
    const keys = Object.keys(def), at = ['horizon', 'sky', 'ground', 'tall', 'scene'].map((k) => keys.indexOf(k)).find((i) => i >= 0) ?? -1;
    const ordered = {};
    keys.forEach((k, i) => { ordered[k] = out[k]; if (i === at) ordered.camera = 'top'; });
    if (!('camera' in ordered)) ordered.camera = 'top';
    Object.assign(ordered, { figures });
    for (const k of Object.keys(out)) if (!(k in ordered)) ordered[k] = out[k];
    Object.keys(out).forEach((k) => delete out[k]); Object.assign(out, ordered);
  }
  // check: drawn both ways, every entry (copies too) in the same place and size
  const fin = renderPanel(out, assets, { id: 'new' });
  let worst = { px: 0, rel: 0 };
  if (fin.layout.length !== old.layout.length) throw new Error('the converted panel draws a different number of entries');
  fin.layout.forEach((a, k) => {
    const b = old.layout[k];
    if (a.kind === 'band') return;
    worst.px = Math.max(worst.px, Math.abs(a.x - b.x), Math.abs(a.groundY - b.groundY));
    worst.rel = Math.max(worst.rel, Math.abs(a.unit / b.unit - 1));
  });
  const changed = figures.map((e, i) => (e !== def.figures[i] ? i : -1)).filter((i) => i >= 0);
  return { def: out, changed, camera, counts, worst, issues: fin.issues.filter((m) => !/placeholder/.test(m)) };
}

// ---- writing: only the changed entries' text is replaced ---------------------
// the [start, end) of each object in the array after `"figures"` at or past `from`
function figureSpans(text, from = 0) {
  const fi = text.indexOf('"figures"', from), open = text.indexOf('[', fi);
  const spans = [];
  let depth = 0, str = false, start = -1;
  for (let i = open + 1; i < text.length; i++) {
    const c = text[i];
    if (str) { if (c === '\\') i++; else if (c === '"') str = false; continue; }
    if (c === '"') { str = true; continue; }
    if (c === '{' || c === '[') { if (depth === 0 && c === '{') start = i; depth++; }
    else if (c === '}' || c === ']') { if (depth === 0) break; depth--; if (depth === 0 && c === '}') spans.push([start, i + 1]); }
  }
  return spans;
}
const compact = (v) => (Array.isArray(v) ? `[${v.map(compact).join(', ')}]`
  : v && typeof v === 'object' ? `{ ${Object.entries(v).map(([k, x]) => `${JSON.stringify(k)}: ${compact(x)}`).join(', ')} }` : JSON.stringify(v));
function replaceEntries(text, from, entries, changed) {
  const spans = figureSpans(text, from);
  let out = text;
  for (const i of [...changed].sort((a, b) => b - a)) {
    const [s, e] = spans[i], old = text.slice(s, e);
    const lineStart = text.lastIndexOf('\n', s) + 1, indent = text.slice(lineStart, s).match(/^\s*/)[0];
    let fresh = old.includes('\n') ? JSON.stringify(entries[i], null, 2).replace(/\n/g, '\n' + indent) : compact(entries[i]);
    // arrays the old text wrote on one line ("nudge": [0, 2]) stay on one line
    if (old.includes('\n') && /\[[^\n\]]*\]/.test(old)) fresh = fresh.replace(/\[\s*([^[\]{}]*?)\s*\]/g, (m, a) => `[${a.split(/,\s*/).join(', ')}]`);
    out = out.slice(0, s) + fresh + out.slice(e);
  }
  return out;
}

// ---- the command --------------------------------------------------------------
if (process.argv[1] && process.argv[1].endsWith('migrate-depth.mjs')) {
  const dry = process.argv.includes('--dry');
  const assets = loadAssets();
  const total = { files: 0, entries: 0, named: 0, top: 0, ground: 0, lifted: 0, band: 0, on: 0 };
  let worst = { px: 0, rel: 0, at: '' };
  const residual = [];
  const report = (where, res) => {
    for (const k of Object.keys(res.counts)) total[k] += res.counts[k];
    total.entries += res.changed.length;
    if (res.worst.px > worst.px || res.worst.rel > worst.rel) worst = { ...res.worst, at: where };
    if (res.worst.px > 0.25 || res.worst.rel > 1e-3) console.log(`  ! ${where}: off by ${res.worst.px.toFixed(3)} px, ${(res.worst.rel * 100).toFixed(3)} %`);
    for (const m of res.issues) console.log(`  ! ${where}: ${m}`);
    res.changed.forEach((i) => { const s = res.def.figures[i].scale; if (s != null && res.def.figures[i].depth != null && typeof res.def.figures[i].depth === 'number' && Math.abs(s - 1) > 0.15) residual.push(`${where}:${res.def.figures[i].id || res.def.figures[i].character || res.def.figures[i].prop} depth ${res.def.figures[i].depth} scale ${s}`); });
  };
  for (const sec of loadSections()) for (const { id, def } of sec.panels) {
    if (!usesRow(def)) continue;
    const file = join(root, 'panels', sec.name, `${id}.json`);
    const res = convertDef(def, assets);
    report(id, res);
    if (!res.changed.length && !res.camera) continue;
    total.files++;
    let text = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    text = replaceEntries(text, 0, res.def.figures, res.changed);
    if (res.camera) text = text.replace(/\n(\s*)"(horizon|sky|ground)": ([^\n]*?),?\n/, (m, ind, k, v) => `\n${ind}"${k}": ${v},\n${ind}"camera": "top",\n`);
    if (JSON.stringify(JSON.parse(text)) !== JSON.stringify(res.def)) {
      // the text edit lost something (an unusual layout): write it whole
      text = JSON.stringify(res.def, null, 2).replace(/"tags": \[\s*([^\]]*?)\s*\]/, (m, a) => `"tags": [${a.split(/,\s*/).join(', ')}]`) + '\n';
    }
    if (!dry) writeFileSync(file, text);
  }
  // the site's index icons: a "panel" each, entries one per line
  const iconsFile = join(root, 'panels/icons.json');
  let icons = readFileSync(iconsFile, 'utf8').replace(/\r\n/g, '\n');
  const data = JSON.parse(icons);
  for (const [n, icon] of Object.entries(data.icons)) {
    if (!icon.panel || !usesRow(icon.panel)) continue;
    const res = convertDef(icon.panel, assets);
    report(`icon ${n}`, res);
    if (res.camera) throw new Error(`icon ${n}: a top view — convert it by hand`);
    const from = icons.indexOf(`"${n}": {`, icons.indexOf('"icons"'));
    icons = replaceEntries(icons, from, res.def.figures, res.changed);
    total.files += 0;
  }
  if (!dry) writeFileSync(iconsFile, icons);
  console.log(`${dry ? '(dry) ' : ''}${total.files} panel files, ${total.entries} entries: ${total.named} named, ${total.ground} on the ground, ${total.lifted} lifted, ${total.top} in top views, ${total.band} on a foreground, ${total.on} "on" (row dropped)`);
  console.log(`worst difference: ${worst.px.toFixed(3)} px, ${(worst.rel * 100).toFixed(4)} % (${worst.at || '-'})`);
  if (residual.length) console.log(`numeric depths keeping a scale off 1 by more than 15 % (${residual.length}), for the by-eye pass:\n  ${residual.join('\n  ')}`);
}
