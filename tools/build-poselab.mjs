// Build the self-contained pose lab page: inlines the renderer modules
// (with the pose composer), species data (all species), the cast, faces
// and the pose data — bases, gestures, the pose list and the tag names —
// into tools/poselab.template.html.
//
//   node tools/build-poselab.mjs   ->  out/poselab.html
import { loadAssets, loadPoseData, rendererBundle, fillTemplate, writeOut } from './lib.mjs';

const A = loadAssets();
const D = loadPoseData();
const html = fillTemplate('tools/poselab.template.html', {
  RENDERER: rendererBundle(['src/geom.js', 'src/parts.js', 'src/headturn.js', 'src/figure.js', 'src/compose.js']),
  SPECIES: JSON.stringify(A.species),
  CHARACTERS: JSON.stringify(A.characters),
  FACES: JSON.stringify(A.faces),
  POSEDATA: JSON.stringify({ bases: D.bases, gestures: D.gestures, poses: D.poses, tags: Object.keys(D.tags) }),
});
writeOut('out/poselab.html', html);
console.log('out/poselab.html', (html.length / 1024).toFixed(1) + ' KB');
