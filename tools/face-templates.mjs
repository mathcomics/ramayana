// Write face templates: one per species and view.
//
//   node tools/face-templates.mjs   ->  data/faces/templates/<species>-<front|side>.svg
//
// Units are head-units: the head centre is (0,0), y down, the head spans
// about ±0.5; in side view the face looks right. The locked "guide" layer
// shows the generated head, neck and shoulders at the figure's real scale.
// Draw (or paste and scale) the face over the guide in the layers below; the
// guide layer is ignored on import. See data/faces/README.md.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { anatomy } from '../src/figure.js';
import { pathD } from '../src/geom.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'data/faces/templates');
mkdirSync(out, { recursive: true });

for (const species of ['monkey', 'male', 'female']) {
  const S = JSON.parse(readFileSync(join(root, 'data/species', `${species}.json`), 'utf8'));
  for (const view of ['front', 'side']) {
    const parts = anatomy(S, { view, headView: view, mouth: 2, spine: { lean: 0, chest: 0, neck: 0, head: 0 } });
    const sq = parts.head.find((p) => p.head).pts;
    const xs = sq.map((p) => p[0]), ys = sq.map((p) => p[1]);
    const c = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
    const loc = (pts) => pts.map(([x, y]) => [x - c[0], y - c[1]]);
    const shape = (p, fill) => `<path d="${pathD(loc(p.pts))}" fill="${fill}"/>`;
    const guides = [
      ...parts.torso.map((p) => shape(p, '#e8e1d9')),
      ...parts.neck.map((p) => shape(p, '#e8e1d9')),
      ...parts.head.filter((p) => p.role === 'body').map((p) => shape(p, '#d9c3b6')),
      ...parts.head.filter((p) => p.role === 'eye' || p.role === 'mouth').map((p) => shape(p, '#ffffff')),
    ].join('\n    ');
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Face template: ${species}, ${view} view${view === 'side' ? ' (face looks right)' : ''}.
     Units: head-units, head centre at (0,0), y down. Save as
     data/faces/<character-id>-${view}.svg (e.g. rama-${view}.svg).
     Layers:
       head     - the face itself; turns with the head
       back     - optional; drawn behind the whole body (e.g. long hair in front view)
       mouth-1/2/3 - optional; the pose's mouth size picks one
     Colours: skin #c87137 -> character body colour; cloth #00ff00 -> cloth
     colour; every other colour is kept as drawn. The guide layer is ignored. -->
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
     xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
     width="600" height="900" viewBox="-1.5 -1.2 3 4.5">
  <g id="guide" inkscape:groupmode="layer" inkscape:label="guide" sodipodi:insensitive="true" opacity="0.7">
    ${guides}
    <path d="M-0.08 0H0.08M0 -0.08V0.08" stroke="#b04040" stroke-width="0.01" fill="none"/>
  </g>
  <g id="back" inkscape:groupmode="layer" inkscape:label="back"></g>
  <g id="head" inkscape:groupmode="layer" inkscape:label="head"></g>
  <g id="mouth-1" inkscape:groupmode="layer" inkscape:label="mouth-1"></g>
  <g id="mouth-2" inkscape:groupmode="layer" inkscape:label="mouth-2"></g>
  <g id="mouth-3" inkscape:groupmode="layer" inkscape:label="mouth-3"></g>
</svg>
`;
    writeFileSync(join(out, `${species}-${view}.svg`), svg);
  }
}
console.log('data/faces/templates: 6 templates');
