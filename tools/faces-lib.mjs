// Reading the face SVGs (base faces and character faces): shared by
// tools/import-faces.mjs and tools/face-templates.mjs.
import { readFileSync } from 'node:fs';
import { parse, serialize, label, esc, withoutDisplay } from './svg.mjs';

const LAYERS = ['skin', 'eyes', 'mouth-1', 'mouth-2', 'mouth-3', 'under', 'over', 'head', 'back', 'hair-body'];
export const VIEWS = ['front', 'side', 'front-up', 'front-down'];
const r4 = (v) => Math.round(v * 1e4) / 1e4;

// Find the named layers anywhere in a view; keep the transforms of their ancestors.
function findLayers(node, chain, found) {
  for (const c of node.children || []) {
    if (!c.tag) continue;
    const name = c.tag === 'g' ? label(c) : '';
    if (name.startsWith('guide') || name === 'anchors') continue;
    if (LAYERS.includes(name)) { found[name] = { chain, node: c }; continue; }
    findLayers(c, c.tag === 'g' ? [...chain, c.attrs.transform].filter(Boolean) : chain, found);
  }
  return found;
}
function findCircles(node, out = {}) {
  for (const c of node.children || []) {
    if (!c.tag) continue;
    if (c.tag === 'circle' && label(c)) out[label(c).replace(/^.*-/, '')] = [+c.attrs.cx, +c.attrs.cy];
    findCircles(c, out);
  }
  return out;
}
// one view group -> { layers: {name: '<g…>'}, anchors: {name: [x, y]}, defs }
function readView(v, where) {
  // layers named only by id ("front-over"): drop the view prefix
  const pre = `${label(v)}-`;
  (function relabel(n) {
    for (const c of n.children || []) {
      if (!c.tag) continue;
      const id = (c.attrs.id || '').toLowerCase();
      if (!c.attrs['inkscape:label'] && id.startsWith(pre)) c.attrs['inkscape:label'] = id.slice(pre.length);
      relabel(c);
    }
  })(v);
  const guide = v.children.find((c) => c.tag === 'g' && label(c).startsWith('guide'));
  const gm = guide?.attrs.transform?.match(/^\s*translate\(\s*([-\d.e]+)[\s,]+([-\d.e]+)?\s*\)\s*$/);
  const off = gm ? [+gm[1], +(gm[2] || 0)] : [0, 0];
  const shift = off[0] || off[1] ? [`translate(${-off[0]},${-off[1]})`] : [];
  const found = findLayers(v, [], {});
  // loose drawing outside any named layer belongs to "over"
  const loose = v.children.filter((c) => c.tag && !/^(defs|metadata|sodipodi:|inkscape:|title|desc)/.test(c.tag)
    && !(c.tag === 'g' && (LAYERS.includes(label(c)) || label(c).startsWith('guide') || label(c) === 'anchors' || Object.values(found).some((f) => contains(c, f.node)))));
  if (loose.length) console.error(`  ! ${where}: ${loose.length} element(s) outside a layer, put in "over"`);
  const layers = {};
  for (const [name, { chain: chain0, node }] of Object.entries(found)) {
    const inner = node.children.map((c) => serialize(shown(c))).join('');
    if (!inner.trim()) continue;
    const t = [...shift, ...chain0, ...(node.attrs.transform ? [node.attrs.transform] : [])];
    const style = withoutDisplay(node.attrs.style);
    layers[name === 'head' ? 'over' : name] = `<g${t.length ? ` transform="${t.join(' ')}"` : ''}${style ? ` style="${esc(style)}"` : ''}${node.attrs.opacity ? ` opacity="${node.attrs.opacity}"` : ''}>${inner}</g>`;
  }
  if (loose.length) layers.over = (layers.over || '') + `<g${shift.length ? ` transform="${shift[0]}"` : ''}>${loose.map(serialize).join('')}</g>`;
  const anchorsG = v.children.find((c) => c.tag === 'g' && label(c) === 'anchors');
  const anchors = Object.fromEntries(Object.entries(anchorsG ? findCircles(anchorsG) : {}).map(([k, p]) => [k, [r4(p[0] - off[0]), r4(p[1] - off[1])]]));
  const defs = v.children.filter((c) => c.tag === 'defs').map((d) => d.children.map(serialize).join('')).join('');
  return { layers, anchors, defs };
}
// Hiding something in the editor (a layer or a single element) is only an
// editing state: it is still drawn.
const shown = (n) => {
  if (!n.tag) return n;
  const attrs = { ...n.attrs };
  delete attrs.display;
  if (attrs.style) attrs.style = withoutDisplay(attrs.style);
  return { ...n, attrs, children: (n.children || []).map(shown) };
};
const contains = (a, b) => a === b || (a.children || []).some((c) => c.tag && contains(c, b));
export function readFile(file) {
  const svg = parse(readFileSync(file, 'utf8')).children.find((c) => c.tag === 'svg');
  if (!svg) throw new Error(`${file}: no <svg>`);
  const out = {};
  for (const v of svg.children.filter((c) => c.tag === 'g' && VIEWS.includes(label(c)))) out[label(v)] = readView(v, `${file} (${label(v)})`);
  return out;
}
// the base's skin is painted with the character's body colour
export const paintSkin = (g) => g.replace(/fill\s*:\s*(?!none)[^;"]+/g, 'fill:currentColor').replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"');


// ---- writing a parsed SVG back (pretty-printed; for refreshing guides)
const xesc = (s) => String(s).replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);)/gi, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
export function writeNode(n, depth = 0) {
  if (n.text != null) return n.text;
  const pad = '  '.repeat(depth);
  const attrs = Object.entries(n.attrs).map(([k, v]) => ` ${k}="${xesc(v)}"`).join('');
  if (!n.children.length) return `${pad}<${n.tag}${attrs}/>\n`;
  if (n.children.every((c) => c.text != null)) return `${pad}<${n.tag}${attrs}>${n.children.map((c) => c.text).join('')}</${n.tag}>\n`;
  return `${pad}<${n.tag}${attrs}>\n${n.children.map((c) => writeNode(c, depth + 1)).join('')}${pad}</${n.tag}>\n`;
}
// Replace the guide layer's drawing in every view of a face file (src text);
// guides: { view: markup }. Everything else is kept.
export function replaceGuides(src, guides) {
  const comment = (src.match(/^(?:<\?xml[^>]*\?>\s*)?(<!--[\s\S]*?-->)/) || [])[1] || '';
  const tree = parse(src);
  const svg = tree.children.find((c) => c.tag === 'svg');
  for (const v of svg.children.filter((c) => c.tag === 'g' && guides[label(c)] != null)) {
    let g = v.children.find((c) => c.tag === 'g' && label(c).startsWith('guide'));
    if (!g) { g = { tag: 'g', attrs: { 'inkscape:groupmode': 'layer', 'inkscape:label': 'guide', 'sodipodi:insensitive': 'true', opacity: '0.7' }, children: [] }; v.children.unshift(g); }
    g.children = parse(`<g>${guides[label(v)]}</g>`).children[0].children;
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${comment ? `${comment}\n` : ''}${writeNode(svg)}`;
}
