// Every distinct lower body (base) in the pose collection, drawn as a full
// figure with stand's upper body on it (side + front), for the pose
// composition work (docs/proposals/2026-11-07-pose-composition.md).
//
//   node tools/base-catalogue.mjs [--who rama] [--threshold 0.2] [--zoom 2]
//
// A base = both legs + spine.lean + tail. Bases whose rendered leg joints
// (hips, knees, ankles, foot bottoms) lie within --threshold head-units of
// each other on average are one cell; the cell is named by its plainest
// member and lists the rest. The full grouping is printed.

import { renderFigure, characterLook } from '../src/figure.js';
import { loadAssets, writeOut, rsvg } from './lib.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const TH = Number(opt('--threshold', 0.2));
const zoom = Number(opt('--zoom', 2));

const A = loadAssets();
const who = A.characters.characters.find((c) => c.id === opt('--who', 'rama'));
if (!who) throw new Error(`no character "${opt('--who', 'rama')}"`);
const look = characterLook(who, A.characters.palette, A.faces);
const species = A.species[who.species];

const clone = (o) => JSON.parse(JSON.stringify(o));
const stand = A.poses.find((p) => p.name === 'stand');
const composeBase = (src) => ({
  name: src.name, mouth: stand.mouth,
  spine: { ...clone(stand.spine), lean: src.spine.lean },
  right: { arm: clone(stand.right.arm), leg: clone(src.right.leg) },
  left: { arm: clone(stand.left.arm), leg: clone(src.left.leg) },
  tail: clone(src.tail),
});

// distance between two bases: mean distance of the leg joints, rendered
const bases = A.poses.map((p) => {
  const pose = composeBase(p);
  const J = renderFigure(species, pose, { x: 0, y: 0, scale: 1, facing: 1 }).joints;
  return { name: p.name, pose, pts: ['near', 'far'].flatMap((s) => [J[s].hp, J[s].Kn, J[s].A, J[s].low]) };
});
const dist = (a, b) => a.pts.reduce((s, p, i) => s + Math.hypot(p[0] - b.pts[i][0], p[1] - b.pts[i][1]), 0) / a.pts.length;
// Merges the artist has called, beyond what the distance sees (a deeper
// stride is still the same stance): each entry becomes one cell, named
// `name` (the base's own one-word name) and drawn from its first pose.
const CURATED = [
  { name: 'lunge', poses: ['lunge', 'lunge-sword-down', 'lunge-sword-low', 'lunge-sword-forward'] },   // 2026-11-07
  { name: 'stepback', poses: ['stand-step-back', 'stand-arm-back'] },                                  // 2026-11-07
  // 2026-11-07, artist: "step" is the small open stance — the stand pose's
  // own legs, the sword stances (their slight stride/turn doesn't earn a
  // base; a stance apart needs a real lean, as stand-arm-over-face has)
  // and the archery stance; "stand" is the true neutral, feet together
  // (stand-point-up's legs).
  { name: 'step', poses: ['stand', 'stand-sword-up', 'stand-sword-waist', 'stand-sword-forward',
    'stand-sword-shoulder', 'stand-sword-across-head', 'stand-sword-behind-head', 'stand-sword-hip',
    'stand-point', 'stand-bow-draw', 'stand-bow-release', 'stand-bow-draw-high'] },
  { name: 'stand', poses: ['stand-point-up'] },
  // 2026-11-07, artist's base names for the leaned stances
  { name: 'stepwide', poses: ['stand-sword-back'] },
  { name: 'leanback', poses: ['stand-lean-back'] },
  { name: 'leanfront', poses: ['stand-fists-up'] },
  { name: 'stepturn', poses: ['stand-arm-over-face'] },
];
const groups = CURATED.map((c) => {
  const g = c.poses.map((n) => bases.find((b) => b.name === n)).filter(Boolean);
  g.label = c.name;
  return g;
});
const curatedNames = new Set(CURATED.flatMap((c) => c.poses));
for (const b of bases) {
  if (curatedNames.has(b.name)) continue;
  const g = groups.find((g) => g.some((m) => dist(m, b) < TH));
  if (g) g.push(b); else groups.push([b]);
}

// cell name: a plain base word if a member is one, else the shortest name
const BASE_ORDER = ['stand', 'walk', 'run', 'leap', 'crouch', 'bend', 'crawl', 'kneel', 'lunge', 'sit', 'lie', 'fall'];
const baseWord = (n) => n.split('-')[0];
for (const g of groups) if (!g.label) g.sort((a, b) => a.name.length - b.name.length || a.name.localeCompare(b.name));
groups.sort((a, b) => BASE_ORDER.indexOf(baseWord(a[0].name)) - BASE_ORDER.indexOf(baseWord(b[0].name)) || a[0].name.localeCompare(b[0].name));
// a named (curated) cell lists every member pose; an automatic one is
// named by its first member and lists the rest
const cellName = (g) => g.label || g[0].name;
const members = (g) => (g.label ? g.filter((m) => m.name !== g.label) : g.slice(1));

console.log(`${bases.length} poses -> ${groups.length} bases (threshold ${TH})`);
for (const g of groups) console.log('  ' + cellName(g) + (members(g).length ? `  <- ${members(g).map((m) => m.name).join(', ')}` : ''));

const scale = 20, cols = 4;
const cellW = scale * 13, cellH = scale * 9.6;
const rows = Math.ceil(groups.length / cols);
const W = cols * cellW, H = rows * cellH;
let body = '';
groups.forEach((g, i) => {
  const cx = (i % cols) * cellW, cy = Math.floor(i / cols) * cellH;
  const groundY = cy + cellH - scale * 2.6;
  body += `<line x1="${cx + 8}" x2="${cx + cellW - 8}" y1="${groundY}" y2="${groundY}" stroke="#c9bfae" stroke-width="1"/>`;
  body += renderFigure(species, g[0].pose, { ...look, id: `b${i}s`, x: cx + cellW * 0.27, y: groundY, scale }).svg;
  body += renderFigure(species, g[0].pose, { ...look, id: `b${i}f`, x: cx + cellW * 0.73, y: groundY, scale, view: 'front' }).svg;
  const text = (y, t, size, weight = 400) =>
    `<text x="${cx + cellW / 2}" y="${y}" font-family="sans-serif" font-size="${size}" font-weight="${weight}" fill="#7a6e5e" text-anchor="middle">${t}</text>`;
  body += text(cy + cellH - scale * 1.8, cellName(g) + (members(g).length ? ` (+${members(g).length})` : ''), scale * 0.55, 600);
  // the member poses, a line of up to three names at a time
  members(g).reduce((lines, m) => {
    if (!lines.length || lines[lines.length - 1].length === 3) lines.push([]);
    lines[lines.length - 1].push(m.name);
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
<p>Every distinct lower body in the pose collection (${bases.length} poses &rarr; ${groups.length} bases,
threshold ${TH} head-units on the leg joints), drawn with stand's upper body. A cell named
"x&nbsp;(+n)" also carries the poses listed under it. Regenerate: <code>node tools/base-catalogue.mjs</code>.</p>
${svg.replace(/ width="\d+" height="\d+">/, '>')}`;
console.log(writeOut('out/base-catalogue.html', html));
