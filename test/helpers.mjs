// Shared test helpers: repo data and a render fingerprint.
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const json = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
export const SPECIES = Object.fromEntries(readdirSync(join(root, 'data/species'))
  .filter((f) => f.endsWith('.json')).map((f) => [f.slice(0, -5), json(`data/species/${f}`)]));
// every pose composed from its base and gesture, as the renderer gets them
export const POSES = (await import('../tools/lib.mjs')).loadPoses();
export const CAST = json('data/characters.json');
export const FACES = json('data/faces.json');

// SVG with page-global clip/pattern ids replaced, so a render's hash does not
// depend on how many figures were drawn before it.
export const stableIds = (svg) => {
  const ids = new Map();
  return svg.replace(/(id="|url\(#)([\w-]+)/g, (m, pre, id) => {
    if (!ids.has(id)) ids.set(id, `id${ids.size}`);
    return pre + ids.get(id);
  });
};
export const hash = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

// Every point in a shape list is a finite number.
export const allFinite = (shapes) => shapes.every((s) => [s.pts, ...(s.parts || []), s.clipPts || []]
  .every((pts) => pts.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))));
