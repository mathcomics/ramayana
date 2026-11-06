// dump each face element (leaf) with its accumulated transforms, per view and layer
import { readFile } from '../../faces-lib.mjs';
import { parse, serialize } from '../../svg.mjs';
import { writeFileSync } from 'node:fs';
const [base, who, out] = process.argv.slice(2);
const B = readFile(`data/faces/base/${base}.svg`), C = readFile(`data/faces/${who}.svg`);
const res = {};
const fillOf = (n, inh) => { const m = (n.attrs.style || '').match(/fill\s*:\s*([^;]+)/); return m ? m[1].trim() : n.attrs.fill || inh; };
for (const v of ['front', 'side']) {
  res[v] = [];
  const take = (src, names) => { for (const L of names) { const s = src[v]?.layers[L]; if (!s) continue;
    const root = parse(`<svg>${s}</svg>`);
    const walk = (n, tf, fill) => { for (const c of n.children || []) { if (!c.tag) continue;
      const t = c.attrs.transform ? [...tf, c.attrs.transform] : tf, f = fillOf(c, fill);
      if (c.tag === 'g' || c.tag === 'svg') walk(c, t, f);
      else if (['path', 'circle', 'ellipse', 'rect'].includes(c.tag)) { const cc = { ...c, attrs: { ...c.attrs } }; delete cc.attrs.transform;
        res[v].push({ layer: L, fill: f, svg: `<g transform="${t.join(' ')}">${serialize(cc)}</g>` }); } } };
    walk(root, [], 'black'); } };
  take(B, ['skin', 'eyes', 'mouth-2']); take(C, ['back', 'under', 'over']);
}
writeFileSync(out, JSON.stringify(res, null, 1));
console.log(Object.fromEntries(Object.entries(res).map(([k, v]) => [k, v.map((e) => e.layer + ':' + e.fill)])));
