// Build the self-contained panel lab page: inlines the renderer modules, all
// assets and every section's panels.
//
//   node tools/build-panellab.mjs   ->  out/panellab.html
import { loadAssets, loadSections, rendererBundle, fillTemplate, writeOut } from './lib.mjs';

const sections = loadSections().map(({ name, title, panels }) => ({ name, title, panels }));
const html = fillTemplate('tools/panellab.template.html', {
  RENDERER: rendererBundle(['src/geom.js', 'src/parts.js', 'src/headturn.js', 'src/figure.js', 'src/compose.js', 'src/scene.js']),
  ASSETS: JSON.stringify(loadAssets()),
  SECTIONS: JSON.stringify(sections).replace(/<\/script/gi, '<\\/script'),
});
writeOut('out/panellab.html', html);
console.log('out/panellab.html', (html.length / 1024).toFixed(1) + ' KB');
