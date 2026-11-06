// Build the self-contained pose lab page: inlines the renderer modules,
// species data (all species), the cast, faces and starter poses into
// tools/poselab.template.html.
//
//   node tools/build-poselab.mjs   ->  out/poselab.html
import { loadAssets, rendererBundle, fillTemplate, writeOut } from './lib.mjs';

const A = loadAssets();
const html = fillTemplate('tools/poselab.template.html', {
  RENDERER: rendererBundle(['src/geom.js', 'src/parts.js', 'src/headturn.js', 'src/figure.js']),
  SPECIES: JSON.stringify(A.species),
  POSES: JSON.stringify(A.poses),
  CHARACTERS: JSON.stringify(A.characters),
  FACES: JSON.stringify(A.faces),
});
writeOut('out/poselab.html', html);
console.log('out/poselab.html', (html.length / 1024).toFixed(1) + ' KB');
