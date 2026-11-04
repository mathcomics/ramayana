// Head sheet for hand corrections: every species, side and front view,
// medium mouth, in light colours with thin outlines.
//
//   node tools/head-sheet.mjs   ->  out/head-sheet.svg / .png (print or draw over)

import { pathD } from '../src/geom.js';
import { loadSpecies, writeOut, rsvg, headFrame } from './lib.mjs';

const ALL = loadSpecies();
const SPECIES = Object.keys(ALL);
const VIEWS = ['side', 'front'];
const C = { face: '#f6dcc8', hair: '#cfe1f2', line: '#8a7f75', feature: '#ffffff', paper: '#ffffff' };
const px = 210;                   // px per head-unit
const cellW = 520, cellH = 640, padL = 140, padT = 70;

let body = '', id = 0;
SPECIES.forEach((sp, r) => {
  VIEWS.forEach((view, c) => {
    const { parts, centre: hc } = headFrame(ALL[sp], view);
    const head = parts.head.find((p) => p.head).pts;
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
const svgPath = writeOut('out/head-sheet.svg', svg);
rsvg(svgPath, svgPath.replace(/svg$/, 'png'));
console.log('out/head-sheet.png');
