// Write face templates: one per species and view.
//
//   node tools/face-templates.mjs   ->  data/faces/templates/<species>-<front|side>.svg
//
// Units are head-units: the head centre is (0,0), y down, the head spans
// about ±0.5; in side view the face looks right. The locked "guide" layer
// shows the generated head and neck at the figure's real scale.
// Draw (or paste and scale) the face over the guide in the layers below; the
// guide layer is ignored on import. See data/faces/README.md.

import { pathD } from '../src/geom.js';
import { loadSpecies, writeOut, headFrame } from './lib.mjs';

const all = loadSpecies();
for (const species of Object.keys(all)) {
  const S = all[species];
  for (const view of ['front', 'side']) {
    const { parts, loc } = headFrame(S, view);
    const shape = (p, fill) => `<path d="${pathD(loc(p.pts))}" fill="${fill}"/>`;
    const guides = [
      ...parts.neck.map((p) => shape(p, '#e8e1d9')),
      ...parts.head.map((p) => shape(p, '#d9c3b6')),
    ].join('\n    ');
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Face template: ${species}, ${view} view${view === 'side' ? ' (face looks right)' : ''}.
     Units: head-units, head centre at (0,0), y down. Save as
     data/faces/<character-id>-${view}.svg (e.g. rama-${view}.svg).
     Layers:
       head     - the face itself; turns with the head
       back     - optional; drawn behind the whole body (e.g. long hair in front view)
       mouth-1/2/3 - optional; the pose's mouth size picks one
     Colours are used exactly as drawn; match the skin to the character's
     body colour (data/characters.json palette). The guide layer is ignored. -->
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
    writeOut(`data/faces/templates/${species}-${view}.svg`, svg);
  }
}
console.log(`data/faces/templates: ${Object.keys(all).length * 2} templates`);
