// Import the artist's face drawings.
//
//   node tools/import-faces.mjs [dir] [out.json]
//   (default: data/faces  ->  data/faces.json)
//
// Reads every <character-id>-<front|side>.svg in the directory. The drawing
// is never changed: each layer's elements are copied verbatim, together with
// the transforms of the groups that contain them. Only element ids and
// editor-only attributes are dropped, so several figures can share one SVG.
//
// Layers (by inkscape:label or id): head, back, mouth-1, mouth-2, mouth-3,
// guide (ignored). A file with no recognised layer is treated as all "head".

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = process.argv[2] || join(root, 'data/faces');
const outPath = process.argv[3] || join(root, 'data/faces.json');

// ---- a minimal XML tree (enough for SVG written by drawing apps) ---------
function parse(src) {
  const rootNode = { tag: '#root', attrs: {}, children: [] };
  const stack = [rootNode];
  const re = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|<!DOCTYPE[\s\S]*?>|<\/([\w:.-]+)\s*>|<([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(src))) {
    const top = stack[stack.length - 1];
    if (m[1]) { stack.pop(); continue; }
    if (m[2]) {
      const attrs = {};
      for (const a of m[3].matchAll(/([\w:.-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) attrs[a[1]] = a[3] ?? a[4];
      const node = { tag: m[2], attrs, children: [] };
      top.children.push(node);
      if (!m[4]) stack.push(node);
      continue;
    }
    if (m[5] && m[5].trim()) top.children.push({ text: m[5] });
  }
  return rootNode;
}
const esc = (s) => String(s).replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);)/gi, '&amp;').replace(/"/g, '&quot;');
const SKIP_ATTR = /^(id|inkscape:.*|sodipodi:.*|xml:space)$/;
function serialize(n) {
  if (n.text != null) return n.text;
  if (/^(sodipodi:|inkscape:|metadata$|title$|desc$)/.test(n.tag)) return '';
  const attrs = Object.entries(n.attrs).filter(([k]) => !SKIP_ATTR.test(k)).map(([k, v]) => ` ${k}="${esc(v)}"`).join('');
  const inner = n.children.map(serialize).join('');
  return inner ? `<${n.tag}${attrs}>${inner}</${n.tag}>` : `<${n.tag}${attrs}/>`;
}
const label = (n) => (n.attrs['inkscape:label'] || n.attrs.id || '').trim().toLowerCase();
const LAYERS = ['head', 'back', 'mouth-1', 'mouth-2', 'mouth-3'];

// Find layers anywhere in the tree; keep the transforms of their ancestors.
function findLayers(node, chain, found) {
  for (const c of node.children || []) {
    if (!c.tag) continue;
    const name = c.tag === 'g' ? label(c) : '';
    if (name === 'guide' || name.startsWith('guide')) continue;
    if (LAYERS.includes(name)) { found[name] = { chain: [...chain, c.attrs.transform].filter(Boolean), node: c }; continue; }
    findLayers(c, c.tag === 'g' || c.tag === 'svg' ? [...chain, c.attrs.transform].filter(Boolean) : chain, found);
  }
  return found;
}

const faces = {};
const files = readdirSync(dir).filter((f) => /^[\w-]+-(front|side)\.svg$/i.test(f));
for (const f of files) {
  const [, id, view] = f.match(/^([\w-]+)-(front|side)\.svg$/i);
  const tree = parse(readFileSync(join(dir, f), 'utf8'));
  const svg = tree.children.find((c) => c.tag === 'svg');
  if (!svg) { console.error(`${f}: no <svg>`); continue; }
  let found = findLayers(svg, [], {});
  if (Object.keys(found).length && !found.head) {
    // head layer lost its name (e.g. renamed to g2146): the remaining
    // top-level groups (not guide, not a named layer) are the head
    const named = (n) => LAYERS.includes(label(n)) || label(n).startsWith('guide');
    const hasLayer = (n) => named(n) || (n.children || []).some((c) => c.tag && hasLayer(c));
    const kids = svg.children.filter((c) => c.tag === 'g' && !hasLayer(c));
    if (kids.length) found.head = { chain: [], node: { tag: 'g', attrs: {}, children: kids } };
  }
  if (!Object.keys(found).length) {
    // no named layers: everything except the guide is the head
    const kids = svg.children.filter((c) => c.tag && c.tag !== 'defs' && !/^(sodipodi|metadata)/.test(c.tag) && label(c) !== 'guide');
    found = { head: { chain: [], node: { tag: 'g', attrs: {}, children: kids } } };
  }
  const entry = {};
  const defs = svg.children.filter((c) => c.tag === 'defs').map((d) => d.children.map(serialize).join('')).join('');
  for (const [name, { chain, node }] of Object.entries(found)) {
    const inner = node.children.map(serialize).join('');
    if (!inner.trim()) continue;                         // empty layer
    const own = node.attrs.transform ? [node.attrs.transform] : [];
    const style = node.attrs.style || '', opacity = node.attrs.opacity;
    let g = `<g${[...chain, ...own].length ? ` transform="${[...chain, ...own].join(' ')}"` : ''}${style ? ` style="${esc(style)}"` : ''}${opacity ? ` opacity="${opacity}"` : ''}>${inner}</g>`;
    if (name.startsWith('mouth-')) (entry.mouth ||= {})[name.slice(6)] = g;
    else entry[name] = g;
  }
  if (defs.trim()) entry.defs = defs;
  (faces[id.toLowerCase()] ||= {})[view.toLowerCase()] = entry;
  console.log(`${f}: ${Object.keys(entry).filter((k) => k !== 'defs').map((k) => (k === 'mouth' ? `mouth(${Object.keys(entry.mouth)})` : k)).join(', ') || '(empty)'}`);
}
writeFileSync(outPath, JSON.stringify({
  _doc: 'Generated by tools/import-faces.mjs from data/faces/*.svg. Do not edit; edit the SVGs. Coordinates: head-units, head centre at (0,0). Colours are used exactly as drawn.',
  faces,
}, null, 1));
console.log(`${outPath}: ${Object.keys(faces).length} character(s)`);
