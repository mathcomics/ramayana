// One-time: merge <id>-front.svg and <id>-side.svg into <id>.svg, with two
// top-level layers "front" and "side" (the side one moved 3 head-units to
// the right; the importer ignores that offset). The drawings are copied
// unchanged; only ids get a "front-" / "side-" prefix (so the file has no
// duplicates) and layers without a label keep their old id as label.
//
//   node tools/merge-faces.mjs [dir]     (default data/faces; also templates/)
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './lib.mjs';
import { parse } from './svg.mjs';

const OFFSET = 3;
const xesc = (s) => String(s).replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);)/gi, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function write(n, depth = 1) {
  if (n.text != null) return n.text;
  const pad = '  '.repeat(depth);
  const attrs = Object.entries(n.attrs).map(([k, v]) => ` ${k}="${xesc(v)}"`).join('');
  if (!n.children.length) return `${pad}<${n.tag}${attrs}/>\n`;
  const textOnly = n.children.every((c) => c.text != null);
  if (textOnly) return `${pad}<${n.tag}${attrs}>${n.children.map((c) => c.text).join('')}</${n.tag}>\n`;
  return `${pad}<${n.tag}${attrs}>\n${n.children.map((c) => write(c, depth + 1)).join('')}${pad}</${n.tag}>\n`;
}
function prefixIds(n, pre) {
  if (n.text != null) return n;
  const attrs = { ...n.attrs };
  if (attrs.id) {
    if (n.tag === 'g' && !attrs['inkscape:label']) attrs['inkscape:label'] = attrs.id;
    if (n.tag === 'circle' && !attrs['inkscape:label']) attrs['inkscape:label'] = attrs.id;
    attrs.id = `${pre}-${attrs.id}`;
  }
  for (const k of Object.keys(attrs)) if (typeof attrs[k] === 'string')
    attrs[k] = attrs[k].replace(/url\(#([^)]+)\)/g, `url(#${pre}-$1)`).replace(/^#(?=[\w-]+$)/, k.endsWith('href') ? `#${pre}-` : '#');
  return { ...n, attrs, children: n.children.map((c) => prefixIds(c, pre)) };
}
function viewGroup(file, view) {
  const svg = parse(readFileSync(file, 'utf8')).children.find((c) => c.tag === 'svg');
  const kids = svg.children.filter((c) => c.tag && !/^(sodipodi:namedview|metadata)$/.test(c.tag));
  let inner = kids.map((c) => prefixIds(c, view));
  if (svg.attrs.transform) inner = [{ tag: 'g', attrs: { transform: svg.attrs.transform }, children: inner }];
  const attrs = { id: view, 'inkscape:groupmode': 'layer', 'inkscape:label': view };
  if (view === 'side') attrs.transform = `translate(${OFFSET},0)`;
  return { tag: 'g', attrs, children: inner };
}
export function mergeDir(dir, header) {
  const files = readdirSync(dir).filter((f) => /^[\w-]+-(front|side)\.svg$/.test(f));
  const ids = [...new Set(files.map((f) => f.replace(/-(front|side)\.svg$/, '')))].sort();
  for (const id of ids) {
    const fr = join(dir, `${id}-front.svg`), sd = join(dir, `${id}-side.svg`);
    if (!files.includes(`${id}-front.svg`) || !files.includes(`${id}-side.svg`)) { console.error(`${id}: needs both views, skipped`); continue; }
    const body = [viewGroup(fr, 'front'), viewGroup(sd, 'side')].map((g) => write(g)).join('');
    const out = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
${header(id)}
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
     xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
     width="1200" height="1000" viewBox="-1.5 -1.2 ${OFFSET * 2} 5">
${body}</svg>
`;
    writeFileSync(join(dir, `${id}.svg`), out);
    unlinkSync(fr); unlinkSync(sd);
    console.log(`${id}.svg`);
  }
}
export const FACE_HEADER = (id) => `<!-- Face of ${id}: front and side in one file (data/faces/README.md).
     Two top-level layers, "front" and "side" (face looks right); the side
     one sits 3 head-units to the right, an offset the importer ignores.
     In each: head, back, hair-body, mouth-1/2/3, anchors (nape), guide.
     Units: head-units, head centre at (0,0) in each view, y down.
     Colours are used exactly as drawn. -->`;

if (import.meta.url === `file://${process.argv[1]}`) mergeDir(process.argv[2] || join(root, 'data/faces'), FACE_HEADER);
