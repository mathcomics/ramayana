// Generate the views a face has no drawing for, once, from its front and
// side drawings (the slice model, tools/head-loft.mjs), and write them into
// the face file as ordinary layers to keep or redraw
// (docs/proposals/2026-11-12-head-rendering-survey.md).
//
//   node tools/bake-views.mjs [id …]          characters: views the file lacks
//   node tools/bake-views.mjs --bases         base faces: the quarter and
//                                             front-down views (skin, eyes,
//                                             mouths, sliced), back-view (the
//                                             front's skin) and top (a circle)
//   --force                                   also re-generate views still
//                                             marked generated
//   --views quarter,front-down                only these views
//
// Character views: quarter (turned 30°, looking right), back-view (180°),
// front-down (40° down), top (90° down). Each is a top-level layer with an
// empty `generated` layer (the marker: delete it once the view is redrawn
// by hand, and the view is left alone from then on), then:
// - quarter, front-down (the base draws the face there): the character's own
//   parts only, by the layer they come from in its front drawing — back
//   (behind the body), under (behind the base face), over — plus its own
//   eyes / mouth-1/2/3 where it draws its own in the front view;
// - back-view, top (no base drawing): back and over, the whole head with
//   the skin.
// The skin is currentColor (the layer's colour is the character's body
// colour, so Inkscape shows it right). Eyes and mouths are not clipped to
// the face.
// Base views (--bases): quarter and front-down with skin (in the colour of
// the base's front skin; the importer paints it the character's body
// colour), eyes and mouth-1/2/3, to edit like the front and side.
// Run node tools/face-templates.mjs (guides) and tools/import-faces.mjs
// afterwards.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { root, json } from './lib.mjs';
import { readFile, paintSkin, writeNode, VIEW_X, PAGE_ALL_VIEWS, BASE_X, PAGE_BASE } from './faces-lib.mjs';
import { parse, label } from './svg.mjs';
import { turnData } from './face-turn.mjs';
import { headTurn } from './head-loft.mjs';

// [view, yaw, pitch, back layer apart]: seen from behind or above, the hair
// behind the head is over the skin, so it stays in the head (as in the
// turned-head grid the artist approved)
const BAKE = [['quarter', 30, 0, true], ['back-view', 180, 0, false], ['front-down', 0, -40, true], ['top', 0, -90, false]];
const MOUTH_VIEWS = ['quarter', 'front-down'];        // the base draws the face (with mouths) there
const BASE_VIEWS = [...MOUTH_VIEWS, 'back-view', 'top']; // the base draws the head there
const force = process.argv.includes('--force');
const bases = process.argv.includes('--bases');
const vi = process.argv.indexOf('--views');
const VIEWS_ONLY = vi > 0 ? process.argv[vi + 1].split(',') : null;
const only = process.argv.slice(2).filter((a, i, all) => !a.startsWith('--') && all[i - 1] !== '--views');
const unclip = (svg) => svg.replace(/<defs>[\s\S]*?<\/defs>/g, '').replace(/ clip-path="url\(#[^)]*\)"/g, '');
const MOUTHS = ['mouth-1', 'mouth-2', 'mouth-3'];

// the turn data from a face's front and side: the base's skin, eyes, mouths
// and (a character) its back / under / over and own eyes, mouths
function turnOf(B, X = null) {
  const lay = (v) => {
    const L = { ...B[v].layers, skin: B[v].layers.skin && paintSkin(B[v].layers.skin) };
    if (X) for (const k of ['back', 'under', 'over', 'eyes', ...MOUTHS]) if (X[v].layers[k]) L[k] = X[v].layers[k];
    return { layers: L };
  };
  return turnData({ front: lay('front'), side: lay('side') });
}
const layerOf = (view, name, inner) => ({ tag: 'g', attrs: { 'inkscape:groupmode': 'layer', 'inkscape:label': name, id: `${view}-${name}` }, children: inner ? parse(`<g>${inner}</g>`).children[0].children : [] });
// write a parsed face file back
function save(file, src, svg) {
  const comment = (src.match(/^(?:<\?xml[^>]*\?>\s*)?(<!--[\s\S]*?-->)/) || [])[1] || '';
  writeFileSync(file, `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${comment ? `${comment}\n` : ''}${writeNode(svg)}`);
}
// may this view's layer be (re)written? absent, empty, or still generated with --force
function writable(old, X, view) {
  if (!old) return true;
  const marked = old.children.some((n) => n.tag === 'g' && label(n) === 'generated');
  if (marked) return force;
  return !Object.keys(X[view]?.layers || {}).length;     // an empty layer (the bases' old front-down)
}

// the colour the base's front skin is drawn in (the importer paints the skin
// the character's body colour anyway; this is for the drawing)
function skinColourOf(B) {
  const s = B.front.layers.skin;
  return (s.match(/fill\s*:\s*(#[0-9a-fA-F]{3,6})/) || s.match(/fill="(#[0-9a-fA-F]{3,6})"/) || [])[1] || '#c8a080';
}

if (bases) {
  for (const species of ['male', 'female', 'monkey']) {
    const file = join(root, 'data/faces/base', `${species}.svg`);
    const B = readFile(file), turn = turnOf(B);
    const src = readFileSync(file, 'utf8');
    const svg = parse(src).children.find((n) => n.tag === 'svg');
    const done = [];
    for (const [view, yaw, pitch] of BAKE.filter(([v]) => MOUTH_VIEWS.includes(v))) {
      const old = svg.children.find((n) => n.tag === 'g' && label(n) === view);
      if (!writable(old, B, view)) continue;
      const gen = (o) => unclip(headTurn(turn, yaw, pitch, { id: `${species}-${view}`, part: 'head', ...o }));
      // the skin in the colour the base's front skin is drawn in
      const skinColour = skinColourOf(B);
      const skin = gen({ mouths: false, layers: ['skin'] }).replace(/currentColor/g, skinColour);
      const kids = [layerOf(view, 'generated'), layerOf(view, 'skin', skin), layerOf(view, 'eyes', gen({ mouths: false, layers: ['eyes'] })),
        ...MOUTHS.map((m, i) => layerOf(view, m, gen({ mouths: 'only', mouth: i + 1 })))];
      if (old) old.children = [...old.children.filter((n) => n.tag === 'g' && label(n).startsWith('guide')), ...kids];
      else svg.children.push({ tag: 'g', attrs: { 'inkscape:groupmode': 'layer', 'inkscape:label': view, id: view, transform: `translate(${BASE_X[view] ?? 0} ${view === 'front-down' ? 4 : 0})` }, children: kids });
      done.push(view);
    }
    // back and top: drawn, not sliced — the back is the front's skin (face
    // shape and ears, no eyes or mouths), the top a circle one head-unit
    // across, in the skin colour
    for (const view of ['back-view', 'top']) {
      const old = svg.children.find((n) => n.tag === 'g' && label(n) === view);
      if (!writable(old, B, view)) continue;
      const skin = view === 'back-view' ? B.front.layers.skin : `<circle cx="0" cy="0" r="0.5" style="fill:${skinColourOf(B)}"/>`;
      const kids = [layerOf(view, 'skin', skin)];
      if (old) old.children = [...old.children.filter((n) => n.tag === 'g' && label(n).startsWith('guide')), ...kids];
      else svg.children.push({ tag: 'g', attrs: { 'inkscape:groupmode': 'layer', 'inkscape:label': view, id: view, transform: `translate(${BASE_X[view]} 0)` }, children: kids });
      done.push(view);
    }
    if (!done.length) { console.log(`base ${species}: nothing to generate`); continue; }
    Object.assign(svg.attrs, PAGE_BASE);
    save(file, src, svg);
    console.log(`base ${species}: wrote ${done.join(', ')}`);
  }
  process.exit();
}

const cast = json('data/characters.json').characters.filter((c) => !c.sideOnly && (!only.length || only.includes(c.id)));
for (const c of cast) {
  const file = join(root, 'data/faces', `${c.id}.svg`);
  const B = readFile(join(root, 'data/faces/base', `${c.species}.svg`)), X = readFile(file);
  if (!X.front || !X.side) { console.error(`  ! ${c.id}: needs front and side drawings`); continue; }
  const turn = turnOf(B, X);
  // its own front eyes / mouths: then its views keep their own too
  const ownMouth = MOUTHS.some((m) => X.front.layers[m]);
  const ownEyes = !!X.front.layers.eyes;
  const src = readFileSync(file, 'utf8');
  const svg = parse(src).children.find((n) => n.tag === 'svg');
  const done = [];
  for (const [view, yaw, pitch, apart] of BAKE) {
    if (VIEWS_ONLY && !VIEWS_ONLY.includes(view)) continue;
    const old = svg.children.find((n) => n.tag === 'g' && label(n) === view);
    if (!writable(old, X, view)) continue;
    const part = (o) => unclip(headTurn(turn, yaw, pitch, { id: `${c.id}-${view}`, ...o }));
    const own = BASE_VIEWS.includes(view);          // the character's own parts only
    const away = !MOUTH_VIEWS.includes(view);       // back, top: hair over the whole skull
    const L = (name, inner) => layerOf(view, name, inner);
    const layer = {
      tag: 'g',
      attrs: { 'inkscape:groupmode': 'layer', 'inkscape:label': view, id: view, transform: `translate(${VIEW_X[view]} 0)`, style: `color:${c.body}` },
      children: own && away ? [
        // seen from behind or above, all the character's parts are over the base
        L('generated'),
        L('over', part({ part: 'all', mouths: false, layers: ['back', 'under', 'over'] })),
      ].filter((g) => label(g) === 'generated' || g.children.length) : own ? [
        L('generated'),
        L('back', part({ part: 'back', mouths: false, layers: ['back'] })),
        L('under', part({ part: 'head', mouths: false, layers: ['under'] })),
        L('over', part({ part: 'head', mouths: false, layers: ['over'] })),
        ...(ownEyes ? [L('eyes', part({ part: 'head', mouths: false, layers: ['eyes'] }))] : []),
        ...(ownMouth ? [1, 2, 3].map((k) => L(`mouth-${k}`, part({ part: 'head', mouths: 'only', mouth: k }))) : []),
      ].filter((g) => label(g) === 'generated' || g.children.length) : [
        L('generated'),
        L('back', apart ? part({ part: 'back' }) : ''),
        L('over', part({ part: apart ? 'head' : 'all', mouths: false })),
      ].filter((g) => label(g) === 'generated' || g.children.length),
    };
    if (old) svg.children[svg.children.indexOf(old)] = layer; else svg.children.push(layer);
    done.push(view);
  }
  if (!done.length) { console.log(`${c.id}: nothing to generate`); continue; }
  Object.assign(svg.attrs, PAGE_ALL_VIEWS);
  save(file, src, svg);
  console.log(`${c.id}: generated ${done.join(', ')}`);
}
