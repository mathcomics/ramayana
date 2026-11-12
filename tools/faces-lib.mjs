// Reading the face SVGs (base faces and character faces): shared by
// tools/import-faces.mjs and tools/face-templates.mjs.
import { readFileSync } from 'node:fs';
import { parse, serialize, label, esc, withoutDisplay } from './svg.mjs';
import { r4 } from './svg-geom.mjs';

const LAYERS = ['skin', 'eyes', 'mouth-1', 'mouth-2', 'mouth-3', 'under', 'over', 'head', 'back', 'hair-body'];
// views of a face (docs/proposals/2026-11-12-head-rendering-survey.md): front,
// side, front-down (head lowered 40°), quarter (turned 30°, looking right),
// back-view (180°), top (head lowered 90°: the top of the head); front-up
// is read when drawn but not one of the intended views
export const VIEWS = ['front', 'side', 'front-up', 'front-down', 'quarter', 'back-view', 'top'];
// where each view's layer sits in a character file (x offset, head-units;
// ignored on import): front and side as always, the others in a row after
// them, and the page wide enough to show them all
export const VIEW_X = { front: 0, side: 3, quarter: 5, 'back-view': 6.6, 'front-down': 8.2, top: 9.8 };
export const PAGE_ALL_VIEWS = { viewBox: '-1.5 -1.2 12.5 5', width: '2500', height: '1000' };
// a base face file: front, side, quarter, back-view, top in the first row,
// front-up / front-down in the second (y 4)
export const BASE_X = { front: 0, side: 3, quarter: 5, 'back-view': 6.6, top: 8.2 };
export const PAGE_BASE = { viewBox: '-1.5 -1.2 10.4 9', width: '2080', height: '1800' };

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
export const paintSkin = (g) => recolorFills(g, 'currentColor');
// every fill in markup (style or attribute; not "none") set to one colour
export const recolorFills = (g, c) => g.replace(/fill\s*:\s*(?!none)[^;"]+/g, `fill:${c}`).replace(/fill="(?!none)[^"]*"/g, `fill="${c}"`);


// ---- writing a parsed SVG back (pretty-printed; for refreshing guides)
const xesc = (s) => esc(s).replace(/</g, '&lt;');
export function writeNode(n, depth = 0) {
  if (n.text != null) return n.text;
  const pad = '  '.repeat(depth);
  const attrs = Object.entries(n.attrs).map(([k, v]) => ` ${k}="${xesc(v)}"`).join('');
  if (!n.children.length) return `${pad}<${n.tag}${attrs}/>\n`;
  if (n.children.every((c) => c.text != null)) return `${pad}<${n.tag}${attrs}>${n.children.map((c) => c.text).join('')}</${n.tag}>\n`;
  return `${pad}<${n.tag}${attrs}>\n${n.children.map((c) => writeNode(c, depth + 1)).join('')}${pad}</${n.tag}>\n`;
}
// a locked guide layer (ignored on import)
const guideLayer = (name, opacity, children = []) =>
  ({ tag: 'g', attrs: { 'inkscape:groupmode': 'layer', 'inkscape:label': name, 'sodipodi:insensitive': 'true', opacity }, children });
// Replace the guide layer's drawing in every view of a face file (src text);
// guides: { view: markup }. Everything else is kept, except: offsets
// ({ view: x }) moves those views' layers, page ({ viewBox, width, height })
// resizes the page, top ({ view: markup }) sets a second guide on top of the
// view's drawing (layer `guide-mouth`; ignored on import like any guide).
export function replaceGuides(src, guides, { offsets = null, page = null, top = null } = {}) {
  const comment = (src.match(/^(?:<\?xml[^>]*\?>\s*)?(<!--[\s\S]*?-->)/) || [])[1] || '';
  const tree = parse(src);
  const svg = tree.children.find((c) => c.tag === 'svg');
  for (const v of svg.children.filter((c) => c.tag === 'g' && guides[label(c)] != null)) {
    let g = v.children.find((c) => c.tag === 'g' && label(c).startsWith('guide'));
    if (!g) { g = guideLayer('guide', '0.7'); v.children.unshift(g); }
    g.children = parse(`<g>${guides[label(v)]}</g>`).children[0].children;
  }
  if (offsets) for (const v of svg.children.filter((c) => c.tag === 'g' && offsets[label(c)] != null)) {
    const x = offsets[label(v)];
    if (x) v.attrs.transform = `translate(${x} 0)`; else delete v.attrs.transform;
  }
  if (page) Object.assign(svg.attrs, page);
  if (top) for (const v of svg.children.filter((c) => c.tag === 'g' && top[label(c)] != null)) {
    v.children = v.children.filter((c) => !(c.tag === 'g' && label(c) === 'guide-mouth'));
    v.children.push(guideLayer('guide-mouth', '0.5', parse(`<g>${top[label(v)]}</g>`).children[0].children));
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${comment ? `${comment}\n` : ''}${writeNode(svg)}`;
}
