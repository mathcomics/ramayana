// Render snapshot: a fingerprint of every figure (species × pose × view ×
// facing), every character, and every panel. It guards refactors: code
// clean-ups must leave it unchanged. When a render is MEANT to change,
// look at the new render, then refresh the fingerprints with
//
//   UPDATE_SNAPSHOT=1 npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { renderFigure, characterLook } from '../src/figure.js';
import { renderPanel } from '../src/scene.js';
import { loadAssets, loadSections } from '../tools/lib.mjs';
import { root, SPECIES, POSES, CAST, FACES, stableIds, hash } from './helpers.mjs';

const file = join(root, 'test/render-snapshot.json');

function fingerprints() {
  const out = {};
  for (const [sp, S] of Object.entries(SPECIES)) for (const p of POSES) for (const view of ['side', 'front'])
    for (const facing of [1, -1]) out[`figure ${sp} ${p.name} ${view} ${facing}`] = hash(stableIds(renderFigure(S, p, { view, facing, scale: 20 }).svg));
  const stand = POSES.find((p) => p.name === 'step-hang');
  for (const c of CAST.characters) for (const view of c.sideOnly ? ['side'] : ['side', 'front']) {
    const L = characterLook(c, CAST.colors, FACES);
    out[`character ${c.id} ${view}`] = hash(stableIds(renderFigure(SPECIES[L.species], stand,
      { scale: 20, view, pattern: L.pattern, colors: L.colors, outfit: L.outfit, face: L.face, sideOnly: L.sideOnly }).svg));
  }
  const assets = loadAssets();
  for (const sec of loadSections()) for (const { id, def } of sec.panels)
    out[`panel ${id}`] = hash(stableIds(renderPanel(def, assets, { id, background: sec.backgrounds[id] }).svg));
  return out;
}

test('renders match the snapshot', () => {
  const now = fingerprints();
  if (process.env.UPDATE_SNAPSHOT || !existsSync(file)) {
    writeFileSync(file, JSON.stringify(now, null, 1) + '\n');
    return;
  }
  const was = JSON.parse(readFileSync(file, 'utf8'));
  const changed = Object.keys({ ...was, ...now }).filter((k) => was[k] !== now[k]);
  assert.deepEqual(changed, [], `${changed.length} render(s) changed; if intended, look at them and run UPDATE_SNAPSHOT=1 npm test`);
});
