// Head sheet for hand corrections: every species, side and front view,
// medium mouth, in light colours with thin outlines.
//
//   node tools/head-sheet.mjs   ->  out/head-sheet.svg / .png (print or draw over)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { anatomy } from '../src/figure.js';
import { pathD, bbox } from '../src/geom.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPECIES = ['monkey', 'male', 'female'];
const VIEWS = ['side', 'front'];
const C = { face: '#f6dcc8', hair: '#cfe1f2', line: '#8a7f75', feature: '#ffffff', paper: '#ffffff' };
const px = 210;                   // px per head-unit
const cellW = 520, cellH = 640, padL = 140, padT = 70;

let body = '', id = 0;
SPECIES.forEach((sp, r) => {
  const S = JSON.parse(readFileSync(join(root, 'data/species', `${sp}.json`), 'utf8'));
  VIEWS.forEach((view, c) => {
    const parts = anatomy(S, { view, headView: view, mouth: 2, spine: { lean: 0, chest: 0, neck: 0, head: 0 } });
    const head = parts.head.find((p) => p.head).pts;
    const b = bbox([head]);
    const hc = [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];
    const x = padL + c * cellW + cellW / 2, y = padT + r * cellH + cellH * 0.3;
    const sw = 1.4 / px;
    id++;
    const shape = (pts, fill, extra = '') => `<path d="${pathD(pts)}" fill="${fill}" stroke="${C.line}" stroke-width="${sw}" stroke-linejoin="round"${extra}/>`;
    let g = '';
    const hair = parts.head.filter((p) => p.role === 'hair');
    const rest = parts.head.filter((p) => p.role !== 'hair');
    const fill = (p) => (p.role === 'eye' || p.role === 'mouth' ? C.feature : C.face);
    // front: hair behind everything; then neck and shoulders, faint, for placement
    if (view === 'front') g += hair.map((p) => shape(p.pts, C.hair)).join('');
    for (const p of [...parts.torso, ...parts.neck]) g += shape(p.pts, '#f3f0ec');
    g += `<clipPath id="f${id}"><path d="${pathD(head)}"/></clipPath>`;
    for (const p of rest) g += shape(p.pts, fill(p), p.role === 'mouth' ? ` clip-path="url(#f${id})"` : '');
    if (view !== 'front') g += hair.map((p) => shape(p.pts, C.hair)).join('');
    // re-draw eyes and mouth over the side hair so they stay visible
    if (view !== 'front') for (const p of rest.filter((q) => q.role === 'eye')) g += shape(p.pts, C.feature);
    // crop each cell to its own box (head, hair and shoulders)
    const cx0 = padL + c * cellW + 10, cy0 = padT + r * cellH + 10;
    body += `<clipPath id="cell${id}"><rect x="${cx0}" y="${cy0}" width="${cellW - 20}" height="${cellH - 20}" rx="12"/></clipPath>`;
    body += `<rect x="${cx0}" y="${cy0}" width="${cellW - 20}" height="${cellH - 20}" rx="12" fill="none" stroke="#e4ddd3"/>`;
    body += `<g clip-path="url(#cell${id})"><g transform="translate(${x} ${y}) scale(${px}) translate(${-hc[0]} ${-hc[1]})">${g}</g></g>`;
    if (r === 0) body += `<text x="${x}" y="40" font-family="sans-serif" font-size="26" fill="#6b6155" text-anchor="middle">${view}${view === 'side' ? ' (faces right)' : ''}</text>`;
  });
  body += `<text x="${padL - 20}" y="${padT + r * cellH + cellH * 0.3}" font-family="sans-serif" font-size="26" fill="#6b6155" text-anchor="end">${sp}</text>`;
});
const W = padL + VIEWS.length * cellW + 20, H = padT + SPECIES.length * cellH;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${C.paper}"/>${body}</svg>`;
mkdirSync(join(root, 'out'), { recursive: true });
writeFileSync(join(root, 'out/head-sheet.svg'), svg);
execFileSync('rsvg-convert', ['-o', join(root, 'out/head-sheet.png'), join(root, 'out/head-sheet.svg')]);
console.log('out/head-sheet.png');
