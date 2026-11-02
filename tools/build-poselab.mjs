// Build the self-contained pose lab page: inlines the renderer modules,
// species data (all species) and starter poses into tools/poselab.template.html.
//
//   node tools/build-poselab.mjs   ->  out/poselab.html

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

// Strip ES module syntax so the modules run as one classic script.
const unmodule = (src) => src
  .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];\s*$/gm, '')
  .replace(/^export\s+(const|function|let|class)\s/gm, '$1 ');

const renderer = ['src/geom.js', 'src/figure.js'].map((p) => `// ---- ${p}\n${unmodule(read(p))}`).join('\n');
// every species in data/species, in this order
const ORDER = ['monkey', 'male', 'female'];
const rank = (id) => (ORDER.includes(id) ? ORDER.indexOf(id) : ORDER.length);
const ids = readdirSync(join(root, 'data/species')).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5))
  .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
const species = JSON.stringify(Object.fromEntries(ids.map((id) => [id, JSON.parse(read(`data/species/${id}.json`))])));
const poses = JSON.stringify(JSON.parse(read('data/poses.json')).poses);
const characters = JSON.stringify(JSON.parse(read('data/characters.json')));
const faces = JSON.stringify(JSON.parse(read('data/faces.json')));

const html = read('tools/poselab.template.html')
  .replace('/*__RENDERER__*/', () => renderer)
  .replace('/*__SPECIES__*/', () => species)
  .replace('/*__POSES__*/', () => poses)
  .replace('/*__CHARACTERS__*/', () => characters)
  .replace('/*__FACES__*/', () => faces);

if (/^\s*(import|export)\s/m.test(renderer)) throw new Error('module syntax left in renderer');
mkdirSync(join(root, 'out'), { recursive: true });
writeFileSync(join(root, 'out/poselab.html'), html);
console.log('out/poselab.html', (html.length / 1024).toFixed(1) + ' KB');
