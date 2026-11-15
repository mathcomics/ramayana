// Reading the face SVGs (base faces and character faces) and composing
// them into the faces the renderer draws (composeFaces): used by
// tools/lib.mjs (loadFaces), tools/check-faces.mjs and tools/face-templates.mjs.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
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
function readView(v, where, warn) {
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
  if (loose.length) warn(`${where}: ${loose.length} element(s) outside a layer, put in "over"`);
  const layers = {};
  for (const [name, { chain: chain0, node }] of Object.entries(found)) {
    const inner = node.children.filter(drawn).map((c) => serialize(shown(c))).join('');
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
  return { ...n, attrs, children: (n.children || []).filter(drawn).map(shown) };
};
// A placed picture (<image>) is a reference to draw over, never part of
// the drawing: dropped on import.
const drawn = (n) => n.tag !== 'image';
const contains = (a, b) => a === b || (a.children || []).some((c) => c.tag && contains(c, b));
// warn: where problems in the drawing are reported (default: printed)
export function readFile(file, warn = (m) => console.error(`  ! ${m}`)) {
  const svg = parse(readFileSync(file, 'utf8')).children.find((c) => c.tag === 'svg');
  if (!svg) throw new Error(`${file}: no <svg>`);
  const out = {};
  for (const v of svg.children.filter((c) => c.tag === 'g' && VIEWS.includes(label(c)))) out[label(v)] = readView(v, `${file} (${label(v)})`, warn);
  return out;
}
// the base's skin is painted with the character's body colour
export const paintSkin = (g) => recolorFills(g, 'currentColor');
// every fill in markup (style or attribute; not "none") set to one colour
export const recolorFills = (g, c) => g.replace(/fill\s*:\s*(?!none)[^;"]+/g, `fill:${c}`).replace(/fill="(?!none)[^"]*"/g, `fill="${c}"`);

// ---- composing the faces (data/faces/README.md)
// Views (top-level layers; docs/proposals/2026-11-12-head-rendering-survey.md):
// front, side, and the optional quarter (30°, looking right), back-view
// (180°), front-down (40° down), top (90° down) and front-up.
// <dir>/base/<species>.svg: per view skin, eyes, mouth-1/2/3, anchors
// (top, chin).
// <dir>/<id>.svg: per view back, hair-body, under, over, optional eyes
// and mouth-1/2/3 (replace the base's), anchors (nape). A view the base has
// no face drawing for is the whole head as drawn in the character's file,
// with the base's mouths for that view (quarter, front-down) unless it has
// its own.
// Layer offsets (the top-level layers' own transforms) are ignored; a moved
// guide moves the origin with it. The drawings are copied unchanged (with
// the transforms of their groups); only the base's skin is painted
// currentColor, so the renderer fills it with the character's body colour.
//
// For each character and view:
//   head  = under, skin, eyes, over
//   mouth = { 1, 2, 3 }                     (drawn over the head)
//   back, hairBody, nape, defs
//   front-up / front-down: when the base draws that version and the
//     character does not, the character's front under / over moved and
//     stretched so that the base's top and chin anchors land on that
//     version's.
//   A sideOnly character (data/characters.json) gets the side view only.
//
// Coordinates: head-units, head centre at (0, 0). Returns { faces: { <id>:
// { <view>: entry } }, bases: { <species>: [views with a skin] }, errors,
// warnings }; errors are what leaves a character without a face (no file,
// no base, no front / side layer), warnings what the artist should fix.
export function composeFaces(dir, cast) {
  const errors = [], warnings = [];
  const warn = (m) => warnings.push(m);
  const bases = {}, baseViews = {};
  for (const f of readdirSync(join(dir, 'base')).filter((x) => x.endsWith('.svg'))) {
    const species = f.replace(/\.svg$/, '');
    const B = readFile(join(dir, 'base', f), warn);
    for (const v of ['front', 'side']) if (!B[v]?.layers.skin) warn(`base ${species}: no ${v} skin`);
    bases[species] = B;
    baseViews[species] = Object.entries(B).filter(([, x]) => x.layers.skin).map(([k]) => k);
  }
  const faces = {};
  const compose = (bv, L, own) => {
    const BL = bv.layers;
    const head = (L.under || '') + (BL.skin ? paintSkin(BL.skin) : '') + (own.eyes ?? BL.eyes ?? '') + (L.over || '');
    const mouth = {};
    for (const k of ['1', '2', '3']) { const m = own[`mouth-${k}`] ?? BL[`mouth-${k}`]; if (m) mouth[k] = m; }
    return { head, mouth };
  };
  for (const c of cast) {
    const file = join(dir, `${c.id}.svg`);
    if (!existsSync(file)) { errors.push(`${c.id}: no data/faces/${c.id}.svg`); continue; }
    const B = bases[c.species];
    if (!B) { errors.push(`${c.id}: no base face for ${c.species}`); continue; }
    const X = readFile(file, warn);
    for (const view of c.sideOnly ? ['side'] : ['front', 'side']) if (!X[view]) errors.push(`${c.id}: no ${view} layer`);
    for (const view of c.sideOnly ? ['side'] : VIEWS) {
      const x = X[view];
      let e;
      if (x) {
        const own = { eyes: x.layers.eyes, 'mouth-1': x.layers['mouth-1'], 'mouth-2': x.layers['mouth-2'], 'mouth-3': x.layers['mouth-3'] };
        // on the base's drawing of this view, or (no base face drawn there)
        // the whole head as drawn in the character's file, with the base's
        // eyes / mouths for this view where the base has them (the base's
        // quarter and front-down hold only mouths)
        e = compose(B[view] || { layers: {} }, x.layers, own);
        if (x.layers.back) e.back = x.layers.back;
        if (x.layers['hair-body']) {
          e.hairBody = x.layers['hair-body'];
          if (x.anchors.nape) e.nape = x.anchors.nape;
          else warn(`${c.id} ${view}: hair-body layer but no nape anchor (using 0, 0.65)`);
        }
        const defs = (B[view]?.defs || '') + (x.defs || '');
        if (!B[view]?.layers.skin && !Object.keys(e.mouth).length && ['quarter', 'front-down'].includes(view)) warn(`${c.id} ${view}: no mouths (the base's ${view} view or the character's own)`);
        if (defs.trim()) e.defs = defs;
      } else if ((view === 'front-up' || view === 'front-down') && B[view]?.layers.skin && X.front) {
        // the base draws the raised / lowered head and the character does not:
        // its front layers (and anything the version lacks: eyes, mouths)
        // follow the anchors, moved and stretched so that the level face's top
        // and chin land on this version's
        const bv = B[view], xf = X.front;
        const a0 = B.front.anchors, a1 = bv.anchors;
        if (!a0.top || !a0.chin || !a1.top || !a1.chin) { warn(`base ${c.species} ${view}: needs top and chin anchors`); continue; }
        const sc = (a1.chin[1] - a1.top[1]) / (a0.chin[1] - a0.top[1]);
        const t = `matrix(1 0 0 ${r4(sc)} ${r4(a1.top[0] - a0.top[0])} ${r4(a1.top[1] - a0.top[1] * sc)})`;
        const follow = (g) => g && `<g transform="${t}">${g}</g>`;
        const pick = (k) => (xf.layers[k] ? follow(xf.layers[k]) : bv.layers[k] ? undefined : follow(B.front.layers[k]));
        e = compose(bv, { under: follow(xf.layers.under), over: follow(xf.layers.over) }, { eyes: pick('eyes'), 'mouth-1': pick('mouth-1'), 'mouth-2': pick('mouth-2'), 'mouth-3': pick('mouth-3') });
        if (xf.layers.back) e.back = follow(xf.layers.back);
      } else continue;
      (faces[c.id] ||= {})[view] = e;
    }
  }
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.svg')))
    if (!cast.some((c) => `${c.id}.svg` === f)) warn(`${f}: face for a character not in data/characters.json`);
  return { faces, bases: baseViews, errors, warnings };
}


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
