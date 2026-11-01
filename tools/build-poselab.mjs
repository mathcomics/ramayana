// Build the self-contained pose lab page: inlines the renderer modules,
// species data and starter poses into tools/poselab.template.html.
//
//   node tools/build-poselab.mjs   ->  out/poselab.html

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

// Strip ES module syntax so the modules run as one classic script.
const unmodule = (src) => src
  .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];\s*$/gm, '')
  .replace(/^export\s+(const|function|let|class)\s/gm, '$1 ');

const renderer = ['src/geom.js', 'src/figure.js'].map((p) => `// ---- ${p}\n${unmodule(read(p))}`).join('\n');
const species = JSON.stringify(JSON.parse(read('data/species/monkey.json')));
const poses = JSON.stringify(JSON.parse(read('data/poses.json')).poses);

const html = read('tools/poselab.template.html')
  .replace('/*__RENDERER__*/', () => renderer)
  .replace('/*__SPECIES__*/', () => species)
  .replace('/*__POSES__*/', () => poses);

if (/^\s*(import|export)\s/m.test(renderer)) throw new Error('module syntax left in renderer');
mkdirSync(join(root, 'out'), { recursive: true });
writeFileSync(join(root, 'out/poselab.html'), html);
console.log('out/poselab.html', (html.length / 1024).toFixed(1) + ' KB');
