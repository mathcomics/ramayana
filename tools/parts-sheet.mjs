// Draw every body part separately, all at one scale, for inspection.
//
//   node tools/parts-sheet.mjs [species] [--light]   ->  out/parts-<species>[-light].png
//
// Side-view parts use a near-straight standing pose; the front-view torso
// and every hand are shown too. Faces are drawn by the artist, so the head
// is left out. --light draws pale fills with a thin outline, on white, to
// draw corrections over (also writes a PDF).

import { anatomy, DEFAULT_COLORS, HANDS } from '../src/figure.js';
import { pathD, bbox } from '../src/geom.js';
import { json, writeOut, rsvg } from './lib.mjs';

const args = process.argv.slice(2);
const light = args.includes('--light');
const id = args.find((a) => !a.startsWith('--')) || 'monkey';
const S = json(`data/species/${id}.json`);

const side = { view: 'side', spine: {}, near: { arm: { shoulder: 0, elbow: 25 }, leg: { hip: 0, knee: 25 } }, tail: { lift: 30, curl: 200 } };
const front = { view: 'front', spine: {} };
const cells = [];
const add = (label, shapes, zoom = 1) => cells.push({ label, shapes, zoom });

const A = anatomy(S, side), F = anatomy(S, front);
add('neck', A.neck);
add('torso · side', A.torso);
add('torso · front', F.torso);
add('upper arm', A['upper arm']);
add('forearm', A.forearm);
const HAND_ZOOM = 2.5;            // hands are small: shown enlarged, with the wrist end of the forearm
for (const h of HANDS) {
  const P = anatomy(S, { ...side, near: { ...side.near, arm: { ...side.near.arm, hand: h } } });
  add(`hand · ${h} (×${HAND_ZOOM})`, [...P.forearm, ...P.hand], HAND_ZOOM);
}
add('thigh', A.thigh);
add('shin', A.shin);
add('foot', A.foot);
if (A.tail) add('tail', A.tail);
add('loincloth · front (torso faint)', F.loincloth);
add('loincloth · side (torso faint)', A.loincloth);

const colors = light ? { body: '#eadfd4', cloth: '#f2cdc6' } : DEFAULT_COLORS;
const ink = '#a89786';            // light mode: outline colour
const paper = light ? '#ffffff' : '#f2ece1';
// light mode: every outline first, then every fill on top, so only the
// outer edge of each part shows (no seams where discs and segments overlap)
const outline = (d, extra = '') => light ? `<path d="${d}" fill="none" stroke="${ink}" stroke-width="2.2" vector-effect="non-scaling-stroke" stroke-linejoin="round"${extra}/>` : '';
const px = 70;                  // px per head-unit, same for every part
const cellW = 190, cellH = 230, cols = 4;
let svg = '';
cells.forEach((c, i) => {
  const x0 = (i % cols) * cellW, y0 = Math.floor(i / cols) * cellH;
  // enlarged cells centre on the last shape (the hand); the forearm is cropped by the cell
  const focus = c.zoom > 1 ? c.shapes.slice(-2) : c.shapes;
  const b = bbox(focus.map((s) => s.clipPts || s.pts));
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
  const fit = c.zoom > 1 ? px * c.zoom : Math.min(px, (cellW - 30) / (b.x1 - b.x0 || 1), (cellH - 60) / (b.y1 - b.y0 || 1));
  const edges = c.shapes.filter((s) => !s.clipPts).map((s) => outline(pathD(s.pts))).join('');
  const g = edges + c.shapes.map((s, k) => {
    if (!s.clipPts) return `<path d="${pathD(s.pts)}" fill="${colors[s.role] || colors.body}"/>`;
    // clipped part (loincloth): show it as drawn, with the torso faintly behind
    const id = `clip${i}_${k}`;
    return `<path d="${pathD(s.clipPts)}" fill="${colors.body}" opacity="${light ? 0.5 : 0.15}"/>` +
      `<clipPath id="${id}"><path d="${pathD(s.clipPts)}"/></clipPath>` +
      `<path d="${pathD(s.pts)}" fill="${colors[s.role]}" clip-path="url(#${id})"/>` +
      outline(pathD(s.pts), ` clip-path="url(#${id})"`);
  }).join('');
  svg += `<rect x="${x0 + 6}" y="${y0 + 6}" width="${cellW - 12}" height="${cellH - 12}" rx="8" fill="${paper}"${light ? ' stroke="#e3dcd3"' : ''}/>`;
  svg += `<clipPath id="cell${i}"><rect x="${x0 + 6}" y="${y0 + 6}" width="${cellW - 12}" height="${cellH - 48}" rx="8"/></clipPath>`;
  svg += `<g clip-path="url(#cell${i})"><g transform="translate(${x0 + cellW / 2} ${y0 + (cellH - 30) / 2 + 4}) scale(${fit}) translate(${-cx} ${-cy})">${g}</g></g>`;
  svg += `<text x="${x0 + cellW / 2}" y="${y0 + cellH - 18}" font-family="sans-serif" font-size="14" fill="#6b6155" text-anchor="middle">${c.label}${fit < px ? ' (reduced)' : ''}</text>`;
});
const W = cols * cellW, H = Math.ceil(cells.length / cols) * cellH;
const title = light ? `<text x="12" y="22" font-family="sans-serif" font-size="15" fill="#6b6155">${id} · body parts (faces are drawn separately)</text>` : '';
const top = light ? 32 : 0;
const out = writeOut(`out/parts-${id}${light ? '-light' : ''}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H + top}"><rect width="${W}" height="${H + top}" fill="${light ? '#ffffff' : '#e7e5df'}"/>${title}<g transform="translate(0 ${top})">${svg}</g></svg>`);
rsvg(out, out.replace(/svg$/, 'png'), light ? ['-z', '2'] : []);
if (light) rsvg(out, out.replace(/svg$/, 'pdf'), ['-f', 'pdf']);
console.log(out.replace(/svg$/, 'png'));
