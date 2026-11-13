// Shared helpers for the tools (Node only): repo paths, data loading,
// panel sections, PNG conversion and the renderer bundle for the lab pages.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { backgroundInner } from '../src/scene.js';
import { composePoses } from '../src/compose.js';

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
    let inner = backgroundInner(drawing);
    if (!/url\(#|href=/.test(inner)) inner = inner.replace(/\s+id="[^"]*"/g, '');
    def.svg = `<g transform="scale(${0.01 * k}) translate(${-vb[0]} ${-vb[1]})">${inner}</g>`;
  }
  return { props };
}

// The pose data: bases (lower bodies), gestures (upper bodies) and the
// pose list with its finding fields (data/poses.json: poses, tags,
// notWords, wanted). baseOf / gestureOf split a pose name.
export function loadPoseData() {
  const P = json('data/poses.json');
  return { bases: json('data/bases.json').bases, gestures: json('data/gestures.json').gestures,
    poses: P.poses, tags: P.tags, notWords: P.notWords, wanted: P.wanted };
}

// Every pose composed from its base and gesture (src/compose.js), in
// data/poses.json order: the whole stored-form poses the renderer takes.
export function loadPoses(species = loadSpecies()) {
  const D = loadPoseData();
  return composePoses(species.male, D.bases, D.gestures, Object.keys(D.poses));
}

export function loadAssets() {
  const species = loadSpecies();
  return {
    species,
    poses: loadPoses(species),
    characters: json('data/characters.json'),
    faces: json('data/faces.json'),
    props: loadProps(),
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
