// Turn sheet: each character's head turned and tilted (src/headturn.js).
//   node tools/head-turn-sheet.mjs [rama sita ...]   -> out/head-turn.png
import { headTurn } from '../src/headturn.js';
import { loadAssets, writeOut, rsvg } from './lib.mjs';
const A = loadAssets();
const ids = process.argv.slice(2).length ? process.argv.slice(2) : A.characters.characters.map((c) => c.id);
const yaws = [0, 30, 60, 90, 120, 150, 180], pitches = [90, 40, 20, 0, -20, -40, -90];
const C = 1.4, S = 60;                         // cell size (head-units), px per head-unit
const W = (yaws.length * C + 1.2) * S, block = (pitches.length * C + 0.6) * S;
let body = '', k = 0;
for (const id of ids) {
  const f = A.faces.faces[id], ch = A.characters.characters.find((c) => c.id === id);
  if (!f?.turn) continue;
  const y0 = k++ * block;
  body += `<text x="8" y="${y0 + 22}" font-size="16" font-family="sans-serif">${ch.name}</text>`;
  yaws.forEach((yw, j) => { if (!k || k === 1) body += `<text x="${(1.2 + j * C + C / 2) * S}" y="14" font-size="12" text-anchor="middle" font-family="sans-serif">turn ${yw}°</text>`; });
  pitches.forEach((p, i) => {
    body += `<text x="8" y="${y0 + (0.6 + i * C + C / 2) * S}" font-size="12" font-family="sans-serif">${p > 0 ? 'up ' + p : p < 0 ? 'down ' + -p : 'level'}</text>`;
    yaws.forEach((yw, j) => {
      const x = (1.2 + j * C + C / 2) * S, y = y0 + (0.6 + i * C + C / 2) * S;
      body += `<g transform="translate(${x} ${y}) scale(${S})" color="${ch.body}">${headTurn(f.turn, yw, p, { id: `h${k}-${i}-${j}` })}</g>`;
    });
  });
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${k * block}"><rect width="100%" height="100%" fill="#f2ece1"/>${body}</svg>`;
writeOut('out/head-turn.svg', svg); rsvg('out/head-turn.svg', 'out/head-turn.png');
console.log('out/head-turn.png');
