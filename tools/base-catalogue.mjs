// Every base (distinct lower body) from data/pose-index.json `bases`,
// drawn as a full figure with stand's upper body on it (side + front),
// alphabetically. Part of the pose composition work
// (docs/design/pose-picking.md).
//
//   node tools/base-catalogue.mjs [--who rama] [--zoom 2]
//
// A base = both legs + spine.lean + tail, named by the artist (one word,
// desc in the index); its cell is drawn from the first pose listed and
// names the rest. Every pose belongs to exactly one base (npm test).

import { renderFigure, characterLook } from '../src/figure.js';
import { loadAssets, writeOut, rsvg, json } from './lib.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const zoom = Number(opt('--zoom', 2));

const A = loadAssets();
const who = A.characters.characters.find((c) => c.id === opt('--who', 'rama'));
if (!who) throw new Error(`no character "${opt('--who', 'rama')}"`);
const look = characterLook(who, A.characters.palette, A.faces);
const species = A.species[who.species];

const clone = (o) => JSON.parse(JSON.stringify(o));
const stand = A.poses.find((p) => p.name === 'step-hang');
const composeBase = (src) => ({
  name: src.name, mouth: stand.mouth,
  spine: { ...clone(stand.spine), lean: src.spine.lean },
  right: { arm: clone(stand.right.arm), leg: clone(src.right.leg) },
  left: { arm: clone(stand.left.arm), leg: clone(src.left.leg) },
  tail: clone(src.tail),
});

const BASES = json('data/pose-index.json').bases;
const cells = Object.entries(BASES).sort(([a], [b]) => a.localeCompare(b)).map(([name, e]) => {
  const rep = A.poses.find((p) => p.name === e.poses[0]);
  if (!rep) throw new Error(`base ${name}: no pose ${e.poses[0]}`);
  return { name, desc: e.desc, pose: composeBase(rep), members: e.poses };
});

console.log(`${A.poses.length} poses -> ${cells.length} bases`);
for (const c of cells) console.log('  ' + c.name.padEnd(10) + ' <- ' + c.members.join(', '));

const scale = 20, cols = 4;
const cellW = scale * 13, cellH = scale * 9.6;
const rows = Math.ceil(cells.length / cols);
const W = cols * cellW, H = rows * cellH;
let body = '';
cells.forEach((c, i) => {
  const cx = (i % cols) * cellW, cy = Math.floor(i / cols) * cellH;
  const groundY = cy + cellH - scale * 2.6;
  body += `<line x1="${cx + 8}" x2="${cx + cellW - 8}" y1="${groundY}" y2="${groundY}" stroke="#c9bfae" stroke-width="1"/>`;
  body += renderFigure(species, c.pose, { ...look, id: `b${i}s`, x: cx + cellW * 0.27, y: groundY, scale }).svg;
  body += renderFigure(species, c.pose, { ...look, id: `b${i}f`, x: cx + cellW * 0.73, y: groundY, scale, view: 'front' }).svg;
  const text = (y, t, size, weight = 400) =>
    `<text x="${cx + cellW / 2}" y="${y}" font-family="sans-serif" font-size="${size}" font-weight="${weight}" fill="#7a6e5e" text-anchor="middle">${t}</text>`;
  body += text(cy + cellH - scale * 1.8, c.name + (c.members.length > 1 ? ` (${c.members.length})` : ''), scale * 0.55, 600);
  // the member poses, a line of up to three names at a time
  c.members.reduce((lines, m) => {
    if (!lines.length || lines[lines.length - 1].length === 3) lines.push([]);
    lines[lines.length - 1].push(m);
    return lines;
  }, []).forEach((line, li) => { body += text(cy + cellH - scale * (1.25 - li * 0.5), line.join('  '), scale * 0.38); });
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
  `<rect width="${W}" height="${H}" fill="#f4efe6"/>${body}</svg>`;
const svgPath = writeOut('out/base-catalogue.svg', svg);
const png = svgPath.replace(/\.svg$/, '.png');
rsvg(svgPath, png, ['-z', String(zoom)]);
console.log(png);

// a page of the same sheet, published as an artifact (URL in CLAUDE.md)
const html = `<title>Base Catalogue</title>
<style>
:root { --bg: #eef0ee; --fg: #1d2420; --muted: #66706a; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #141816; --fg: #e6ebe7; --muted: #9aa49e; } }
:root[data-theme="dark"] { --bg: #141816; --fg: #e6ebe7; --muted: #9aa49e; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 14px/1.4 system-ui, sans-serif; padding: 12px 16px 48px; }
h1 { font-size: 1.1rem; margin: 0 0 2px; }
p { color: var(--muted); font-size: 12.5px; max-width: 60ch; margin: 0 0 12px; }
svg { display: block; width: 100%; height: auto; max-width: ${W}px; border-radius: 8px; }
</style>
<h1>Base Catalogue</h1>
<p>The ${cells.length} bases (distinct lower bodies) of the ${A.poses.length} poses, from
<code>bases</code> in the pose index, alphabetical, each drawn with stand's upper body.
A cell named "x&nbsp;(n)" carries the n poses listed under it.
Regenerate: <code>node tools/base-catalogue.mjs</code>.</p>
${svg.replace(/ width="\d+" height="\d+">/, '>')}`;
console.log(writeOut('out/base-catalogue.html', html));
