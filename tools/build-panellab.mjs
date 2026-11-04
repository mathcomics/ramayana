// Build the self-contained panel lab page: inlines the renderer modules, all
// assets and every section's panels and backgrounds.
//
//   node tools/build-panellab.mjs   ->  out/panellab.html
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { root, loadAssets, loadSections } from './panels-lib.mjs';

const read = (p) => readFileSync(join(root, p), 'utf8');
const unmodule = (src) => src
  .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];\s*$/gm, '')
  .replace(/^export\s+(const|function|let|class)\s/gm, '$1 ');
const renderer = ['src/geom.js', 'src/figure.js', 'src/scene.js'].map((p) => `// ---- ${p}\n${unmodule(read(p))}`).join('\n');
if (/^\s*(import|export)\s/m.test(renderer)) throw new Error('module syntax left in renderer');
const sections = loadSections().map(({ name, title, panels, backgrounds }) => ({ name, title, panels, backgrounds }));
const html = read('tools/panellab.template.html')
  .replace('/*__RENDERER__*/', () => renderer)
  .replace('/*__ASSETS__*/', () => JSON.stringify(loadAssets()))
  .replace('/*__SECTIONS__*/', () => JSON.stringify(sections).replace(/<\/script/gi, '<\\/script'));
mkdirSync(join(root, 'out'), { recursive: true });
writeFileSync(join(root, 'out/panellab.html'), html);
console.log('out/panellab.html', (html.length / 1024).toFixed(1) + ' KB');
