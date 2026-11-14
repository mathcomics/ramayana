// The pose catalogue: every pose the panels use, plus one for each base and
// gesture no panel uses yet (tools/lib.mjs shownPairs), as a thumbnail
// pair (side + front) with its name, the panels using it, what touches the
// ground and its story moments (from its base and gesture), grouped by
// base. For picking poses for panels (docs/design/pose-picking.md).
//
//   node tools/pose-catalogue.mjs [--who rama] [--scale 16] [--zoom 2]
//
// Output: out/pose-catalogue.svg (+ .png).

import { renderFigure, characterLook } from '../src/figure.js';
import { splitPoseName } from '../src/compose.js';
import { loadAssets, loadPoseData, loadPoses, panelPairs, shownPairs, poseInfo, writeOut, toPng, cliArgs, characterById, escXml as esc } from './lib.mjs';

const args = cliArgs();
const scale = args.num('--scale', 16);
const zoom = args.num('--zoom', 1);

const A = loadAssets();
const index = loadPoseData();
const used = panelPairs(index);
const POSES = loadPoses(A.species, shownPairs(index, used));
const { look, species } = characterById(A, args.str('--who', 'rama'), characterLook);

const cols = 3, cellW = scale * 13, figH = scale * 8.2, textH = scale * 1.9, headH = scale * 1.6;
const font = 'font-family="sans-serif"';

// group by base: every pose is named <base>-<gesture>, so the first word
// is its base; legacy family words only group the wanted entries
const BASES = ['stand', 'walk', 'run', 'leap', 'crouch', 'bend', 'crawl', 'kneel', 'lunge', 'sit', 'lie', 'fall'];
for (const b of Object.keys(index.bases)) if (!BASES.includes(b)) BASES.push(b);
const wanted = Object.entries(index.wanted);
const baseOf = (n) => splitPoseName(n)[0];
const groups = BASES.map((b) => [b, POSES.filter((p) => baseOf(p.name) === b)]).filter(([b, ps]) => ps.length || wanted.some(([n]) => baseOf(n) === b));

let y = 0, body = '';
const W = cols * cellW;
for (const [base, poses] of groups) {
  const want = wanted.filter(([n]) => baseOf(n) === base).map(([n]) => n);
  body += `<text x="${scale * 0.5}" y="${y + headH * 0.75}" ${font} font-weight="bold" font-size="${scale * 0.8}" fill="#4a4033">${base}</text>`;
  if (want.length) body += `<text x="${W - scale * 0.5}" y="${y + headH * 0.75}" ${font} font-size="${scale * 0.5}" fill="#b0563a" text-anchor="end">wanted: ${esc(want.join(', '))}</text>`;
  body += `<line x1="0" x2="${W}" y1="${y + headH}" y2="${y + headH}" stroke="#4a4033" stroke-width="1"/>`;
  y += headH;
  if (!poses.length) { body += `<text x="${scale * 0.5}" y="${y + scale * 1.1}" ${font} font-size="${scale * 0.55}" fill="#b0563a">no poses yet</text>`; y += scale * 1.8; continue; }
  poses.forEach((pose, i) => {
    const cx = (i % cols) * cellW, cy = y + Math.floor(i / cols) * (figH + textH);
    const groundY = cy + figH - scale * 0.6;
    const e = poseInfo(index, pose.name), n = used[pose.name]?.length || 0;
    body += `<line x1="${cx + 8}" x2="${cx + cellW - 8}" y1="${groundY}" y2="${groundY}" stroke="#c9bfae" stroke-width="1"/>`;
    body += renderFigure(species, pose, { ...look, x: cx + cellW * 0.27, y: groundY, scale, id: `s${base}${i}` }).svg;
    body += renderFigure(species, pose, { ...look, x: cx + cellW * 0.73, y: groundY, scale, view: 'front', id: `f${base}${i}` }).svg;
    body += `<text x="${cx + cellW / 2}" y="${groundY + scale * 0.95}" ${font} font-weight="bold" font-size="${scale * 0.6}" fill="#4a4033" text-anchor="middle">${esc(pose.name)}${n ? ` (${n})` : ''}</text>`;
    body += `<text x="${cx + cellW / 2}" y="${groundY + scale * 1.65}" ${font} font-size="${scale * 0.48}" fill="#7a6e5e" text-anchor="middle">${esc(e.ground)} · ${esc(e.use.join(', '))}</text>`;
  });
  y += Math.ceil(poses.length / cols) * (figH + textH) + scale * 0.6;
}

const H = Math.ceil(y);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
  `<rect width="${W}" height="${H}" fill="#f4efe6"/>${body}</svg>`;
toPng(writeOut('out/pose-catalogue.svg', svg), zoom);
