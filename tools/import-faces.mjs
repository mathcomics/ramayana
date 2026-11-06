// Import the artist's face drawings.
//
//   node tools/import-faces.mjs [dir] [out.json]
//   (default: data/faces  ->  data/faces.json)
//
// Reads every <character-id>.svg in the directory: two top-level layers,
// "front" and "side", each holding the view's layers (the side layer's
// offset is ignored). The older <character-id>-<front|side>.svg files are
// still read. The drawing
// is never changed: each layer's elements are copied verbatim, together with
// the transforms of the groups that contain them. Only element ids and
// editor-only attributes are dropped, so several figures can share one SVG.
//
// Layers (by inkscape:label or id): head, back, hair-body, mouth-1,
// mouth-2, mouth-3, anchors (a circle labelled nape), guide (ignored). A
// file with no recognised layer is treated as all "head".

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { root, json } from './lib.mjs';
import { parse, serialize, label, esc, withoutDisplay } from './svg.mjs';

const dir = process.argv[2] || join(root, 'data/faces');
const outPath = process.argv[3] || join(root, 'data/faces.json');

const LAYERS = ['head', 'back', 'hair-body', 'mouth-1', 'mouth-2', 'mouth-3'];

// Find layers anywhere in the tree; keep the transforms of their ancestors.
function findLayers(node, chain, found) {
  for (const c of node.children || []) {
    if (!c.tag) continue;
    const name = c.tag === 'g' ? label(c) : '';
    if (name === 'guide' || name.startsWith('guide') || name === 'anchors') continue;
    if (LAYERS.includes(name)) { found[name] = { chain, node: c }; continue; }   // own transform added below
    findLayers(c, c.tag === 'g' || c.tag === 'svg' ? [...chain, c.attrs.transform].filter(Boolean) : chain, found);
  }
  return found;
}

// One view: `svg` is the file's <svg> (old two-file format) or the view's
// top-level layer (one file per character; its own transform is only the
// layout offset and is ignored).
function importView(svg, f) {
  let found = findLayers(svg, [], {});
  if (Object.keys(found).length) {
    // Anything drawn outside a named layer (a loose path, or a layer that lost
    // its name, e.g. g2146) belongs to the head, in document order.
    const named = (n) => LAYERS.includes(label(n)) || label(n).startsWith('guide') || label(n) === 'anchors';
    const hasLayer = (n) => named(n) || (n.children || []).some((c) => c.tag && hasLayer(c));
    const loose = (c) => c.tag && !/^(defs|metadata|sodipodi:|inkscape:|title|desc)/.test(c.tag) && !hasLayer(c);
    const headTop = found.head && svg.children.includes(found.head.node);
    if (svg.children.some(loose) && (headTop || !found.head)) {
      const kids = [];
      for (const c of svg.children) {
        if (loose(c)) kids.push(c);
        else if (headTop && c === found.head.node) {
          kids.push({ ...c, attrs: { ...c.attrs, style: withoutDisplay(c.attrs.style) } });
        }
      }
      found.head = { chain: [], node: { tag: 'g', attrs: {}, children: kids } };
    }
  }
  if (!Object.keys(found).length) {
    // no named layers: everything except the guide is the head
    const kids = svg.children.filter((c) => c.tag && c.tag !== 'defs' && !/^(sodipodi|metadata)/.test(c.tag) && label(c) !== 'guide' && label(c) !== 'anchors');
    found = { head: { chain: [], node: { tag: 'g', attrs: {}, children: kids } } };
  }
  const entry = {};
  const defs = svg.children.filter((c) => c.tag === 'defs').map((d) => d.children.map(serialize).join('')).join('');
  for (const [name, { chain, node }] of Object.entries(found)) {
    const inner = node.children.map(serialize).join('');
    if (!inner.trim()) continue;                         // empty layer
    const own = node.attrs.transform ? [node.attrs.transform] : [];
    // a layer hidden in the editor (display:none) is only an editing state: show it
    const style = withoutDisplay(node.attrs.style);
    const opacity = node.attrs.opacity;
    let g = `<g${[...chain, ...own].length ? ` transform="${[...chain, ...own].join(' ')}"` : ''}${style ? ` style="${esc(style)}"` : ''}${opacity ? ` opacity="${opacity}"` : ''}>${inner}</g>`;
    if (name.startsWith('mouth-')) (entry.mouth ||= {})[name.slice(6)] = g;
    else if (name === 'hair-body') entry.hairBody = g;
    else entry[name] = g;
  }
  // nape: where the body hair joins the body (a circle labelled "nape")
  const findNape = (n) => {
    for (const c of n.children || []) {
      if (!c.tag) continue;
      if (c.tag === 'circle' && /(^|-)nape$/.test(label(c))) return [+c.attrs.cx, +c.attrs.cy];
      const r = findNape(c); if (r) return r;
    }
    return null;
  };
  const nape = findNape(svg);
  if (entry.hairBody) {
    if (nape) entry.nape = nape.map((v) => Math.round(v * 1e4) / 1e4);
    else console.error(`  ! ${f}: hair-body layer but no nape anchor (using 0, 0.65)`);
  }
  if (defs.trim()) entry.defs = defs;
  return entry;
}

const faces = {};
const put = (id, view, entry, name) => {
  (faces[id.toLowerCase()] ||= {})[view] = entry;
  console.log(`${name} ${view}: ${Object.keys(entry).filter((k) => k !== 'defs' && k !== 'nape').map((k) => (k === 'mouth' ? `mouth(${Object.keys(entry.mouth)})` : k)).join(', ') || '(empty)'}`);
};
for (const f of readdirSync(dir).filter((x) => x.endsWith('.svg')).sort()) {
  const tree = parse(readFileSync(join(dir, f), 'utf8'));
  const svg = tree.children.find((c) => c.tag === 'svg');
  if (!svg) { console.error(`${f}: no <svg>`); continue; }
  const two = f.match(/^([\w-]+)-(front|side)\.svg$/i);
  const views = svg.children.filter((c) => c.tag === 'g' && ['front', 'side'].includes(label(c)));
  if (views.length) {                                    // <id>.svg: front and side layers
    const id = f.replace(/\.svg$/, '');
    for (const v of views) put(id, label(v), importView(v, `${f} (${label(v)})`), f);
  } else if (two) put(two[1], two[2].toLowerCase(), importView(svg, f), f);   // older: <id>-<view>.svg
  else console.error(`${f}: no "front" / "side" layers`);
}
writeFileSync(outPath, JSON.stringify({
  _doc: 'Generated by tools/import-faces.mjs from data/faces/*.svg. Do not edit; edit the SVGs. Coordinates: head-units, head centre at (0,0). Colours are used exactly as drawn.',
  faces,
}, null, 1));
console.log(`${outPath}: ${Object.keys(faces).length} character(s)`);
// Every character must have a drawn face in both views (no generated fallback).
const cast = json('data/characters.json').characters.map((c) => c.id);
for (const id of cast) for (const v of ['front', 'side'])
  if (!faces[id]?.[v]?.head) { console.error(`  ! ${id}: no ${v} face (draw the ${v} layer of data/faces/${id}.svg)`); process.exitCode = 1; }
for (const id of Object.keys(faces)) if (!cast.includes(id)) console.error(`  ! ${id}: face for a character not in data/characters.json`);
