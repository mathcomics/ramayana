// Held props (swords, clubs, bows): the reference lines poses place, and
// the weapon drawings laid along them.
//
//   node tools/import-held.mjs   ->  data/held.json
//
// data/props/held/lines.svg: one layer per line kind, with a path `line`
// (sword: grip -> tip, straight; bow: top tip -> bottom tip, curved) and,
// for the bow, an anchor `grip` (the circle centre). data/props/held/
// weapons.svg: one layer per weapon, its drawing plus a `line` path (a
// copy of its reference line) and, for a bow, a `grip` anchor. Each
// weapon names its line kind in WEAPONS below.
//
// Everything is stored in the line's own frame, in head-units: origin at
// the grip, +x along the line (sword: toward the tip; bow: toward the top
// tip), +y to the line's right (bow: the belly side). A weapon drawing is
// moved, turned and scaled (uniformly) so that its line's ends land on the
// reference line's ends; its curves and colours are kept.
import { parse, serialize, label } from './svg.mjs';
import { read, writeOut } from './lib.mjs';
import { mm, ap, parseTransform, pathPolys } from './face-turn.mjs';

const WEAPONS = { sword: 'sword', club: 'sword', bow: 'bow' };
const K = 100, r4 = (v) => Math.round(v * 1e4) / 1e4;
const I = [1, 0, 0, 1, 0, 0];

// layers -> { name: { node, M (ancestors' transform incl. the layer's) } }
function layers(file) {
  const out = {};
  const walk = (n, M) => {
    for (const c of n.children || []) {
      if (c.tag !== 'g' && c.tag !== 'svg') continue;
      const M2 = c.attrs.transform ? mm(M, parseTransform(c.attrs.transform)) : M;
      if (c.attrs['inkscape:groupmode'] === 'layer' || c.tag === 'g' && label(c) && !out[label(c)] && n.tag === 'svg') out[label(c)] = { node: c, M: M2 };
      else walk(c, M2);
    }
  };
  walk(parse(read(file)), I);
  return out;
}
// the `line` path's points and the `grip` anchor of a layer, in file px
function refOf(L, where) {
  let pts = null, grip = null;
  const walk = (n, M) => {
    for (const c of n.children || []) {
      if (!c.tag) continue;
      const M2 = c.attrs.transform ? mm(M, parseTransform(c.attrs.transform)) : M;
      if (label(c) === 'line' && c.tag === 'path') {
        const polys = pathPolys(c.attrs.d);
        // a two-point line: its numbers as they stand (pathPolys keeps outlines only)
        const raw = polys.length ? polys.flat() : (() => { const n = (c.attrs.d.match(/-?\d*\.?\d+(?:e-?\d+)?/g) || []).map(Number); return [[n[0], n[1]], [n[n.length - 2], n[n.length - 1]]]; })();
        pts = raw.map((p) => ap(M2, p));
      }
      else if (label(c) === 'grip' && c.tag === 'circle') grip = ap(M2, [+c.attrs.cx, +c.attrs.cy]);
      else if (c.tag === 'g') walk(c, M2);
    }
  };
  walk(L.node, L.M);
  if (!pts) throw new Error(`${where}: no path labelled "line"`);
  return { a: pts[0], b: pts[pts.length - 1], pts, grip };
}
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
// the frame of a line: origin at the grip, x along it (start -> end for a
// sword, end -> start for a bow, so +x points at the top tip)
function frameOf(ref, kind) {
  const o = kind === 'bow' ? ref.grip : ref.a;
  if (!o) throw new Error(`${kind}: the bow line needs a "grip" anchor`);
  const d = kind === 'bow' ? sub(ref.a, ref.b) : sub(ref.b, ref.a), len = Math.hypot(...d);
  const ux = [d[0] / len, d[1] / len], uy = [-ux[1], ux[0]];
  // file point -> line frame (head-units)
  const to = (p) => { const v = sub(p, o); return [(v[0] * ux[0] + v[1] * ux[1]) / K, (v[0] * uy[0] + v[1] * uy[1]) / K]; };
  // as a matrix: rows ux, uy, scaled, origin moved
  const M = [ux[0] / K, uy[0] / K, ux[1] / K, uy[1] / K, -(o[0] * ux[0] + o[1] * ux[1]) / K, -(o[0] * uy[0] + o[1] * uy[1]) / K];
  return { to, M, len: len / K };
}

const refL = layers('data/props/held/lines.svg');
const lines = {};
for (const kind of ['sword', 'bow']) {
  if (!refL[kind]) throw new Error(`lines.svg: no layer "${kind}"`);
  const ref = refOf(refL[kind], `lines.svg ${kind}`), F = frameOf(ref, kind);
  lines[kind] = { tips: kind === 'bow' ? [F.to(ref.a), F.to(ref.b)].map((p) => p.map(r4)) : [[0, 0], F.to(ref.b).map(r4)],
    pts: ref.pts.map(F.to).map((p) => p.map(r4)) };
}
const wL = layers('data/props/held/weapons.svg');
const weapons = {};
for (const [name, kind] of Object.entries(WEAPONS)) {
  if (!wL[name]) { console.warn(`  ! weapons.svg: no layer "${name}"`); continue; }
  const ref = refOf(wL[name], `weapons.svg ${name}`), F = frameOf(ref, kind);
  // scale so this drawing's line has the reference line's length
  const s = (kind === 'bow' ? Math.hypot(...sub(lines.bow.tips[0], lines.bow.tips[1])) / (Math.hypot(...sub(ref.a, ref.b)) / K) : lines.sword.tips[1][0] / F.len);
  const M = mm([s, 0, 0, s, 0, 0], mm(F.M, wL[name].M));
  const body = wL[name].node.children.filter((c) => c.tag && !['line', 'grip'].includes(label(c))).map(serialize).join('');
  weapons[name] = { line: kind, svg: `<g transform="matrix(${M.map(r4).join(' ')})">${body}</g>` };
}
console.log(writeOut('data/held.json', JSON.stringify({ _doc: 'Generated by tools/import-held.mjs from data/props/held/*.svg; do not edit. Line frame: head-units, origin at the grip, +x along the line (sword: to the tip; bow: to the top tip), +y the belly side.', lines, weapons }, null, 1)));
console.log(Object.entries(weapons).map(([k, v]) => `${k} (${v.line})`).join(', '));
