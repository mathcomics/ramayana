// Render every pose for a species into a contact-sheet SVG (+ PNG if
// rsvg-convert is available): each pose in side view and, next to it, the
// front view derived from it. Figures are drawn as a character of that
// species (its drawn face and outfit): the first in data/characters.json
// unless --who names one.
//
//   node tools/contact-sheet.mjs [species] [--who rama] [--scale 20] [--zoom 3]
//
// --scale is px per head-unit (20 ≈ 110px standing figure, phone size).
// --zoom multiplies the PNG resolution for close inspection.

import { renderFigure, characterLook } from '../src/figure.js';
import { loadAssets, writeOut, toPng, cliArgs } from './lib.mjs';

const args = cliArgs();
const flag = (k) => args.str(k);
const speciesId = args.words[0] || 'monkey';
const scale = args.num('--scale', 20);
const zoom = args.num('--zoom', 1);

const A = loadAssets();
const species = A.species[speciesId];
const { poses } = A;
const who = A.characters.characters.find((c) => (flag('--who') ? c.id === flag('--who') : c.species === speciesId));
if (!species || !who || who.species !== speciesId) throw new Error(`no ${speciesId} character${flag('--who') ? ` "${flag('--who')}"` : ''}`);
const look = characterLook(who, A.characters.palette, A.faces);

const cols = 3;                       // poses per row (each a side + front pair)
const cellW = scale * 13, cellH = scale * 8.2;
const rows = Math.ceil(poses.length / cols);
const W = cols * cellW, H = rows * cellH;

let body = '';
poses.forEach((pose, i) => {
  const cx = (i % cols) * cellW, cy = Math.floor(i / cols) * cellH;
  const groundY = cy + cellH - scale * 1.4;
  const side = renderFigure(species, pose, { ...look, x: cx + cellW * 0.27, y: groundY, scale }).svg;
  const front = renderFigure(species, pose, { ...look, x: cx + cellW * 0.73, y: groundY, scale, view: 'front' }).svg;
  body += `<line x1="${cx + 8}" x2="${cx + cellW - 8}" y1="${groundY}" y2="${groundY}" stroke="#c9bfae" stroke-width="1"/>`;
  body += side + front;
  body += `<text x="${cx + cellW / 2}" y="${cy + cellH - scale * 0.5}" font-family="sans-serif" font-size="${scale * 0.55}" fill="#7a6e5e" text-anchor="middle">${pose.name}</text>`;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
  `<rect width="${W}" height="${H}" fill="#f4efe6"/>${body}</svg>`;

toPng(writeOut(`out/contact-${speciesId}.svg`, svg), zoom);
