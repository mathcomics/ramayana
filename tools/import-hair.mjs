// Read hand-edited hair shapes back into the species file.
//
//   node tools/import-hair.mjs [file.svg ...]
//   (default: data/shapes/hair-female-front.svg and -side.svg)
//
// Takes the path with id="hair" (or the first path in the hair layer) from each file, flattens it to points in
// head-units (head centre at 0,0) and stores it in data/species/female.json
// as head.hairShape.front / .side. The renderer uses these instead of the
// generated hair. Group or path transforms (translate/scale/matrix) set by
// an editor are applied.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { root } from './lib.mjs';
import { I, mulMatrix as mul, parseTransform, apply, flatten } from './svg.mjs';

const files = process.argv.slice(2).length ? process.argv.slice(2)
  : ['front', 'side'].map((v) => join(root, `data/shapes/hair-female-${v}.svg`));

// ---- read each file -----------------------------------------------------
const spPath = join(root, 'data/species/female.json');
const S = JSON.parse(readFileSync(spPath, 'utf8'));
S.head.hairShape = S.head.hairShape || {};
for (const f of files) {
  const view = /front/.test(basename(f)) ? 'front' : 'side';
  const src = readFileSync(f, 'utf8');
  // the path id="hair", or else the first path inside the group id="hair-layer"
  // (editors often rename paths)
  let tag = src.match(/<path\b[^>]*\bid="hair"[^>]*>/s);
  if (!tag) {
    const layer = src.search(/<g\b[^>]*\bid="hair-layer"/);
    if (layer >= 0) {
      const m2 = /<path\b[^>]*>/s.exec(src.slice(layer));
      if (m2) { tag = [m2[0]]; tag.index = layer + m2.index; }
    }
  }
  if (!tag) { console.error(`${f}: no <path id="hair"> and no path in the hair layer`); process.exitCode = 1; continue; }
  const d = tag[0].match(/\sd="([^"]+)"/s)[1].replace(/\s+/g, ' ');
  // collect transforms of enclosing groups (by position) and the path itself
  let m = I;
  const before = src.slice(0, tag.index);
  const open = [];
  for (const g of before.matchAll(/<g\b[^>]*>|<\/g>/g)) {
    if (g[0] === '</g>') open.pop(); else open.push((g[0].match(/transform="([^"]+)"/) || [])[1]);
  }
  for (const t of open) m = mul(m, parseTransform(t));
  m = mul(m, parseTransform((tag[0].match(/transform="([^"]+)"/) || [])[1]));
  const pts = flatten(d).map((q) => apply(m, q)).map(([x, y]) => [+x.toFixed(4), +y.toFixed(4)]);
  S.head.hairShape[view] = pts;
  console.log(`${view}: ${pts.length} points from ${basename(f)}`);
}
writeFileSync(spPath, JSON.stringify(S, null, 2));
