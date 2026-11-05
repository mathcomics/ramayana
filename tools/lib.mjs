// Shared helpers for the tools (Node only): repo paths, data loading,
// panel sections, PNG conversion, the renderer bundle for the lab pages and
// the head-local frame used by the hair and face templates.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { backgroundInner } from '../src/scene.js';
import { anatomy } from '../src/figure.js';
import { bbox } from '../src/geom.js';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const read = (p) => readFileSync(join(root, p), 'utf8');
export const json = (p) => JSON.parse(read(p));

// Write a file under the repo (creating its folder); returns the full path.
export function writeOut(p, text) {
  const full = join(root, p);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, text);
  return full;
}

// SVG -> PNG (or PDF with ['-f', 'pdf']) with rsvg-convert.
export const rsvg = (svgPath, outPath, args = []) => execFileSync('rsvg-convert', [...args, '-o', outPath, svgPath]);

// Every species in data/species: monkey, male, female first, then any others.
const ORDER = ['monkey', 'male', 'female'];
const rank = (id) => (ORDER.includes(id) ? ORDER.indexOf(id) : ORDER.length);
export function loadSpecies() {
  const ids = readdirSync(join(root, 'data/species')).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5))
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  // a species with "parts": "<id>" is drawn from the artist's parts
  // (data/parts.json, from data/parts/<id>.svg; experiment)
  const parts = existsSync(join(root, 'data/parts.json')) ? json('data/parts.json').parts : {};
  return Object.fromEntries(ids.map((id) => {
    const S = json(`data/species/${id}.json`);
    if (typeof S.parts === 'string') {
      if (!parts[S.parts]) throw new Error(`species ${id}: no parts "${S.parts}" in data/parts.json`);
      S.parts = parts[S.parts];
    }
    return [id, S];
  }));
}

export function loadAssets() {
  return {
    species: loadSpecies(),
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

// The renderer modules as one classic script (for the self-contained lab pages).
export function rendererBundle(files) {
  const unmodule = (src) => src
    .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];\s*$/gm, '')
    .replace(/^export\s+(const|function|let|class)\s/gm, '$1 ');
  const out = files.map((p) => `// ---- ${p}\n${unmodule(read(p))}`).join('\n');
  if (/^\s*(import|export)\s/m.test(out)) throw new Error('module syntax left in renderer');
  return out;
}

// Fill a lab template's /*__KEY__*/ placeholders.
export const fillTemplate = (template, values) =>
  Object.entries(values).reduce((html, [k, v]) => html.replace(`/*__${k}__*/`, () => v), read(template));

// A standing, unbent figure's parts, and `loc` to move points into the
// head-local frame (head centre at 0,0) used by hair and face SVGs.
export function headFrame(S, view) {
  const parts = anatomy(S, { view, headView: view, mouth: 2, spine: { lean: 0, chest: 0, neck: 0, head: 0 } });
  const b = bbox([parts.head.find((p) => p.head).pts]);
  const c = [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];
  return { parts, centre: c, loc: (pts) => pts.map(([x, y]) => [x - c[0], y - c[1]]) };
}
