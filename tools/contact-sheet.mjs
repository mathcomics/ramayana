// Render every pose for a species into a contact-sheet SVG (+ PNG if
// rsvg-convert is available): each pose in side view and, next to it, the
// front view derived from it.
//
//   node tools/contact-sheet.mjs [species] [--scale 20] [--zoom 3]
//
// --scale is px per head-unit (20 ≈ 110px standing figure, phone size).
// --zoom multiplies the PNG resolution for close inspection.

import { renderFigure } from '../src/figure.js';
import { json, writeOut, rsvg } from './lib.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? Number(args[i + 1]) : d; };
const speciesId = args.find((a) => !a.startsWith('--') && isNaN(Number(a))) || 'monkey';
const scale = opt('--scale', 20);
const zoom = opt('--zoom', 1);

const species = json(`data/species/${speciesId}.json`);
const { poses } = json('data/poses.json');

const cols = 3;                       // poses per row (each a side + front pair)
const cellW = scale * 13, cellH = scale * 8.2;
const rows = Math.ceil(poses.length / cols);
const W = cols * cellW, H = rows * cellH;

let body = '';
poses.forEach((pose, i) => {
  const cx = (i % cols) * cellW, cy = Math.floor(i / cols) * cellH;
  const groundY = cy + cellH - scale * 1.4;
  const side = renderFigure(species, pose, { x: cx + cellW * 0.27, y: groundY, scale }).svg;
  const front = renderFigure(species, pose, { x: cx + cellW * 0.73, y: groundY, scale, view: 'front' }).svg;
  body += `<line x1="${cx + 8}" x2="${cx + cellW - 8}" y1="${groundY}" y2="${groundY}" stroke="#c9bfae" stroke-width="1"/>`;
  body += side + front;
  body += `<text x="${cx + cellW / 2}" y="${cy + cellH - scale * 0.5}" font-family="sans-serif" font-size="${scale * 0.55}" fill="#7a6e5e" text-anchor="middle">${pose.name}</text>`;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
  `<rect width="${W}" height="${H}" fill="#f4efe6"/>${body}</svg>`;

const svgPath = writeOut(`out/contact-${speciesId}.svg`, svg);
try {
  const png = svgPath.replace(/\.svg$/, `${zoom > 1 ? `@${zoom}x` : ''}.png`);
  rsvg(svgPath, png, ['-z', String(zoom)]);
  console.log(png);
} catch {
  console.log(svgPath, '(rsvg-convert not available; SVG only)');
}
