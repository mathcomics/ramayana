// The base and gesture catalogues (tools/base-catalogue.mjs,
// tools/gesture-catalogue.mjs): every base or gesture, alphabetically,
// drawn as a full figure (side + front) composed as a pose is
// (src/compose.js); each cell gives its finding fields and the poses the
// panels use it in. Writes
// out/<kind>-catalogue.{svg,png,html}; the page is published as an
// artifact (URL in CLAUDE.md).
//
//   node tools/<kind>-catalogue.mjs [--who rama] [--zoom 2]

import { renderFigure, characterLook } from '../src/figure.js';
import { poseComposer, splitPoseName } from '../src/compose.js';
import { loadAssets, loadPoseData, panelPairs, writeOut, toPng, cliArgs, characterById } from './lib.mjs';

const KINDS = {
  // each base under the hang gesture (both arms hanging), so a gesture's
  // own solves never show here
  base: { data: 'bases', half: 0, pose: (n) => `${n}-hang`, id: 'b', pad: 10, title: 'Base Catalogue',
    find: (e) => `${e.ground} · ${e.use.join(', ') || '–'}`,
    intro: (n) => `The ${n} bases (distinct lower bodies), from
<code>data/bases.json</code>, alphabetical, each drawn with the hang gesture; under each, what touches
the ground and its story moments.` },
  // each gesture on the step base: a bow's lean and joined palms' solves included
  gesture: { data: 'gestures', half: 1, pose: (n) => `step-${n}`, id: 'g', pad: 14, title: 'Gesture Catalogue',
    find: (e) => `hold ${e.hold.join(', ') || 'none'} · ${e.use.join(', ') || '–'}`,
    intro: (n) => `The ${n} gestures (distinct upper bodies), from
<code>data/gestures.json</code>, alphabetical, each drawn on the step base; under each, the hands free
to hold a prop and its story moments.` },
};

export function catalogue(kind) {
  const K = KINDS[kind];
  const args = cliArgs();
  const zoom = args.num('--zoom', 2);
  const A = loadAssets();
  const { look, species } = characterById(A, args.str('--who', 'rama'), characterLook);

  const D = loadPoseData();
  const compose = poseComposer(A.species.male);
  const names = Object.keys(panelPairs(D)).sort();
  const cells = Object.entries(D[K.data]).sort(([a], [b]) => a.localeCompare(b)).map(([name, e]) => ({
    name, desc: e.desc, find: K.find(e), pose: compose(D.bases, D.gestures, K.pose(name)),
    members: names.filter((n) => splitPoseName(n)[K.half] === name),
  }));
  console.log(`${cells.length} ${K.data}; ${names.length} pairs in panels`);
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
    body += text(cy + cellH - scale * 2.2, c.name + (c.members.length ? ` (${c.members.length})` : ''), scale * 0.55, 600);
    body += text(cy + cellH - scale * 1.65, c.find, scale * 0.38);
    // the member poses, a line of up to three names at a time
    c.members.reduce((lines, m) => {
      if (!lines.length || lines[lines.length - 1].length === 3) lines.push([]);
      lines[lines.length - 1].push(m);
      return lines;
    }, []).forEach((line, li) => { body += text(cy + cellH - scale * (1.1 - li * 0.45), line.join('  '), scale * 0.34); });
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
<p>${K.intro(cells.length)}
A cell named "x&nbsp;(n)" is used in the panels by the n poses listed under it.
Regenerate: <code>node tools/${kind}-catalogue.mjs</code>.</p>
${svg.replace(/ width="\d+" height="\d+">/, '>')}`;
  console.log(writeOut(`out/${kind}-catalogue.html`, html));
}
