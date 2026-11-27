// Shared helpers for the tools (Node only): repo paths, data loading,
// panel sections, PNG conversion and the renderer bundle for the lab pages.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { svgInner } from '../src/scene.js';
import { composePoses, splitPoseName } from '../src/compose.js';
import { composeFaces } from './faces-lib.mjs';

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

// SVG -> PNG (or PDF with ['-f', 'pdf']) with rsvg-convert. On a machine
// without it, resvg renders the PNGs instead ($RESVG as the binary's path,
// or `resvg` on PATH): the -z / -w flags are the same, but resvg writes
// only PNG, so PDF output still needs rsvg-convert.
let noRsvgConvert = false;
export function rsvg(svgPath, outPath, args = []) {
  if (!noRsvgConvert) {
    try { return execFileSync('rsvg-convert', [...args, '-o', outPath, svgPath]); }
    catch (e) { if (e.code !== 'ENOENT') throw e; noRsvgConvert = true; }
  }
  if (args.includes('pdf')) throw new Error(`${outPath}: PDF output needs rsvg-convert (resvg writes only PNG)`);
  return execFileSync(process.env.RESVG || 'resvg', [...args, svgPath, outPath]);
}

// Every species in data/species: monkey, male, female first, then any others.
const ORDER = ['monkey', 'male', 'female'];
const rank = (id) => (ORDER.includes(id) ? ORDER.indexOf(id) : ORDER.length);
export function loadSpecies() {
  const ids = readdirSync(join(root, 'data/species')).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5))
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  // every species names its drawn parts, "parts": "<id>" (data/parts.json,
  // from data/parts/<id>.svg); the renderer needs them attached
  const parts = existsSync(join(root, 'data/parts.json')) ? json('data/parts.json').parts : {};
  // held props (data/held.json, from data/props/held/<kind>.svg): shared by every species
  const held = existsSync(join(root, 'data/held.json')) ? json('data/held.json') : null;
  return Object.fromEntries(ids.map((id) => {
    const S = json(`data/species/${id}.json`);
    if (held) { const { _doc, ...kinds } = held; S.held = kinds; }
    if (typeof S.parts === 'string') {
      if (!parts[S.parts]) throw new Error(`species ${id}: no parts "${S.parts}" in data/parts.json`);
      S.parts = parts[S.parts];
    }
    return [id, S];
  }));
}

// The props are the artist's drawings data/props/<id>.svg (100 px = 1
// head-unit, bottom edge on the ground; size from the viewBox). A prop id
// with no drawing renders as a fixed-size placeholder box (src/scene.js).
// data-height="10" on the root element gives the prop's real height in
// head-units (a man is 6.1): the drawing, its size and its anchors are
// scaled to it, so `scale` 1 in a panel is life-size beside a figure.
export function loadProps() {
  const props = {};
  for (const f of readdirSync(join(root, 'data/props')).filter((f) => f.endsWith('.svg')).sort()) {
    const id = f.slice(0, -4), def = props[id] = {};
    const text = readFileSync(join(root, 'data/props', f), 'utf8');
    const vb = text.match(/viewBox="([^"]+)"/)[1].split(/[\s,]+/).map(Number);
    const svgTag = text.match(/<svg\b[^>]*>/)[0];
    const height = svgTag.match(/\bdata-height="([^"]+)"/)?.[1];
    if (height != null && !(Number(height) > 0)) throw new Error(`data/props/${id}.svg: data-height "${height}" is not a positive number`);
    const k = height != null ? Number(height) / (vb[3] / 100) : 1;
    def.size = [vb[2] / 100 * k, vb[3] / 100 * k];
    // Recolouring roles on the root element: data-recolor-body="#a05a2c",
    // data-recolor-cloth="#c8ab37" name the drawing's colours a use may swap.
    for (const [, role, c] of svgTag.matchAll(/\bdata-recolor-(\w+)="([^"]+)"/g)) (def.recolor ??= {})[role] = c;
    // data-cut on the root: a cutter, not drawn — its shape cuts a hole in
    // the prop it is "on" (break: a wall broken through).
    if (/\bdata-cut\b/.test(svgTag)) def.cut = true;
    // A group id="anchors" holds named points (circles), e.g. seat; not drawn.
    // [x, y, d]: d is the circle's diameter in head-units. An anchor that
    // places a whole figure (seat, stand) is a point and ignores d — its
    // circle is only a marker. An anchor drawn to size (face) uses it: a head
    // is 1 head-unit tall, so d = 1 (r="50") is a full-size head.
    const anch = text.match(/<g\b[^>]*id="anchors"[^>]*>([\s\S]*?)<\/g>/);
    if (anch) {
      def.anchors = {};
      // Inkscape moves a group by giving it translate(): honour that, and
      // refuse any other transform rather than misplace the anchors.
      const gt = anch[0].match(/^<g\b[^>]*\btransform="([^"]*)"/)?.[1];
      const tm = gt && gt.match(/^\s*translate\(\s*(-?[\d.e-]+)(?:[\s,]+(-?[\d.e-]+))?\s*\)\s*$/);
      if (gt && !tm) throw new Error(`data/props/${id}.svg: anchors group transform "${gt}" — only translate() is supported`);
      const [tx, ty] = tm ? [Number(tm[1]), Number(tm[2] ?? 0)] : [0, 0];
      for (const c of anch[1].matchAll(/<circle\b[^>]*>/g)) {
        const a = (k) => c[0].match(new RegExp(`\\b${k}="([^"]+)"`))?.[1];
        if (a('id')) def.anchors[a('id')] = [(Number(a('cx')) + tx - vb[0]) / 100 * k, (Number(a('cy')) + ty - vb[1]) / 100 * k,
          Number(a('r')) * 2 / 100 * k];
      }
    }
    const drawing = text.replace(/<g\b[^>]*id="anchors"[^>]*>[\s\S]*?<\/g>/, '');
    // a prop can appear many times on a page: drop its ids unless something refers to them
    let inner = svgInner(drawing);
    if (!/url\(#|href=/.test(inner)) inner = inner.replace(/\s+id="[^"]*"/g, '');
    def.svg = `<g transform="scale(${0.01 * k}) translate(${-vb[0]} ${-vb[1]})">${inner}</g>`;
  }
  return { props };
}

// The pose data: bases (lower bodies: legs, lean, tail; ground, use),
// gestures (upper bodies: arms, chest, neck, head, mouth; hold, use) and
// data/poses.json's tags, notWords and wanted. There is no pose list: any
// <base>-<gesture> is a pose (docs/design/pose-picking.md).
export function loadPoseData() {
  const P = json('data/poses.json');
  return { bases: json('data/bases.json').bases, gestures: json('data/gestures.json').gestures,
    tags: P.tags, notWords: P.notWords, wanted: P.wanted };
}

// A pose's finding fields, from its two halves: what touches the ground
// (the base), the hands free to hold (the gesture), the story moments of
// both. Null when a half is unknown.
export function poseInfo(D, name) {
  const [b, g] = splitPoseName(name), B = D.bases[b], G = D.gestures[g];
  if (!B || !G) return null;
  return { desc: `${B.desc}; ${G.desc}`, ground: B.ground, hold: G.hold, use: [...B.use, ...G.use.filter((t) => !B.use.includes(t))] };
}

// One example pose for every base (with the hang gesture: both arms
// hanging) and every gesture (on the step base), alphabetical: what the
// figure tests, the render snapshot and the contact sheet draw.
export function examplePairs(D = loadPoseData()) {
  return [...new Set([...Object.keys(D.bases).map((b) => `${b}-hang`), ...Object.keys(D.gestures).map((g) => `step-${g}`)])].sort();
}

// The base-gesture pairs the repo's panels name: pair -> [panel ids]
// (pairs with an unknown half left out).
export function panelPairs(D = loadPoseData(), sections = loadSections()) {
  const out = {};
  const walk = (v, id) => {
    if (Array.isArray(v)) v.forEach((x) => walk(x, id));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) {
      if (k === 'pose' && typeof x === 'string') {
        const [b, g] = splitPoseName(x);
        if (D.bases[b] && D.gestures[g] && !(out[x] ||= []).includes(id)) out[x].push(id);
      } else walk(x, id);
    }
  };
  for (const sec of sections) for (const p of sec.panels) walk(p.def, p.id);
  return out;
}

// The poses worth showing (pose catalogue, pose lab): every pair a panel
// uses, plus the example pair of each base and gesture no panel uses.
export function shownPairs(D = loadPoseData(), used = panelPairs(D)) {
  const out = new Set(Object.keys(used));
  const has = (i, n) => [...out].some((p) => splitPoseName(p)[i] === n);
  for (const b of Object.keys(D.bases)) if (!has(0, b)) out.add(`${b}-hang`);
  for (const g of Object.keys(D.gestures)) if (!has(1, g)) out.add(`step-${g}`);
  return [...out].sort();
}

// Poses composed from their base and gesture (src/compose.js): the whole
// stored-form poses the renderer takes; by default the example pairs.
export function loadPoses(species = loadSpecies(), names = null) {
  const D = loadPoseData();
  return composePoses(species.male, D.bases, D.gestures, names || examplePairs(D));
}

// The faces, composed from the artist's drawings each time they are loaded
// (data/faces/base/<species>.svg + data/faces/<id>.svg; tools/faces-lib.mjs
// composeFaces): { faces: { <id>: { <view>: { head, mouth, back, hairBody,
// nape, defs } } } }. A character whose drawing is missing is left out
// (npm test fails); node tools/check-faces.mjs reports every problem.
let facesCache;
export function loadFaces() {
  return facesCache ||= { faces: composeFaces(join(root, 'data/faces'), json('data/characters.json').characters, json('data/characters.json').colors).faces };
}

export function loadAssets() {
  const species = loadSpecies();
  const D = loadPoseData();
  return {
    species,
    // every <base>-<gesture> a panel names is composed from these
    // (src/scene.js, findPose)
    poseParts: { bases: D.bases, gestures: D.gestures },
    characters: json('data/characters.json'),
    faces: loadFaces(),
    props: loadProps(),
    grounds: json('data/grounds.json'),
  };
}

// panels/<NN-section-name>/<id>.json
export function loadSections() {
  const dir = join(root, 'panels');
  return readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort().map((name) => {
    const files = readdirSync(join(dir, name)).sort();
    // the id is the file name; it is not stored in the JSON
    const panels = files.filter((f) => f.endsWith('.json')).map((f) => ({
      id: f.slice(0, -5), def: JSON.parse(readFileSync(join(dir, name, f), 'utf8')),
    })).sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
    const m = name.match(/^(\d+)-(.*)$/);
    // a folder with no chapter number (panels/reference) holds reference
    // drawings: in the panel lab, never on the reader site
    const cap = (t) => t.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
    const title = m ? `${Number(m[1])}. ${cap(m[2])}` : cap(name);
    return { name, title, panels, reference: !m };
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

// Command-line options: values (--zoom 2), switches (--light) and the
// positional words (not a flag's value).
export function cliArgs(argv = process.argv.slice(2)) {
  const at = (k) => argv.indexOf(k);
  return {
    has: (k) => at(k) >= 0,
    str: (k, d = null) => (at(k) >= 0 ? argv[at(k) + 1] : d),
    num: (k, d) => (at(k) >= 0 ? Number(argv[at(k) + 1]) : d),
    words: argv.filter((a, i) => !a.startsWith('--') && !argv[i - 1]?.startsWith('--')),
  };
}

// SVG -> PNG beside it at `zoom` (named <name>@<zoom>x.png when zoomed and
// tagZoom); prints the PNG's path, or the SVG's when no converter is installed.
export function toPng(svgPath, zoom = 1, { tagZoom = true } = {}) {
  const png = svgPath.replace(/\.svg$/, `${tagZoom && zoom > 1 ? `@${zoom}x` : ''}.png`);
  try { rsvg(svgPath, png, ['-z', String(zoom)]); console.log(png); return png; }
  catch { console.log(svgPath, '(rsvg-convert not available; SVG only)'); return svgPath; }
}

// A character by id with its render look and species (loadAssets() as A).
export function characterById(A, id, characterLook) {
  const who = A.characters.characters.find((c) => c.id === id);
  if (!who) throw new Error(`no character "${id}"`);
  const look = characterLook(who, A.characters.colors, A.faces);
  return { who, look, species: A.species[who.species] };
}

// Text for XML / HTML content and attributes.
export const escXml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// manuscript/scenes.md: every "## N. Title" chapter in order, with its
// beats (the "- " bullets, wrapped lines joined). Other "## " sections
// (continuity, dropped) end a chapter.
export function loadChapters() {
  const out = [];
  let ch = null;
  for (const l of read('manuscript/scenes.md').split('\n')) {
    const h = l.match(/^## (\d+)\.\s*(.*)/);
    if (h) { out.push(ch = { n: Number(h[1]), title: h[2].trim(), beats: [] }); continue; }
    if (/^## /.test(l)) { ch = null; continue; }
    if (!ch) continue;
    if (/^- /.test(l)) ch.beats.push(l.slice(2).trim());
    else if (/^ {2,}\S/.test(l) && ch.beats.length) ch.beats[ch.beats.length - 1] += ' ' + l.trim();
  }
  return out;
}
