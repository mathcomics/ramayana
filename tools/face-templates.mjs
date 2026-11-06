// Write face templates: one per species and view.
//
//   node tools/face-templates.mjs   ->  data/faces/templates/<species>-<front|side>.svg
//
// Units are head-units: the head centre is (0,0), y down, the head spans
// about ±0.5; in side view the face looks right. The locked "guide" layer
// shows the species' head rectangle with the drawn body (data/parts)
// standing straight at the figure's real scale, so body hair can be drawn
// over the back. The "anchors" layer holds the nape (where body hair joins
// the body), placed at the neck base.
// Draw (or paste and scale) the face over the guide in the layers below; the
// guide layer is ignored on import. See data/faces/README.md.

import { pathD } from '../src/geom.js';
import { buildShapes } from '../src/figure.js';
import { loadSpecies, writeOut } from './lib.mjs';

// standing straight, arms and legs hanging
const STRAIGHT = { spine: { lean: 0, chest: 0, neck: 0, head: 0 },
  near: { arm: { shoulder: 0, elbow: 0 }, leg: { hip: 0, knee: 0 } },
  far: { arm: { shoulder: 0, elbow: 0 }, leg: { hip: 0, knee: 0 } } };
const GUIDE = { torso: '#d9cfc4', neck: '#e8e1d9', head: '#d9c3b6' };

const all = loadSpecies();
for (const species of Object.keys(all)) {
  const S = all[species];
  for (const view of ['front', 'side']) {
    const { shapes, headAnchor, hairAnchor } = buildShapes(S, STRAIGHT, { top: 'bare', bottom: 'dhoti' }, view);
    const [hx, hy] = headAnchor.at;
    const loc = (pts) => pts.map(([x, y]) => [x - hx, y - hy]);
    // the body behind, then the neck and torso over it, then the head guide
    const body = shapes.filter((s) => s.pts?.length && !s.headPart && s.part !== 'torso' && s.part !== 'neck');
    const guides = [
      ...body.map((s) => `<path d="${pathD(loc(s.pts))}" fill="#ebe5dd"/>`),
      ...shapes.filter((s) => s.part === 'torso').map((s) => `<path d="${pathD(loc(s.pts))}" fill="${GUIDE.torso}"/>`),
      ...shapes.filter((s) => s.part === 'neck').map((s) => `<path d="${pathD(loc(s.pts))}" fill="${GUIDE.neck}"/>`),
      ...shapes.filter((s) => s.headPart).map((s) => `<path d="${pathD(loc(s.pts))}" fill="${GUIDE.head}"/>`),
    ].join('\n    ');
    const [nx, ny] = [hairAnchor.at[0] - hx, hairAnchor.at[1] - hy].map((v) => Math.round(v * 1000) / 1000);
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Face template: ${species}, ${view} view${view === 'side' ? ' (face looks right)' : ''}.
     Units: head-units, head centre at (0,0), y down. Save as
     data/faces/<character-id>-${view}.svg (e.g. rama-${view}.svg).
     Layers:
       head      - the face itself; turns with the head
       back      - optional; hair behind the head; turns with the head,
                   drawn behind the whole body
       hair-body - optional; long hair on the back and shoulders; moves
                   with the upper body (pinned at the nape, turns with the
                   chest), drawn just behind the torso
       mouth-1/2/3 - optional; the pose's mouth size picks one
       anchors   - nape: where the body hair joins the body (keep it at
                   the neck base unless the hair starts elsewhere)
     Colours are used exactly as drawn; match the skin to the character's
     body colour (data/characters.json palette). The guide layer is ignored. -->
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
     xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
     width="600" height="1000" viewBox="-1.5 -1.2 3 5">
  <g id="guide" inkscape:groupmode="layer" inkscape:label="guide" sodipodi:insensitive="true" opacity="0.7">
    ${guides}
    <path d="M-0.08 0H0.08M0 -0.08V0.08" stroke="#b04040" stroke-width="0.01" fill="none"/>
  </g>
  <g id="hair-body" inkscape:groupmode="layer" inkscape:label="hair-body"></g>
  <g id="back" inkscape:groupmode="layer" inkscape:label="back"></g>
  <g id="head" inkscape:groupmode="layer" inkscape:label="head"></g>
  <g id="mouth-1" inkscape:groupmode="layer" inkscape:label="mouth-1"></g>
  <g id="mouth-2" inkscape:groupmode="layer" inkscape:label="mouth-2"></g>
  <g id="mouth-3" inkscape:groupmode="layer" inkscape:label="mouth-3"></g>
  <g id="anchors" inkscape:groupmode="layer" inkscape:label="anchors">
    <circle id="nape" inkscape:label="nape" cx="${nx}" cy="${ny}" r="0.03" fill="#d02020"/>
  </g>
</svg>
`;
    writeOut(`data/faces/templates/${species}-${view}.svg`, svg);
  }
}
console.log(`data/faces/templates: ${Object.keys(all).length * 2} templates`);
