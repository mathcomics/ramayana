// Export the female hair (front and side) as editable SVG templates.
//
//   node tools/export-hair.mjs [front|side]   ->  data/shapes/hair-female-front.svg, -side.svg
//
// Coordinates are head-units: the head centre is (0,0), x forward (the face
// looks right in side view), y down, the head spans about ±0.5. The head,
// eyes, neck and shoulder line are in a locked "guide" layer for reference;
// only the path with id="hair" is read back by the renderer.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { anatomy } from '../src/figure.js';
import { pathD } from '../src/geom.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const S = JSON.parse(readFileSync(join(root, 'data/species/female.json'), 'utf8'));

const only = process.argv.slice(2);
for (const view of ['front', 'side'].filter((v) => !only.length || only.includes(v))) {
  const pose = { view, headView: view, mouth: 2, spine: { lean: 0, chest: 0, neck: 0, head: 0 } };
  const parts = anatomy(S, pose);
  // head centre in figure coordinates = centre of the head square's bbox
  const sq = parts.head.find((p) => p.head).pts;
  const xs = sq.map((p) => p[0]), ys = sq.map((p) => p[1]);
  const c = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  const loc = (pts) => pts.map(([x, y]) => [x - c[0], y - c[1]]);
  const hair = parts.head.find((p) => p.role === 'hair');
  const guides = [
    ...parts.head.filter((p) => p.role !== 'hair'),
    ...parts.neck, ...parts.torso,
  ].map((p) => `<path d="${pathD(loc(p.pts))}" fill="${p.role === 'eye' || p.role === 'mouth' ? '#ffffff' : '#c9a89a'}"/>`).join('\n    ');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Female hair, ${view} view. Units: head-units, head centre at (0,0),
     y down${view === 'side' ? ', face looks right' : ''}. Edit only the path id="hair"
     (keep it one closed path; curves are fine). The guide layer is for
     reference and is ignored. Drawn ${view === 'front' ? 'BEHIND the whole body' : 'IN FRONT of the head'}. -->
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
     xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
     width="600" height="900" viewBox="-1.5 -1.2 3 4.5">
  <g id="guide" inkscape:groupmode="layer" inkscape:label="guide (locked)" sodipodi:insensitive="true" opacity="0.6">
    ${guides}
  </g>
  <g id="hair-layer" inkscape:groupmode="layer" inkscape:label="hair">
    <path id="hair" d="${pathD(loc(hair.pts))}" fill="#17110d" opacity="0.85"/>
  </g>
</svg>
`;
  mkdirSync(join(root, 'data/shapes'), { recursive: true });
  writeFileSync(join(root, `data/shapes/hair-female-${view}.svg`), svg);
  console.log(`data/shapes/hair-female-${view}.svg`);
}
