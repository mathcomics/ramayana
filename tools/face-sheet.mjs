// Check imported faces on figures: every character with a drawn face, in
// front poses with each mouth size, plus a side pose.
//
//   node tools/face-sheet.mjs   ->  out/face-sheet.png

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderFigure, characterLook } from '../src/figure.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const C = read('data/characters.json'), F = read('data/faces.json'), P = read('data/poses.json').poses;
const cast = C.characters.filter((c) => F.faces[c.id]);
const front = (mouth) => ({ name: 'front', view: 'front', headView: 'front', mouth, spine: {},
  near: { arm: { shoulder: 25, hand: 'fist' } }, far: { arm: { shoulder: 25, hand: 'fist' } } });
const columns = [['mouth 1', front(1)], ['mouth 2', front(2)], ['mouth 3', front(3)],
  ['crouch-fight', P.find((p) => p.name === 'crouch-fight')], ['point (side)', P.find((p) => p.name === 'point')]];
const cw = 170, rh = 330, W = cw * columns.length + 120, H = rh * cast.length + 40;
let s = '';
columns.forEach(([label], i) => { s += `<text x="${130 + i * cw + cw / 2}" y="26" font-family="sans-serif" font-size="14" fill="#776" text-anchor="middle">${label}</text>`; });
cast.forEach((c, r) => {
  const L = characterLook(c, C.palette, F);
  const S = read(`data/species/${L.species}.json`);
  s += `<text x="110" y="${40 + r * rh + rh / 2}" font-family="sans-serif" font-size="16" fill="#555" text-anchor="end">${c.name}</text>`;
  columns.forEach(([, pose], i) => {
    s += renderFigure(S, pose, { x: 130 + i * cw + cw / 2, y: 40 + (r + 1) * rh - 20, scale: 34, colors: L.colors, outfit: L.outfit, face: L.face, facePlaceholders: L.facePlaceholders }).svg;
  });
});
writeFileSync(join(root, 'out/face-sheet.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#efe8db"/>${s}</svg>`);
execFileSync('rsvg-convert', ['-o', join(root, 'out/face-sheet.png'), join(root, 'out/face-sheet.svg')]);
console.log('out/face-sheet.png');
