// Export one figure as an editable SVG: every body part is ONE <path>
// (its discs and segments merged), named by part, in draw order, assembled
// on the skeleton exactly as the renderer places it. The character's drawn
// face goes in its own layer. For drawing corrections in Inkscape.
//
//   node tools/figure-svg.mjs <character> [--pose name | --pose-file pose.json] [--view side|front|both]
//     -> out/figure-<character>-<pose>-<view>.svg
//
// Units: 100 px = 1 head-unit; the ground is y = 0 (the lowest point), the
// figure centred on x = 0; it faces right.
import { readFileSync } from 'node:fs';
import { buildShapes, characterLook, normalizePose } from '../src/figure.js';
import { headView } from '../src/headturn.js';
import { loadAssets, writeOut } from './lib.mjs';

const args = process.argv.slice(2);
const flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const who = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--')) || 'rama';
const A = loadAssets();
const c = A.characters.characters.find((x) => x.id === who);
if (!c) throw new Error(`unknown character "${who}"`);
const pose = flag('--pose-file') ? JSON.parse(readFileSync(flag('--pose-file'), 'utf8'))
  : A.poses.find((p) => p.name === (flag('--pose') || 'step-hang'));
if (!pose) throw new Error(`unknown pose "${flag('--pose')}"`);
const views = (flag('--view') || 'both') === 'both' ? ['side', 'front'] : [flag('--view')];
const look = characterLook(c, A.characters.palette, A.faces);
const S = A.species[look.species];
const K = 100;                                         // px per head-unit
const f = (v) => +(v * K).toFixed(2);

// A shape as path data in px: its drawn curves (scaled), or its outline
// (a held prop's line-drawn parts); every outline wound the same way, so
// overlapping pieces of one part merge (nonzero fill).
const area = (pts) => pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0);
const poly = (pts) => { const o = area(pts) < 0 ? [...pts].reverse() : pts; return `M${o.map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}Z`; };
const curves = (segs) => `M${f(segs[0][0][0])} ${f(segs[0][0][1])}` + segs.map(([, b, c, d]) => `C${[b, c, d].map((q) => `${f(q[0])} ${f(q[1])}`).join(' ')}`).join('') + 'Z';
const dOf = (s) => (s.segs ? curves(s.segs) : poly(s.pts));
const colorOf = (role) => (role === 'cloth' ? look.colors.cloth : role === 'prop' ? '#241f1c' : look.colors.body);
const mouth = normalizePose(pose).mouth;

for (const view of views) {
  const { shapes, headAnchor, bbox: bb } = buildShapes(S, pose, look.outfit, view, look.bodyScale, look.who);
  // the face as the renderer draws it: the nearest drawn view, placed by its matrix
  const hv = look.face && headView(headAnchor.R, look.sideOnly ? ['side'] : Object.keys(look.face));
  const face = hv && look.face[hv.view];
  // group shapes into parts, keeping draw order (a part's place = its first shape)
  const parts = [];
  for (const s of shapes) {
    if (s.hairBody) continue;
    const key = `${s.part}:${s.role}`;
    let p = parts.find((q) => q.key === key);
    if (!p) parts.push(p = { key, name: s.role === 'cloth' && s.part.endsWith('thigh') ? `${s.part}-cloth` : s.part, role: s.role, shapes: [] });
    p.shapes.push(s);
  }
  const faceAt = hv && `matrix(${hv.m.map((v) => +v.toFixed(4)).join(' ')} ${f(headAnchor.at[0])} ${f(headAnchor.at[1])}) scale(${K})`;
  // the face's back layer (hair behind the head) goes behind the whole body, as rendered
  let body = face?.back ? `  <g id="face-back" inkscape:label="face back (drawn, do not edit here)" color="${look.colors.body}" transform="${faceAt}">${face.defs ? `<defs>${face.defs}</defs>` : ''}${face.back}</g>
` : '';
  for (const p of parts) {
    if (p.name === 'head') {                          // the guide rectangle (hidden) + the drawn face
      body += `  <path id="head-guide" inkscape:label="head-guide" d="${p.shapes.map(dOf).join('')}" fill="none" stroke="#b04040" stroke-width="1" stroke-dasharray="4 3" opacity="0.5"/>
`;
      if (face) body += `  <g id="face" inkscape:label="face (${hv.view}${hv.mirror ? ', mirrored' : ''}; drawn, do not edit here)" color="${look.colors.body}" transform="${faceAt}">${face.defs ? `<defs>${face.defs}</defs>` : ''}${face.head || ''}${face.mouth?.[mouth] || ''}</g>
`;
      continue;
    }
    if (p.role === 'prop' && p.shapes.some((s) => s.markup)) {   // a held weapon drawing, as placed
      for (const s of p.shapes) body += s.markup
        ? `  <g inkscape:label="${p.name}" transform="matrix(${s.mx.slice(0, 4).map((v) => +v.toFixed(4)).join(' ')} ${f(s.mx[4])} ${f(s.mx[5])}) scale(${K})">${s.markup}</g>
`
        : `  <path inkscape:label="${p.name}" d="${dOf(s)}" fill="${colorOf('prop')}"/>
`;
      continue;
    }
    body += `  <path id="${p.name}" inkscape:label="${p.name}" d="${p.shapes.map(dOf).join('')}" fill="${colorOf(p.role)}"/>
`;
  }
  const pad = 40, x0 = f(bb.x0) - pad, y0 = f(bb.y0) - pad, w = f(bb.x1 - bb.x0) + 2 * pad, h = f(bb.y1 - bb.y0) + 2 * pad;
  const name = pose.name || 'pose';
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${c.name} (${c.id}), pose "${name}", ${view} view${view === 'front' ? ' (derived from the side pose)' : ', facing right'}.
     Every body part is one path, named by part, in draw order (later = on top).
     Units: 100 px = 1 head-unit; ground at y = 0. Generated by tools/figure-svg.mjs;
     draw corrections on a new layer, the renderer does not read this file. -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
     width="${w}" height="${h}" viewBox="${x0} ${y0} ${w} ${h}">
<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#ffffff"/>
<line x1="${x0}" x2="${x0 + w}" y1="0" y2="0" stroke="#c9bfae" stroke-width="1"/>
<g id="figure" inkscape:groupmode="layer" inkscape:label="figure (${view})">
${body}</g>
</svg>
`;
  console.log(writeOut(`out/figure-${c.id}-${name}-${view}.svg`, svg), `(${parts.length} parts)`);
}
