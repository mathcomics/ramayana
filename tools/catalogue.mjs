// The base and gesture catalogues (tools/base-catalogue.mjs,
// tools/gesture-catalogue.mjs): every base or gesture, alphabetically,
// drawn as a full figure (side + front) composed as a pose is
// (src/compose.js); each cell names the poses that use it. Writes
// out/<kind>-catalogue.{svg,png,html}; the page is published as an
// artifact (URL in CLAUDE.md).
//
//   node tools/<kind>-catalogue.mjs [--who rama] [--zoom 2]

import { renderFigure, characterLook } from '../src/figure.js';
import { poseComposer, splitPoseName } from '../src/compose.js';
import { loadAssets, loadPoseData, writeOut, toPng, cliArgs, characterById } from './lib.mjs';

const KINDS = {
  // each base under the hang gesture (both arms hanging), so a gesture's
  // own solves never show here
  base: { data: 'bases', half: 0, pose: (n) => `${n}-hang`, id: 'b', pad: 10, title: 'Base Catalogue',
    intro: (n, poses) => `The ${n} bases (distinct lower bodies) of the ${poses} poses, from
<code>data/bases.json</code>, alphabetical, each drawn with the hang gesture.` },
  // each gesture on the step base: a bow's lean and joined palms' solves included
  gesture: { data: 'gestures', half: 1, pose: (n) => `step-${n}`, id: 'g', pad: 14, title: 'Gesture Catalogue',
    intro: (n, poses) => `The ${n} gestures (distinct upper bodies) of the ${poses} poses, from
<code>data/gestures.json</code>, alphabetical, each drawn on the step base.` },
};

export function catalogue(kind) {
  const K = KINDS[kind];
  const args = cliArgs();
  const zoom = args.num('--zoom', 2);
  const A = loadAssets();
  const { look, species } = characterById(A, args.str('--who', 'rama'), characterLook);

  const D = loadPoseData();
  const compose = poseComposer(A.species.male);
  const names = Object.keys(D.poses);
  const cells = Object.entries(D[K.data]).sort(([a], [b]) => a.localeCompare(b)).map(([name, e]) => ({
    name, desc: e.desc, pose: compose(D.bases, D.gestures, K.pose(name)),
    members: names.filter((n) => splitPoseName(n)[K.half] === name),
  }));
  console.log(`${A.poses.length} poses -> ${cells.length} ${K.data}`);
  for (const c of cells) console.log('  ' + c.name.padEnd(K.pad) + ' <- ' + c.members.join(', '));

  const scale = 20, cols = 4;
  const cellW = scale * 13, cellH = scale * 9.6;
  const rows = Math.ceil(cells.length / cols);
  const W = cols * cellW, H = rows * cellH;
  let body = '';
  cells.forEach((c, i) => {
    const cx = (i % cols) * cellW, cy = Math.floor(i / cols) * cellH;
    const groundY = cy + cellH - scale * 2.6;
    body += `<line x1="${cx + 8}" x2="${cx + cellW - 8}" y1="${groundY}" y2="${groundY}" stroke="#c9bfae" stroke-width="1"/>`;
    body += renderFigure(species, c.pose, { ...look, id: `${K.id}${i}s`, x: cx + cellW * 0.27, y: groundY, scale }).svg;
    body += renderFigure(species, c.pose, { ...look, id: `${K.id}${i}f`, x: cx + cellW * 0.73, y: groundY, scale, view: 'front' }).svg;
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
  toPng(writeOut(`out/${kind}-catalogue.svg`, svg), zoom, { tagZoom: false });

  const html = `<title>${K.title}</title>
<style>
:root { --bg: #eef0ee; --fg: #1d2420; --muted: #66706a; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #141816; --fg: #e6ebe7; --muted: #9aa49e; } }
:root[data-theme="dark"] { --bg: #141816; --fg: #e6ebe7; --muted: #9aa49e; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 14px/1.4 system-ui, sans-serif; padding: 12px 16px 48px; }
h1 { font-size: 1.1rem; margin: 0 0 2px; }
p { color: var(--muted); font-size: 12.5px; max-width: 60ch; margin: 0 0 12px; }
svg { display: block; width: 100%; height: auto; max-width: ${W}px; border-radius: 8px; }
</style>
<h1>${K.title}</h1>
<p>${K.intro(cells.length, A.poses.length)}
A cell named "x&nbsp;(n)" is used by the n poses listed under it.
Regenerate: <code>node tools/${kind}-catalogue.mjs</code>.</p>
${svg.replace(/ width="\d+" height="\d+">/, '>')}`;
  console.log(writeOut(`out/${kind}-catalogue.html`, html));
}
