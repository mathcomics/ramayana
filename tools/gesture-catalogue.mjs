// Every gesture (distinct upper body) from data/pose-index.json
// `gestures`, drawn as a full figure on the step base (side + front),
// alphabetically. Part of the pose composition work
// (docs/proposals/2026-11-07-pose-composition.md).
//
//   node tools/gesture-catalogue.mjs [--who rama] [--zoom 2]
//
// A gesture = both arms (held prop included) + spine.chest/neck/head +
// mouth, named by the artist (one word, desc in the index); its cell is
// drawn from the first pose listed and names the rest. Every pose
// belongs to exactly one gesture (npm test).

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
const index = json('data/pose-index.json');
// the step base's drawn legs: its first pose
const stepPose = A.poses.find((p) => p.name === index.bases.step.poses[0]);
const composeGesture = (src) => ({
  name: src.name, mouth: src.mouth,
  spine: { lean: stepPose.spine.lean, chest: src.spine.chest, neck: src.spine.neck, head: src.spine.head },
  right: { arm: clone(src.right.arm), leg: clone(stepPose.right.leg) },
  left: { arm: clone(src.left.arm), leg: clone(stepPose.left.leg) },
  tail: clone(stepPose.tail),
});

const cells = Object.entries(index.gestures).sort(([a], [b]) => a.localeCompare(b)).map(([name, e]) => {
  const rep = A.poses.find((p) => p.name === e.poses[0]);
  if (!rep) throw new Error(`gesture ${name}: no pose ${e.poses[0]}`);
  return { name, desc: e.desc, pose: composeGesture(rep), members: e.poses };
});

console.log(`${A.poses.length} poses -> ${cells.length} gestures`);
for (const c of cells) console.log('  ' + c.name.padEnd(14) + ' <- ' + c.members.join(', '));

const scale = 20, cols = 4;
const cellW = scale * 13, cellH = scale * 9.6;
const rows = Math.ceil(cells.length / cols);
const W = cols * cellW, H = rows * cellH;
let body = '';
cells.forEach((c, i) => {
  const cx = (i % cols) * cellW, cy = Math.floor(i / cols) * cellH;
  const groundY = cy + cellH - scale * 2.6;
  body += `<line x1="${cx + 8}" x2="${cx + cellW - 8}" y1="${groundY}" y2="${groundY}" stroke="#c9bfae" stroke-width="1"/>`;
  body += renderFigure(species, c.pose, { ...look, id: `g${i}s`, x: cx + cellW * 0.27, y: groundY, scale }).svg;
  body += renderFigure(species, c.pose, { ...look, id: `g${i}f`, x: cx + cellW * 0.73, y: groundY, scale, view: 'front' }).svg;
  const text = (y, t, size, weight = 400) =>
    `<text x="${cx + cellW / 2}" y="${y}" font-family="sans-serif" font-size="${size}" font-weight="${weight}" fill="#7a6e5e" text-anchor="middle">${t}</text>`;
  body += text(cy + cellH - scale * 1.8, c.name + (c.members.length > 1 ? ` (${c.members.length})` : ''), scale * 0.55, 600);
  c.members.reduce((lines, m) => {
    if (!lines.length || lines[lines.length - 1].length === 3) lines.push([]);
    lines[lines.length - 1].push(m);
    return lines;
  }, []).forEach((line, li) => { body += text(cy + cellH - scale * (1.25 - li * 0.5), line.join('  '), scale * 0.38); });
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
  `<rect width="${W}" height="${H}" fill="#f4efe6"/>${body}</svg>`;
const svgPath = writeOut('out/gesture-catalogue.svg', svg);
const png = svgPath.replace(/\.svg$/, '.png');
rsvg(svgPath, png, ['-z', String(zoom)]);
console.log(png);

// a page of the same sheet, published as an artifact (URL in CLAUDE.md)
const html = `<title>Gesture Catalogue</title>
<style>
:root { --bg: #eef0ee; --fg: #1d2420; --muted: #66706a; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #141816; --fg: #e6ebe7; --muted: #9aa49e; } }
:root[data-theme="dark"] { --bg: #141816; --fg: #e6ebe7; --muted: #9aa49e; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 14px/1.4 system-ui, sans-serif; padding: 12px 16px 48px; }
h1 { font-size: 1.1rem; margin: 0 0 2px; }
p { color: var(--muted); font-size: 12.5px; max-width: 60ch; margin: 0 0 12px; }
svg { display: block; width: 100%; height: auto; max-width: ${W}px; border-radius: 8px; }
</style>
<h1>Gesture Catalogue</h1>
<p>The ${cells.length} gestures (distinct upper bodies) of the ${A.poses.length} poses, from
<code>gestures</code> in the pose index, alphabetical, each drawn on the step base.
A cell named "x&nbsp;(n)" carries the n poses listed under it.
Regenerate: <code>node tools/gesture-catalogue.mjs</code>.</p>
${svg.replace(/ width="\d+" height="\d+">/, '>')}`;
console.log(writeOut('out/gesture-catalogue.html', html));
