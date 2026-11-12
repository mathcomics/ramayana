// Import the face drawings: a base face per species and each character's
// own parts (data/faces/README.md).
//
//   node tools/import-faces.mjs          ->  data/faces.json
//   node tools/import-faces.mjs --check  exits 1 if data/faces.json is out of
//                                        date with the drawings (npm test)
//
// Views (top-level layers; docs/proposals/2026-11-12-head-rendering-survey.md):
// front, side, and the optional quarter (30°, looking right), back-view
// (180°), front-down (40° down), top (90° down) and front-up.
// data/faces/base/<species>.svg: per view skin, eyes, mouth-1/2/3, anchors
// (top, chin).
// data/faces/<id>.svg: per view back, hair-body, under, over, optional eyes
// and mouth-1/2/3 (replace the base's), anchors (nape). A view the base has
// no face drawing for is the whole head as drawn in the character's file,
// with the base's mouths for that view (quarter, front-down) unless it has
// its own.
// Layer offsets (the top-level layers' own transforms) are ignored; a moved
// guide moves the origin with it. The drawings are copied unchanged (with
// the transforms of their groups); only the base's skin is painted
// currentColor, so the renderer fills it with the character's body colour.
//
// For each character and view the importer composes:
//   head  = under, skin, eyes, over
//   mouth = { 1, 2, 3 }                     (drawn over the head)
//   back, hairBody, nape, defs
//   front-up / front-down: when the base draws that version and the
//     character does not, the character's front under / over moved and
//     stretched so that the base's top and chin anchors land on that
//     version's.
//   A sideOnly character (data/characters.json) gets the side view only.

import { writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { root, json } from './lib.mjs';
import { readFile, paintSkin, VIEWS } from './faces-lib.mjs';
const r4 = (v) => Math.round(v * 1e4) / 1e4;

const dir = join(root, 'data/faces');
const outPath = join(root, 'data/faces.json');
// ---- bases
const bases = {};
for (const f of readdirSync(join(dir, 'base')).filter((x) => x.endsWith('.svg'))) {
  const species = f.replace(/\.svg$/, '');
  const B = readFile(join(dir, 'base', f));
  for (const v of ['front', 'side']) if (!B[v]?.layers.skin) console.error(`  ! base ${species}: no ${v} skin`);
  bases[species] = B;
  console.log(`base ${species}: ${Object.entries(B).filter(([, x]) => x.layers.skin).map(([k]) => k).join(', ')}`);
}

// ---- characters
const cast = json('data/characters.json').characters;
const faces = {};
for (const c of cast) {
  const file = join(dir, `${c.id}.svg`);
  if (!existsSync(file)) { console.error(`  ! ${c.id}: no data/faces/${c.id}.svg`); process.exitCode = 1; continue; }
  const B = bases[c.species];
  if (!B) { console.error(`  ! ${c.id}: no base face for ${c.species}`); process.exitCode = 1; continue; }
  const X = readFile(file);
  const entry = {};
  const compose = (bv, xl, xmouth) => {
    const L = xl, BL = bv.layers;
    const head = (L.under || '') + (BL.skin ? paintSkin(BL.skin) : '') + (xmouth.eyes ?? BL.eyes ?? '') + (L.over || '');
    const mouth = {};
    for (const k of ['1', '2', '3']) { const m = xmouth[`mouth-${k}`] ?? BL[`mouth-${k}`]; if (m) mouth[k] = m; }
    return { head, mouth };
  };
  const views = c.sideOnly ? ['side'] : VIEWS;
  for (const view of c.sideOnly ? ['side'] : ['front', 'side']) if (!X[view]) { console.error(`  ! ${c.id}: no ${view} layer`); process.exitCode = 1; }
  for (const view of views) {
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
        else console.error(`  ! ${c.id} ${view}: hair-body layer but no nape anchor (using 0, 0.65)`);
      }
      const defs = (B[view]?.defs || '') + (x.defs || '');
      if (!B[view]?.layers.skin && !Object.keys(e.mouth).length && ['quarter', 'front-down'].includes(view)) console.error(`  ! ${c.id} ${view}: no mouths (the base's ${view} view or the character's own)`);
      if (defs.trim()) e.defs = defs;
    } else if ((view === 'front-up' || view === 'front-down') && B[view]?.layers.skin && X.front) {
      // the base draws the raised / lowered head and the character does not:
      // its front layers (and anything the version lacks: eyes, mouths)
      // follow the anchors, moved and stretched so that the level face's top
      // and chin land on this version's
      const bv = B[view], xf = X.front;
      const a0 = B.front.anchors, a1 = bv.anchors;
      if (!a0.top || !a0.chin || !a1.top || !a1.chin) { console.error(`  ! base ${c.species} ${view}: needs top and chin anchors`); continue; }
      const sc = (a1.chin[1] - a1.top[1]) / (a0.chin[1] - a0.top[1]);
      const t = `matrix(1 0 0 ${r4(sc)} ${r4(a1.top[0] - a0.top[0])} ${r4(a1.top[1] - a0.top[1] * sc)})`;
      const follow = (g) => g && `<g transform="${t}">${g}</g>`;
      const pick = (k) => (xf.layers[k] ? follow(xf.layers[k]) : bv.layers[k] ? undefined : follow(B.front.layers[k]));
      e = compose(bv, { under: follow(xf.layers.under), over: follow(xf.layers.over) }, { eyes: pick('eyes'), 'mouth-1': pick('mouth-1'), 'mouth-2': pick('mouth-2'), 'mouth-3': pick('mouth-3') });
      if (xf.layers.back) e.back = follow(xf.layers.back);
    } else continue;
    (faces[c.id] ||= {})[view] = e;
  }
  console.log(`${c.id}: ${Object.entries(faces[c.id] || {}).map(([v, e]) => v + (e.generated ? ' (generated)' : '')).join(', ')}`);
}
for (const f of readdirSync(dir).filter((x) => x.endsWith('.svg')))
  if (!cast.some((c) => `${c.id}.svg` === f)) console.error(`  ! ${f}: face for a character not in data/characters.json`);
const out = JSON.stringify({
  _doc: 'Generated by tools/import-faces.mjs from data/faces/base/*.svg and data/faces/*.svg. Do not edit; edit the SVGs. Coordinates: head-units, head centre at (0,0). The base skin is currentColor (the character\'s body colour); everything else as drawn.',
  faces,
}, null, 1);
if (process.argv.includes('--check')) {
  const was = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')).faces : {};
  const stale = Object.keys({ ...was, ...faces }).filter((k) => JSON.stringify(was[k]) !== JSON.stringify(faces[k]));
  if (stale.length) { console.error(`data/faces.json is out of date for: ${stale.join(', ')} — run node tools/import-faces.mjs`); process.exitCode = 1; }
} else {
  writeFileSync(outPath, out);
  console.log(`${outPath}: ${Object.keys(faces).length} character(s)`);
}
