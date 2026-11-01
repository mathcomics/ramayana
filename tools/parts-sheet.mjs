// Draw every body part separately, all at one scale, for inspection.
//
//   node tools/parts-sheet.mjs [species]   ->  out/parts-<species>.png
//
// Side-view parts use a near-straight standing pose; front-view head and
// torso are shown too, plus all three hands and all three mouths.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { anatomy, eyeColor, DEFAULT_COLORS } from '../src/figure.js';
import { pathD, bbox } from '../src/geom.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const id = process.argv[2] || 'monkey';
const S = JSON.parse(readFileSync(join(root, 'data/species', `${id}.json`), 'utf8'));

const side = { view: 'side', spine: {}, near: { arm: { shoulder: 0, elbow: 25 }, leg: { hip: 0, knee: 25 } }, tail: { lift: 30, curl: 200 } };
const front = { view: 'front', spine: {} };
const cells = [];
const add = (label, shapes) => cells.push({ label, shapes });

const A = anatomy(S, side), F = anatomy(S, front);
add('head · side', A.head);
add('head · front', F.head);
for (const m of [1, 2, 3]) add(`mouth ${m}`, anatomy(S, { ...front, mouth: m }).head);
add('neck', A.neck);
add('torso · side', A.torso);
add('torso · front', F.torso);
add('upper arm', A['upper arm']);
add('forearm', A.forearm);
for (const h of ['fist', 'out', 'in']) add(`hand · ${h}`, anatomy(S, { ...side, near: { ...side.near, arm: { ...side.near.arm, hand: h } } }).hand);
add('thigh', A.thigh);
add('shin', A.shin);
add('foot', A.foot);
if (A.tail) add('tail', A.tail);
add('loincloth · front (torso faint)', F.loincloth);
add('loincloth · side (torso faint)', A.loincloth);

const colors = { ...DEFAULT_COLORS, eye: eyeColor(DEFAULT_COLORS.body) };
const px = 70;                  // px per head-unit, same for every part
const cellW = 190, cellH = 230, cols = 4;
let svg = '';
cells.forEach((c, i) => {
  const x0 = (i % cols) * cellW, y0 = Math.floor(i / cols) * cellH;
  const b = bbox(c.shapes.map((s) => s.clipPts || s.pts));
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
  const fit = Math.min(px, (cellW - 30) / (b.x1 - b.x0 || 1), (cellH - 60) / (b.y1 - b.y0 || 1));
  const g = c.shapes.map((s, k) => {
    if (s.open) return `<path d="${pathD(s.pts, false)}" fill="none" stroke="${colors.eye}" stroke-width="0.06"/>`;
    if (!s.clipPts) return `<path d="${pathD(s.pts)}" fill="${colors[s.role] || colors.body}"/>`;
    // clipped part (loincloth): show it as drawn, with the torso faintly behind
    const id = `clip${i}_${k}`;
    return `<path d="${pathD(s.clipPts)}" fill="${colors.body}" opacity="0.15"/>` +
      `<clipPath id="${id}"><path d="${pathD(s.clipPts)}"/></clipPath>` +
      `<path d="${pathD(s.pts)}" fill="${colors[s.role]}" clip-path="url(#${id})"/>`;
  }).join('');
  svg += `<rect x="${x0 + 6}" y="${y0 + 6}" width="${cellW - 12}" height="${cellH - 12}" rx="8" fill="#f2ece1"/>`;
  svg += `<g transform="translate(${x0 + cellW / 2} ${y0 + (cellH - 30) / 2 + 4}) scale(${fit}) translate(${-cx} ${-cy})">${g}</g>`;
  svg += `<text x="${x0 + cellW / 2}" y="${y0 + cellH - 18}" font-family="sans-serif" font-size="14" fill="#6b6155" text-anchor="middle">${c.label}${fit < px ? ' (reduced)' : ''}</text>`;
});
const W = cols * cellW, H = Math.ceil(cells.length / cols) * cellH;
mkdirSync(join(root, 'out'), { recursive: true });
const out = join(root, 'out', `parts-${id}`);
writeFileSync(out + '.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#e7e5df"/>${svg}</svg>`);
execFileSync('rsvg-convert', ['-o', out + '.png', out + '.svg']);
console.log(out + '.png');
