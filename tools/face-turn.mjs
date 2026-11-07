// Turn data for a face (step 4, branch head-turn): what src/headturn.js
// needs to draw the head at any turn and tilt from the front and side
// drawings alone (tools/proto/head-turn was the raster study).
//
// - Volumes: a front element paired with a side element (same kind, best
//   overlap in height; a mirrored pair of front parts, like two earrings,
//   shares one side element) becomes a lofted volume, stored as rows: at each
//   height y the front drawing's width (xc ± ax) and the side drawing's
//   depth (zc ± az). Each row is an ellipse, so the two drawn views come
//   out exact and the in-between angles round. One volume for the skin
//   (the largest skin element); any number for the character's parts.
// - Cards: everything else (eyes, mouths, ears, marks, unpaired parts) is a
//   flat card: front cards lie in the face plane on the head's front
//   surface, side cards in the side plane on the near side. Kept as the
//   drawn markup; the renderer only places them with an affine transform.
//
// Coordinates: head-units, head centre (0,0); front x right, y down; side
// x forward (the face looks right).
import { parse, serialize } from './svg.mjs';

const STEP = 0.02;                     // row spacing of the volumes
const MIN_AREA = 0.03;                 // smaller paired elements stay cards
const r4 = (v) => Math.round(v * 1e4) / 1e4;

// ---- transforms (2x3 matrices [a b c d e f])
export const mm = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3],
  A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
export const ap = (M, [x, y]) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
const I = [1, 0, 0, 1, 0, 0];
export function parseTransform(s = '') {
  let M = I;
  for (const [, fn, args] of s.matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const a = args.split(/[\s,]+/).filter(Boolean).map(Number);
    let T = I;
    if (fn === 'matrix') T = a;
    else if (fn === 'translate') T = [1, 0, 0, 1, a[0], a[1] || 0];
    else if (fn === 'scale') T = [a[0], 0, 0, a[1] ?? a[0], 0, 0];
    else if (fn === 'rotate') {
      const r = a[0] * Math.PI / 180, c = Math.cos(r), s2 = Math.sin(r);
      T = [c, s2, -s2, c, 0, 0];
      if (a.length > 2) T = mm(mm([1, 0, 0, 1, a[1], a[2]], T), [1, 0, 0, 1, -a[1], -a[2]]);
    } else if (fn === 'skewX') T = [1, 0, Math.tan(a[0] * Math.PI / 180), 1, 0, 0];
    else if (fn === 'skewY') T = [1, Math.tan(a[0] * Math.PI / 180), 0, 1, 0, 0];
    M = mm(M, T);
  }
  return M;
}

// ---- outlines as polygons (sampled), any SVG path command
export function pathPolys(d) {
  const toks = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) || [];
  let i = 0, cmd = null, cur = [0, 0], start = [0, 0], prevC = null, prevQ = null;
  const polys = []; let poly = null;
  const num = () => +toks[i++], isNum = () => i < toks.length && !/^[a-zA-Z]$/.test(toks[i]);
  const cubic = (p0, p1, p2, p3) => { for (let k = 1; k <= 8; k++) { const t = k / 8, u = 1 - t;
    poly.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); } };
  while (i < toks.length) {
    if (!isNum()) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    const pt = () => { const x = num(), y = num(); return rel ? [cur[0] + x, cur[1] + y] : [x, y]; };
    if (C === 'M') { cur = pt(); start = cur; poly = [cur]; polys.push(poly); cmd = rel ? 'l' : 'L'; prevC = prevQ = null; continue; }
    if (!poly) { poly = [cur]; polys.push(poly); }
    if (C === 'L') { cur = pt(); poly.push(cur); prevC = prevQ = null; }
    else if (C === 'H') { const x = num(); cur = [rel ? cur[0] + x : x, cur[1]]; poly.push(cur); prevC = prevQ = null; }
    else if (C === 'V') { const y = num(); cur = [cur[0], rel ? cur[1] + y : y]; poly.push(cur); prevC = prevQ = null; }
    else if (C === 'C') { const a = pt(), b = pt(), p = pt(); cubic(cur, a, b, p); prevC = b; prevQ = null; cur = p; }
    else if (C === 'S') { const a = prevC ? [2 * cur[0] - prevC[0], 2 * cur[1] - prevC[1]] : cur, b = pt(), p = pt(); cubic(cur, a, b, p); prevC = b; prevQ = null; cur = p; }
    else if (C === 'Q' || C === 'T') { const q = C === 'Q' ? pt() : prevQ ? [2 * cur[0] - prevQ[0], 2 * cur[1] - prevQ[1]] : cur, p = pt();
      cubic(cur, [cur[0] + 2 / 3 * (q[0] - cur[0]), cur[1] + 2 / 3 * (q[1] - cur[1])], [p[0] + 2 / 3 * (q[0] - p[0]), p[1] + 2 / 3 * (q[1] - p[1])], p); prevQ = q; prevC = null; cur = p; }
    else if (C === 'A') {
      const rx = Math.abs(num()), ry = Math.abs(num()), rotd = num(), large = num(), sweep = num(), p = pt();
      arc(cur, p, rx, ry, rotd, large, sweep).forEach((q) => poly.push(q)); cur = p; prevC = prevQ = null;
    } else if (C === 'Z') { cur = start; poly.push(cur); poly = null; prevC = prevQ = null; }
    else throw new Error(`path command ${cmd}`);
  }
  return polys.filter((p) => p.length > 2);
}
function arc(p0, p1, rx, ry, rotd, large, sweep) {
  if (!rx || !ry) return [p1];
  const phi = rotd * Math.PI / 180, cp = Math.cos(phi), sp = Math.sin(phi);
  const dx = (p0[0] - p1[0]) / 2, dy = (p0[1] - p1[1]) / 2;
  const x1 = cp * dx + sp * dy, y1 = -sp * dx + cp * dy;
  const L = x1 * x1 / (rx * rx) + y1 * y1 / (ry * ry); if (L > 1) { rx *= Math.sqrt(L); ry *= Math.sqrt(L); }
  const sg = large === sweep ? -1 : 1;
  const k = sg * Math.sqrt(Math.max(0, (rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1) / (rx * rx * y1 * y1 + ry * ry * x1 * x1)));
  const cx1 = k * rx * y1 / ry, cy1 = -k * ry * x1 / rx;
  const cx = cp * cx1 - sp * cy1 + (p0[0] + p1[0]) / 2, cy = sp * cx1 + cp * cy1 + (p0[1] + p1[1]) / 2;
  const ang = (u, v) => Math.atan2(v, u);
  const t1 = ang((x1 - cx1) / rx, (y1 - cy1) / ry);
  let dt = ang((-x1 - cx1) / rx, (-y1 - cy1) / ry) - t1;
  if (!sweep && dt > 0) dt -= 2 * Math.PI; if (sweep && dt < 0) dt += 2 * Math.PI;
  const out = [];
  for (let k2 = 1; k2 <= 16; k2++) { const t = t1 + dt * k2 / 16; out.push([cx + rx * Math.cos(t) * cp - ry * Math.sin(t) * sp, cy + rx * Math.cos(t) * sp + ry * Math.sin(t) * cp]); }
  return out;
}
const ellipsePoly = (cx, cy, rx, ry) => Array.from({ length: 32 }, (_, k) => [cx + rx * Math.cos(k * Math.PI / 16), cy + ry * Math.sin(k * Math.PI / 16)]);
function elementPolys(n) {
  const A = n.attrs, f = (k, d = 0) => +(A[k] ?? d);
  if (n.tag === 'path') return pathPolys(A.d || '');
  if (n.tag === 'circle') return [ellipsePoly(f('cx'), f('cy'), f('r'), f('r'))];
  if (n.tag === 'ellipse') return [ellipsePoly(f('cx'), f('cy'), f('rx'), f('ry'))];
  if (n.tag === 'rect') { const x = f('x'), y = f('y'), w = f('width'), h = f('height'); return [[[x, y], [x + w, y], [x + w, y + h], [x, y + h]]]; }
  return [];
}
const fillOf = (n, inh) => { const m = (n.attrs.style || '').match(/(?:^|;)\s*fill\s*:\s*([^;]+)/); return m ? m[1].trim() : n.attrs.fill || inh; };

// one view's layers -> its leaf elements: { layer, fill, svg, polys }
function leaves(layers, names) {
  const out = [];
  for (const L of names) {
    const s = layers[L]; if (!s) continue;
    const walk = (n, M, tf, fill) => {
      for (const c of n.children || []) {
        if (!c.tag || c.tag === 'defs') continue;
        const M2 = c.attrs.transform ? mm(M, parseTransform(c.attrs.transform)) : M;
        const t2 = c.attrs.transform ? [...tf, c.attrs.transform] : tf, f2 = fillOf(c, fill);
        if (c.tag === 'g' || c.tag === 'svg') walk(c, M2, t2, f2);
        else if (['path', 'circle', 'ellipse', 'rect'].includes(c.tag) && f2 !== 'none') {
          const polys = elementPolys(c).map((p) => p.map((q) => ap(M2, q)));
          if (!polys.length) continue;
          const cc = { ...c, attrs: { ...c.attrs } }; delete cc.attrs.transform;
          const markup = `<g${t2.length ? ` transform="${t2.join(' ')}"` : ''}>${serialize(cc)}</g>`;
          out.push({ layer: L, fill: L === 'skin' ? 'currentColor' : f2, svg: markup, polys });
        }
      }
    };
    walk(parse(`<svg>${s}</svg>`), I, [], 'black');
  }
  for (const e of out) {
    const pts = e.polys.flat();
    e.y0 = Math.min(...pts.map((p) => p[1])); e.y1 = Math.max(...pts.map((p) => p[1]));
    e.area = e.polys.reduce((acc, p) => acc + Math.abs(p.reduce((s2, q, k) => { const r = p[(k + 1) % p.length]; return s2 + q[0] * r[1] - r[0] * q[1]; }, 0)) / 2, 0);
    e.c = [pts.reduce((s2, p) => s2 + p[0], 0) / pts.length, pts.reduce((s2, p) => s2 + p[1], 0) / pts.length];
  }
  return out;
}
// the element's horizontal extent at height y (all its outlines), or null
function rowSpan(polys, y) {
  let lo = Infinity, hi = -Infinity;
  for (const p of polys) for (let k = 0; k < p.length; k++) {
    const a = p[k], b = p[(k + 1) % p.length];
    if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) { const x = a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]); lo = Math.min(lo, x); hi = Math.max(hi, x); }
  }
  return lo <= hi ? [lo, hi] : null;
}
const group = (e) => ({ skin: 'skin', eyes: 'eyes' }[e.layer] || (/^mouth-/.test(e.layer) ? 'mouth' : 'char'));

// views: { front: {layer: markup}, side: {...} } (the composed base + character
// layers); returns { volumes, cards } for src/headturn.js
export function turnData(views) {
  const names = ['back', 'under', 'skin', 'eyes', 'mouth-1', 'mouth-2', 'mouth-3', 'over'];
  const F = leaves(views.front.layers, names), S = leaves(views.side.layers, names);
  const used = new Set(), volumes = [], cards = [], mismatch = [];
  let skinVol = null;
  const sideOf = new Map();
  const pairedTo = new Map();              // front element -> its side element's index
  for (const a of [...F].sort((p, q) => q.area - p.area)) {
    let best = null;
    // A pair of mirrored front parts (two earrings, two ears) is one side
    // part seen from the side (the far one is hidden behind the head): the
    // second of the pair shares the first one's side element.
    const twin = [...pairedTo.keys()].find((m) => m.layer === a.layer && m.fill === a.fill && Math.abs(m.c[0]) > 0.15
      && Math.abs(m.c[0] + a.c[0]) < 0.1 && Math.abs(m.c[1] - a.c[1]) < 0.08);
    if (twin) best = { iou: 1, j: pairedTo.get(twin) };
    else S.forEach((b, j) => {
      if (used.has(j) || group(b) !== group(a) || (/^mouth-/.test(a.layer) && b.layer !== a.layer)) return;
      const ov = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0), un = Math.max(a.y1, b.y1) - Math.min(a.y0, b.y0);
      const iou = un > 0 ? ov / un : 0;
      if (iou > 0.4 && (!best || iou > best.iou)) best = { iou, j };
    });
    const b = best ? S[best.j] : null;
    const vol = b && a.area > MIN_AREA && ((group(a) === 'skin' && !skinVol) || group(a) === 'char');
    if (best) used.add(best.j);
    if (vol) pairedTo.set(a, best.j);
    if (vol) {
      // over the front drawing's height; where the side drawing ends
      // sooner (heights that don't quite match), its nearest full row is
      // used with the depth scaled to this row's width (a rounded cap)
      const rows = [], side = [];
      for (let y = a.y0 + STEP / 2; y < a.y1; y += STEP) { const fx = rowSpan(a.polys, y); if (fx) side.push([y, fx, rowSpan(b.polys, y)]); }
      const full = side.filter((r) => r[2]);
      if (Math.abs(a.y0 - b.y0) > 0.03 || Math.abs(a.y1 - b.y1) > 0.03) mismatch.push(`${a.layer}/${b.layer}: front ${a.y0.toFixed(2)}…${a.y1.toFixed(2)}, side ${b.y0.toFixed(2)}…${b.y1.toFixed(2)}`);
      for (const [y, fx, sz0] of side) {
        let sz = sz0;
        if (!sz && full.length) {
          // depth = this row's width × the volume's usual depth-to-width ratio, centred as the nearest full row
          const n = full.reduce((p, q) => (Math.abs(q[0] - y) < Math.abs(p[0] - y) ? q : p));
          const ratios = full.map((r) => (r[2][1] - r[2][0]) / (r[1][1] - r[1][0] || 1)).sort((p, q) => p - q);
          const zc = (n[2][0] + n[2][1]) / 2, az = (fx[1] - fx[0]) / 2 * ratios[ratios.length >> 1];
          sz = [zc - az, zc + az];
        }
        if (sz) rows.push([r4(y), r4((fx[0] + fx[1]) / 2), r4((fx[1] - fx[0]) / 2), r4((sz[0] + sz[1]) / 2), r4((sz[1] - sz[0]) / 2)]);
      }
      const v = { layer: a.layer, sideLayer: b.layer, fill: a.fill, rows };
      volumes.push(v);
      if (group(a) === 'skin') skinVol = v;
    } else {
      cards.push({ el: a, plane: 'front' });
      if (b) sideOf.set(a, b);
    }
  }
  S.forEach((b, j) => { if (!used.has(j) || [...sideOf.values()].includes(b)) cards.push({ el: b, plane: 'side' }); });
  // front cards: on the skin volume's front surface at their centre (outside it, its middle depth)
  const surf = (x, y) => {
    if (!skinVol?.rows.length) return 0;
    const row = skinVol.rows.reduce((p, q) => (Math.abs(q[0] - y) < Math.abs(p[0] - y) ? q : p));
    const k = 1 - ((x - row[1]) / row[2]) ** 2;
    return row[3] + (k > 0 ? row[4] * Math.sqrt(k) : 0);
  };
  // side cards: on the near side, as far out as the front eyes (or 0.15)
  const eyes = F.filter((e) => e.layer === 'eyes');
  const side = eyes.length ? eyes.reduce((s2, e) => s2 + Math.abs(e.c[0]), 0) / eyes.length : 0.15;
  return {
    volumes,
    cards: cards.map(({ el, plane }) => ({ layer: el.layer, plane, at: el.c.map(r4), svg: el.svg, ...(plane === 'front' ? { depth: r4(surf(...el.c)) } : {}) })),
    side: r4(side),
    ...(mismatch.length ? { mismatch } : {}),
  };
}
