// Load assets and panel definitions from the repo (Node side of src/scene.js).
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { backgroundInner } from '../src/scene.js';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const json = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

export function loadAssets() {
  const species = Object.fromEntries(readdirSync(join(root, 'data/species')).filter((f) => f.endsWith('.json'))
    .map((f) => [f.slice(0, -5), json(`data/species/${f}`)]));
  return {
    species,
    poses: json('data/poses.json').poses,
    characters: json('data/characters.json'),
    faces: json('data/faces.json'),
    props: json('data/props.json'),
    grounds: json('data/grounds.json'),
  };
}

// panels/<NN-section-name>/<id>.json (+ optional <id>.svg background)
export function loadSections() {
  const dir = join(root, 'panels');
  return readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort().map((name) => {
    const files = readdirSync(join(dir, name)).sort();
    // the id is the file name; it is not stored in the JSON
    const panels = files.filter((f) => f.endsWith('.json')).map((f) => ({
      id: f.slice(0, -5), def: JSON.parse(readFileSync(join(dir, name, f), 'utf8')),
    })).sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
    const backgrounds = {};
    for (const p of panels) {
      const bg = join(dir, name, `${p.def.background || p.id + '.svg'}`);
      if (existsSync(bg)) backgrounds[p.id] = backgroundInner(readFileSync(bg, 'utf8'));
    }
    const m = name.match(/^(\d+)-(.*)$/);
    const title = m ? `${Number(m[1])}. ${m[2].replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}` : name;
    return { name, title, panels, backgrounds };
  });
}
