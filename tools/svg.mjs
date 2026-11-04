// Small SVG helpers for the import tools: a minimal XML tree (enough for
// SVG written by drawing apps), transforms and path flattening.

// ---- a minimal XML tree (enough for SVG written by drawing apps) ---------
export function parse(src) {
  const rootNode = { tag: '#root', attrs: {}, children: [] };
  const stack = [rootNode];
  const re = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|<!DOCTYPE[\s\S]*?>|<\/([\w:.-]+)\s*>|<([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(src))) {
    const top = stack[stack.length - 1];
    if (m[1]) { stack.pop(); continue; }
    if (m[2]) {
      const attrs = {};
      for (const a of m[3].matchAll(/([\w:.-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) attrs[a[1]] = a[3] ?? a[4];
      const node = { tag: m[2], attrs, children: [] };
      top.children.push(node);
      if (!m[4]) stack.push(node);
      continue;
    }
    if (m[5] && m[5].trim()) top.children.push({ text: m[5] });
  }
  return rootNode;
}
export const esc = (s) => String(s).replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);)/gi, '&amp;').replace(/"/g, '&quot;');
const SKIP_ATTR = /^(id|inkscape:.*|sodipodi:.*|xml:space)$/;
export function serialize(n) {
  if (n.text != null) return n.text;
  if (/^(sodipodi:|inkscape:|metadata$|title$|desc$)/.test(n.tag)) return '';
  const attrs = Object.entries(n.attrs).filter(([k]) => !SKIP_ATTR.test(k)).map(([k, v]) => ` ${k}="${esc(v)}"`).join('');
  const inner = n.children.map(serialize).join('');
  return inner ? `<${n.tag}${attrs}>${inner}</${n.tag}>` : `<${n.tag}${attrs}/>`;
}
export const label = (n) => (n.attrs['inkscape:label'] || n.attrs.id || '').trim().toLowerCase();

// A style attribute without display:… (a layer hidden in the editor is
// only an editing state).
export const withoutDisplay = (style = '') => style.split(';').filter((d) => d.trim() && !/^\s*display\s*:/.test(d)).join(';');

// ---- transforms -------------------------------------------------------
export const I = [1, 0, 0, 1, 0, 0];
export const mulMatrix = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
export function parseTransform(t) {
  let m = I;
  for (const [, fn, args] of (t || '').matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const v = args.split(/[\s,]+/).filter(Boolean).map(Number);
    let n = I;
    if (fn === 'matrix') n = v;
    else if (fn === 'translate') n = [1, 0, 0, 1, v[0], v[1] || 0];
    else if (fn === 'scale') n = [v[0], 0, 0, v[1] ?? v[0], 0, 0];
    else if (fn === 'rotate') { const a = (v[0] * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
      n = [c, s, -s, c, 0, 0]; if (v.length > 2) n = mulMatrix(mulMatrix([1, 0, 0, 1, v[1], v[2]], n), [1, 0, 0, 1, -v[1], -v[2]]); }
    m = mulMatrix(m, n);
  }
  return m;
}
export const apply = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

// ---- path flattening (M L H V C S Q T Z, absolute and relative; A as a line)
export function flatten(d, steps = 8) {
  const tok = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) || [];
  let i = 0, cmd = '', p = [0, 0], start = [0, 0], c2 = null;
  const out = [];
  const num = () => Number(tok[i++]);
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
  }
  return out;
}
