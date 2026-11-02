// Read hand-edited hair shapes back into the species file.
//
//   node tools/import-hair.mjs [file.svg ...]
//   (default: data/shapes/hair-female-front.svg and -side.svg)
//
// Takes the path with id="hair" from each file, flattens it to points in
// head-units (head centre at 0,0) and stores it in data/species/female.json
// as head.hairShape.front / .side. The renderer uses these instead of the
// generated hair. Group or path transforms (translate/scale/matrix) set by
// an editor are applied.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = process.argv.slice(2).length ? process.argv.slice(2)
  : ['front', 'side'].map((v) => join(root, `data/shapes/hair-female-${v}.svg`));

// ---- transforms -------------------------------------------------------
const I = [1, 0, 0, 1, 0, 0];
const mul = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
function parseTransform(t) {
  let m = I;
  for (const [, fn, args] of (t || '').matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const v = args.split(/[\s,]+/).filter(Boolean).map(Number);
    let n = I;
    if (fn === 'matrix') n = v;
    else if (fn === 'translate') n = [1, 0, 0, 1, v[0], v[1] || 0];
    else if (fn === 'scale') n = [v[0], 0, 0, v[1] ?? v[0], 0, 0];
    else if (fn === 'rotate') { const a = (v[0] * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
      n = [c, s, -s, c, 0, 0]; if (v.length > 2) n = mul(mul([1, 0, 0, 1, v[1], v[2]], n), [1, 0, 0, 1, -v[1], -v[2]]); }
    m = mul(m, n);
  }
  return m;
}
const apply = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

// ---- path flattening (M L H V C S Q T Z, absolute and relative; A as a line)
function flatten(d, steps = 8) {
  const tok = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) || [];
  let i = 0, cmd = '', p = [0, 0], start = [0, 0], c2 = null;
  const out = [];
  const num = () => Number(tok[i++]);
  const isNum = () => i < tok.length && !/[a-zA-Z]/.test(tok[i]);
  while (i < tok.length) {
    if (/[a-zA-Z]/.test(tok[i])) cmd = tok[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    const pt = () => { const x = num(), y = num(); return rel ? [p[0] + x, p[1] + y] : [x, y]; };
    if (C === 'Z') { p = start; c2 = null; continue; }
    if (C === 'M') { p = pt(); start = p; out.push(p); cmd = rel ? 'l' : 'L'; c2 = null; continue; }
    if (C === 'L') { p = pt(); out.push(p); c2 = null; }
    else if (C === 'H') { const x = num(); p = [rel ? p[0] + x : x, p[1]]; out.push(p); c2 = null; }
    else if (C === 'V') { const y = num(); p = [p[0], rel ? p[1] + y : y]; out.push(p); c2 = null; }
    else if (C === 'C' || C === 'S') {
      const a = C === 'C' ? pt() : (c2 ? [2 * p[0] - c2[0], 2 * p[1] - c2[1]] : p);
      const b = pt(), e = pt();
      for (let k = 1; k <= steps; k++) { const t = k / steps, u = 1 - t;
        out.push([u*u*u*p[0] + 3*u*u*t*a[0] + 3*u*t*t*b[0] + t*t*t*e[0], u*u*u*p[1] + 3*u*u*t*a[1] + 3*u*t*t*b[1] + t*t*t*e[1]]); }
      c2 = b; p = e;
    } else if (C === 'Q' || C === 'T') {
      const a = C === 'Q' ? pt() : (c2 ? [2 * p[0] - c2[0], 2 * p[1] - c2[1]] : p);
      const e = pt();
      for (let k = 1; k <= steps; k++) { const t = k / steps, u = 1 - t;
        out.push([u*u*p[0] + 2*u*t*a[0] + t*t*e[0], u*u*p[1] + 2*u*t*a[1] + t*t*e[1]]); }
      c2 = a; p = e;
    } else if (C === 'A') { for (let k = 0; k < 5; k++) num(); p = pt(); out.push(p); c2 = null; }
    else { i++; }
    while (isNum() && !['M', 'Z'].includes(C)) break;
  }
  return out;
}

// ---- read each file -----------------------------------------------------
const spPath = join(root, 'data/species/female.json');
const S = JSON.parse(readFileSync(spPath, 'utf8'));
S.head.hairShape = S.head.hairShape || {};
for (const f of files) {
  const view = /front/.test(basename(f)) ? 'front' : 'side';
  const src = readFileSync(f, 'utf8');
  const tag = src.match(/<path\b[^>]*\bid="hair"[^>]*>/s);
  if (!tag) { console.error(`${f}: no <path id="hair">`); process.exitCode = 1; continue; }
  const d = tag[0].match(/\sd="([^"]+)"/s)[1];
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
