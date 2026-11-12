// SVG geometry for the importers: transforms as 2x3 matrices
// [a b c d e f] (parseTransform, mm, ap), any SVG path as sampled polygons
// (pathPolys), and r4, the 4-decimal rounding the imported data is stored at.

export const r4 = (v) => Math.round(v * 1e4) / 1e4;

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
