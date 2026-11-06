// Import the face drawings: a base face per species and each character's
// own parts (data/faces/README.md).
//
//   node tools/import-faces.mjs      ->  data/faces.json
//
// data/faces/base/<species>.svg: top-level layers front, side, front-up,
// front-down; in each skin, eyes, mouth-1/2/3, anchors (top, chin).
// data/faces/<id>.svg: top-level layers front, side (optional front-up,
// front-down); in each back, hair-body, under, over, optional eyes and
// mouth-1/2/3 (replace the base's), anchors (nape).
// Layer offsets (the top-level layers' own transforms) are ignored; a moved
// guide moves the origin with it. The drawings are copied unchanged (with
// the transforms of their groups); only the base's skin is painted
// currentColor, so the renderer fills it with the character's body colour.
//
// For each character and view the importer composes:
//   head  = under, skin, eyes, over        (turns with the head)
//   mouth = { 1, 2, 3 }                     (drawn over the head)
//   back, hairBody, nape, defs
//   up / down (front): the same for the raised / lowered head, when the base
//     has that version; the character's front-up / front-down layers if it
//     has them, else its under / over moved and stretched so that the
//     base's top and chin anchors land on that version's.

import { writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { root, json } from './lib.mjs';
import { readFile, paintSkin } from './faces-lib.mjs';
import { turnData } from './face-turn.mjs';
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
  for (const view of ['front', 'side']) {
    const x = X[view];
    if (!x) { console.error(`  ! ${c.id}: no ${view} layer`); process.exitCode = 1; continue; }
    const own = { eyes: x.layers.eyes, 'mouth-1': x.layers['mouth-1'], 'mouth-2': x.layers['mouth-2'], 'mouth-3': x.layers['mouth-3'] };
    const e = compose(B[view], x.layers, own);
    if (x.layers.back) e.back = x.layers.back;
    if (x.layers['hair-body']) {
      e.hairBody = x.layers['hair-body'];
      if (x.anchors.nape) e.nape = x.anchors.nape;
      else console.error(`  ! ${c.id} ${view}: hair-body layer but no nape anchor (using 0, 0.65)`);
    }
    const defs = (B[view].defs || '') + (x.defs || '');
    if (defs.trim()) e.defs = defs;
    // raised / lowered head (front)
    if (view === 'front') for (const [k, name] of [['up', 'front-up'], ['down', 'front-down']]) {
      const bv = B[name];
      if (!bv?.layers.skin) continue;
      // the character's layers and anything the version lacks (eyes,
      // mouths) follow the anchors: moved and stretched so that the level
      // face's top and chin land on this version's
      const a0 = B.front.anchors, a1 = bv.anchors;
      if (!a0.top || !a0.chin || !a1.top || !a1.chin) { console.error(`  ! base ${c.species} ${name}: needs top and chin anchors`); continue; }
      const s = (a1.chin[1] - a1.top[1]) / (a0.chin[1] - a0.top[1]);
      const t = `matrix(1 0 0 ${r4(s)} ${r4(a1.top[0] - a0.top[0])} ${r4(a1.top[1] - a0.top[1] * s)})`;
      const follow = (g) => g && `<g transform="${t}">${g}</g>`;
      let xl = X[name]?.layers;
      if (!xl || (!xl.under && !xl.over)) xl = { under: follow(x.layers.under), over: follow(x.layers.over) };
      const xv = X[name]?.layers || {};
      // the character's own (eyes, mouths) first, then this version's, then the level base's
      const pick = (k) => xv[k] ?? (x.layers[k] ? follow(x.layers[k]) : bv.layers[k] ? undefined : follow(B.front.layers[k]));
      e[k] = compose(bv, xl, { eyes: pick('eyes'), 'mouth-1': pick('mouth-1'), 'mouth-2': pick('mouth-2'), 'mouth-3': pick('mouth-3') });
    }
    (faces[c.id] ||= {})[view] = e;
  }
  // turn data (src/headturn.js): the base's skin, eyes, mouths and the
  // character's back / under / over (and own eyes, mouths) of both views
  if (X.front && X.side) {
    const lay = (v) => { const L = { ...B[v].layers, skin: B[v].layers.skin && paintSkin(B[v].layers.skin) }; for (const k of ['back', 'under', 'over', 'eyes', 'mouth-1', 'mouth-2', 'mouth-3']) if (X[v].layers[k]) L[k] = X[v].layers[k]; return { layers: L }; };
    faces[c.id].turn = turnData({ front: lay('front'), side: lay('side') });
    if (faces[c.id].turn.mismatch) console.warn(`  ~ ${c.id}: front and side heights differ (turned heads): ${faces[c.id].turn.mismatch.join('; ')}`);
  }
  console.log(`${c.id}: ${['front', 'side'].map((v) => `${v} ${['under', 'over', 'back', 'hair-body', 'eyes', 'mouth-1'].filter((n) => X[v]?.layers[n]).join('/') || '-'}`).join('; ')}${faces[c.id]?.front?.up ? ' +up' : ''}${faces[c.id]?.front?.down ? ' +down' : ''}`);
}
for (const f of readdirSync(dir).filter((x) => x.endsWith('.svg')))
  if (!cast.some((c) => `${c.id}.svg` === f)) console.error(`  ! ${f}: face for a character not in data/characters.json`);
writeFileSync(outPath, JSON.stringify({
  _doc: 'Generated by tools/import-faces.mjs from data/faces/base/*.svg and data/faces/*.svg. Do not edit; edit the SVGs. Coordinates: head-units, head centre at (0,0). The base skin is currentColor (the character\'s body colour); everything else as drawn.',
  faces,
}, null, 1));
console.log(`${outPath}: ${Object.keys(faces).length} character(s)`);
