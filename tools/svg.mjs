// Small SVG helpers for tools/import-faces.mjs: a minimal XML tree (enough
// for SVG written by drawing apps).

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
