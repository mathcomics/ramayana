// Check imported faces: one US-letter page (8.5 × 11 in), every character in
// a 3 × 6 grid. Each cell: a front and a side figure, and close-ups of the
// head in front and side view with mouths 1–3.
//
//   node tools/face-sheet.mjs   ->  out/face-sheet.svg, .png, .pdf

import { renderFigure, buildShapes, characterLook } from '../src/figure.js';
import { loadAssets, writeOut, rsvg } from './lib.mjs';

const { characters: C, faces: F, poses: P, species: SPECIES } = loadAssets();
const cast = C.characters;

const front = (mouth) => ({ name: 'front', view: 'front', headView: 'front', mouth, spine: {},
  near: { arm: { shoulder: 25, hand: 'out' } }, far: { arm: { shoulder: 25, hand: 'out' } } });
const side = (mouth) => ({ ...P.find((p) => p.name === 'stand'), mouth });

// page: 850 × 1100 units = 8.5 × 11 in
const W = 850, H = 1100, M = 28, TOP = 50, COLS = 3;
const ROWS = Math.ceil(cast.length / COLS);
const cw = (W - 2 * M) / COLS, ch = (H - TOP - M) / ROWS;
const FIG = ch - 44;                  // full-figure height in units (room for the name)
const R = 0.125 * ch;                 // close-up circle radius
const font = 'font-family="Helvetica, Arial, sans-serif"';

let defs = '', s = '', clip = 0;
s += `<text x="${M}" y="32" ${font} font-size="16" fill="#333">Faces</text>`;
s += `<text x="${W - M}" y="32" ${font} font-size="10" fill="#888" text-anchor="end">figures: front, side (stand) · close-ups: front / side, mouths 1 2 3</text>`;

cast.forEach((c, i) => {
  const opts = characterLook(c, C.palette, F);
  const S = SPECIES[opts.species];
  const x0 = M + (i % COLS) * cw, y0 = TOP + Math.floor(i / COLS) * ch;
  s += `<rect x="${x0 + 3}" y="${y0 + 3}" width="${cw - 6}" height="${ch - 6}" rx="6" fill="#f6f1e8" stroke="#ddd3c3"/>`;
  s += `<text x="${x0 + 12}" y="${y0 + 20}" ${font} font-size="12" fill="#444">${c.name}${F.faces[c.id] ? '' : ' (NO FACE: every character needs one)'}</text>`;

  // two full figures, scaled to the cell height
  const ground = y0 + ch - 12;
  [[front(2), x0 + 0.2 * cw], [side(2), x0 + 0.45 * cw]].forEach(([pose, x]) => {
    const { bbox } = buildShapes(S, pose, opts.outfit, 'side', opts.face);
    const scale = FIG / (bbox.y1 - bbox.y0);
    s += renderFigure(S, pose, { ...opts, x, y: ground, scale }).svg;
  });

  // head close-ups: front (left column) and side (right column), mouths 1–3
  [front, side].forEach((make, col) => {
    [1, 2, 3].forEach((mouth, row) => {
      const pose = make(mouth);
      const { headAnchor } = buildShapes(S, pose, opts.outfit);
      const cx = x0 + cw - 12 - R - (1 - col) * 2.2 * R, cy = y0 + 14 + R + row * 2.2 * R;
      const scale = R / (0.82 * S.head.size);
      const id = `c${++clip}`;
      defs += `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>`;
      s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#ebe3d5"/>`;
      s += `<g clip-path="url(#${id})">${renderFigure(S, pose, { ...opts,
        x: cx - headAnchor.at[0] * scale, y: cy - headAnchor.at[1] * scale, scale }).svg}</g>`;
    });
  });
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8.5in" height="11in" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs><rect width="${W}" height="${H}" fill="#fff"/>${s}</svg>`;
const svgPath = writeOut('out/face-sheet.svg', svg);
rsvg(svgPath, svgPath.replace(/svg$/, 'png'), ['-w', String(W * 2)]);
rsvg(svgPath, svgPath.replace(/svg$/, 'pdf'), ['-f', 'pdf']);
console.log('out/face-sheet.png, out/face-sheet.pdf');
