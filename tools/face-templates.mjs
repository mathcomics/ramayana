// Face templates and guides (data/faces/README.md).
//
//   node tools/face-templates.mjs
//     -> data/faces/templates/<species>.svg   a new character's face file
//     -> refreshes the guide layer in data/faces/base/*.svg and data/faces/*.svg
//
// Run it after changing a base face or the body parts. The guide (locked,
// ignored on import) shows the species' drawn torso and neck standing
// straight at the figure's real scale (so body hair can be drawn over the
// back) and, in
// character files and the base's raised / lowered versions, the base face.
// The other views of a character (quarter, back-view, front-down, top) get
// the neck as a figure shows it with the head in that view, and the views
// are laid out in a row after the side (faces-lib VIEW_X); their
// quarter and front-down guides also show the base's mouth-3 (the mouths of
// those views are the base's); the base's quarter and front-down show the
// neck.
// Units are head-units: head centre (0,0), y down; side faces look right.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathD } from '../src/geom.js';
import { buildShapes } from '../src/figure.js';
import { headView } from '../src/headturn.js';
import { loadSpecies, writeOut, root, json } from './lib.mjs';
import { readFile, replaceGuides, VIEW_X, PAGE_ALL_VIEWS, BASE_X, PAGE_BASE } from './faces-lib.mjs';

const STRAIGHT = { look: 'front', spine: { lean: 0, chest: 0, neck: 0, head: 0 },
  near: { arm: { shoulder: 0, elbow: 0 }, leg: { hip: 0, knee: 0 } },
  far: { arm: { shoulder: 0, elbow: 0 }, leg: { hip: 0, knee: 0 } } };
const GUIDE = { torso: '#d9cfc4', neck: '#e8e1d9', skin: '#d9c3b6' };
const OFFSET = 3;
const all = loadSpecies();
const dir = join(root, 'data/faces');

// the drawn body standing straight, around the head centre, and the nape
function bodyGuide(S, view) {
  const { shapes, headAnchor, hairAnchor } = buildShapes(S, STRAIGHT, { top: 'bare', bottom: 'dhoti' }, view);
  const [hx, hy] = headAnchor.at;
  const loc = (pts) => pts.map(([x, y]) => [x - hx, y - hy]);
  // torso and neck only (no limbs)
  const markup = [
    ...shapes.filter((s) => s.part === 'torso').map((s) => `<path d="${pathD(loc(s.pts))}" fill="${GUIDE.torso}"/>`),
    ...shapes.filter((s) => s.part === 'neck').map((s) => `<path d="${pathD(loc(s.pts))}" fill="${GUIDE.neck}"/>`),
    '<path d="M-0.08 0H0.08M0 -0.08V0.08" stroke="#b04040" stroke-width="0.01" fill="none"/>',
  ].join('\n');
  const nape = [hairAnchor.at[0] - hx, hairAnchor.at[1] - hy].map((v) => Math.round(v * 1000) / 1000);
  return { markup, nape };
}
// The neck for a view beyond front and side: a front-view figure standing
// straight with its head turned / lowered to that view, the neck carried
// into the view's own drawing coordinates (the inverse of how the renderer
// places the view), and the head centre's cross.
const VIEW_POSE = { quarter: { turn: 30 }, 'back-view': { turn: 180 }, 'front-down': { head: 40 }, top: { head: 90 } };
function viewGuide(S, view) {
  const pose = { ...STRAIGHT, spine: { ...STRAIGHT.spine, ...VIEW_POSE[view] } };
  const { shapes, headAnchor } = buildShapes(S, pose, { top: 'bare', bottom: 'dhoti' }, 'front');
  const { m } = headView(headAnchor.R, [view]);
  const [hx, hy] = headAnchor.at;
  // m is a rotation or reflection: its inverse is its transpose
  const loc = (pts) => pts.map(([x, y]) => [m[0] * (x - hx) + m[1] * (y - hy), m[2] * (x - hx) + m[3] * (y - hy)]);
  return [
    ...shapes.filter((sh) => sh.part === 'neck').map((sh) => `<path d="${pathD(loc(sh.pts))}" fill="${GUIDE.neck}"/>`),
    '<path d="M-0.08 0H0.08M0 -0.08V0.08" stroke="#b04040" stroke-width="0.01" fill="none"/>',
  ].join('\n');
}
// the base's mouth-3 of a view (character guides: on top of the drawing,
// layer guide-mouth, half transparent)
const baseMouth = (B, view) => B[view]?.layers['mouth-3'] || '';
const ownMouths = (X) => ['mouth-1', 'mouth-2', 'mouth-3'].some((m) => X.front?.layers[m]);
// the base face (level) for a guide: skin in a neutral colour, eyes as drawn
const baseFace = (B, view) => {
  const L = B[view]?.layers || {};
  const skin = (L.skin || '').replace(/fill\s*:\s*(?!none)[^;"]+/g, `fill:${GUIDE.skin}`).replace(/fill="(?!none)[^"]*"/g, `fill="${GUIDE.skin}"`);
  return `<g opacity="0.6">${skin}${L.eyes || ''}</g>`;
};

const cast = json('data/characters.json').characters;
for (const species of Object.keys(all)) {
  const S = all[species];
  const G = { front: bodyGuide(S, 'front'), side: bodyGuide(S, 'side') };
  const baseFile = join(dir, 'base', `${species}.svg`);
  const B = readFile(baseFile);
  // base: body only on the level faces, the level face too on up / down
  const more = Object.fromEntries(Object.keys(VIEW_POSE).map((v) => [v, viewGuide(S, v)]));
  writeFileSync(baseFile, replaceGuides(readFileSync(baseFile, 'utf8'), {
    front: G.front.markup, side: G.side.markup, 'front-up': G.front.markup + baseFace(B, 'front'),
    'front-down': more['front-down'], quarter: more.quarter, 'back-view': more['back-view'], top: more.top },
    B.quarter ? { offsets: BASE_X, page: PAGE_BASE } : {}));
  const charGuides = { front: G.front.markup + baseFace(B, 'front'), side: G.side.markup + baseFace(B, 'side') };
  const mouthTop = { quarter: baseMouth(B, 'quarter'), 'front-down': baseMouth(B, 'front-down') };
  for (const c of cast.filter((x) => x.species === species)) {
    const f = join(dir, `${c.id}.svg`);
    const X = readFile(f);
    // a character with views beyond front and side: their guides, laid out in a row
    const all = Object.keys(VIEW_POSE).some((v) => X[v]);
    // the base face too (the character draws only its own parts in these views)
    const viewGuides = Object.fromEntries(Object.keys(VIEW_POSE).map((v) => [v, more[v] + baseFace(B, v)]));
    writeFileSync(f, replaceGuides(readFileSync(f, 'utf8'), all ? { ...charGuides, ...viewGuides } : charGuides,
      // the base's mouth on top, where the character draws no mouths of its own
      all ? { offsets: VIEW_X, page: PAGE_ALL_VIEWS, top: ownMouths(X) ? null : mouthTop } : {}));
  }
  // template for a new character
  const layer = (name, inner = '') => `    <g inkscape:groupmode="layer" inkscape:label="${name}">${inner}</g>\n`;
  let body = '';
  for (const [view, dx] of [['front', 0], ['side', OFFSET]]) {
    body += `  <g inkscape:groupmode="layer" inkscape:label="${view}"${dx ? ` transform="translate(${dx} 0)"` : ''}>\n`;
    body += `    <g inkscape:groupmode="layer" inkscape:label="guide" sodipodi:insensitive="true" opacity="0.7">\n${charGuides[view]}\n    </g>\n`;
    for (const n of ['back', 'hair-body', 'under', 'over']) body += layer(n);
    body += layer('anchors', `<circle inkscape:label="nape" cx="${G[view].nape[0]}" cy="${G[view].nape[1]}" r="0.03" fill="#d02020"/>`);
    body += '  </g>\n';
  }
  writeOut(`data/faces/templates/${species}.svg`, `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- Face template: ${species}. Copy to data/faces/<character-id>.svg
     (data/faces/README.md). The character's own parts over the ${species}
     base face (data/faces/base/${species}.svg, shown in the guide; its skin
     takes the body colour from data/characters.json). Top-level layers
     front, side (face looks right; offset ignored); optionally front-up /
     front-down with their own under / over. In each:
       under     - behind the base face (hair behind the head …)
       over      - over it (hair, crown, beard, marks …)
       back      - behind the whole body
       hair-body - long hair on the back; moves with the upper body,
                   pinned at the nape anchor
       eyes, mouth-1/2/3 - optional; replace the base's
       guide     - locked, ignored
     Colours as drawn. Units: head-units, head centre (0,0), y down. -->
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
     xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
     width="1200" height="1000" viewBox="-1.5 -1.2 6 5">
${body}</svg>
`);
}
console.log('templates written, guides refreshed');
