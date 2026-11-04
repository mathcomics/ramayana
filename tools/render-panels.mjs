// Render panels for checking, and list issues and needs.
//
//   node tools/render-panels.mjs [section-prefix]
//     -> out/panels/<section>/<id>.png (each panel)
//        out/panels/<section>.png      (all panels, in columns)
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { root, loadAssets, loadSections, rsvg } from './lib.mjs';
import { renderPanel, SCREEN } from '../src/scene.js';

const only = process.argv[2];
const assets = loadAssets();
for (const sec of loadSections().filter((s) => !only || s.name.startsWith(only))) {
  const out = join(root, 'out/panels', sec.name);
  mkdirSync(out, { recursive: true });
  const COLS = 4, GAP = 24, LABEL = 22;
  const cols = Array(COLS).fill(0);
  let sheet = '';
  for (const { id, def } of sec.panels) {
    const r = renderPanel(def, assets, { id, background: sec.backgrounds[id] });
    writeFileSync(join(out, `${id}.svg`), r.svg);
    rsvg(join(out, `${id}.svg`), join(out, `${id}.png`), ['-z', '2']);
    const c = cols.indexOf(Math.min(...cols));              // shortest column
    const x = c * (SCREEN.w + GAP), y = cols[c];
    sheet += `<text x="${x}" y="${y + 15}" font-family="Helvetica" font-size="13" fill="#555">${id} · ${def.size ?? 0.75}</text>` +
      r.svg.replace('<svg ', `<svg x="${x}" y="${y + LABEL}" `);
    cols[c] += LABEL + r.h + GAP;
    r.issues.filter((m) => !/placeholder/.test(m)).forEach((m) => console.log(`  ! ${id}: ${m}`));
  }
  const W = COLS * (SCREEN.w + GAP) - GAP, H = Math.max(...cols);
  writeFileSync(join(root, 'out/panels', `${sec.name}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/>${sheet}</svg>`);
  rsvg(join(root, 'out/panels', `${sec.name}.svg`), join(root, 'out/panels', `${sec.name}.png`), ['-z', '1.2']);
  const needs = [...new Set(sec.panels.flatMap((p) => p.def.needs || []))];
  console.log(`${sec.name}: ${sec.panels.length} panels -> out/panels/${sec.name}.png`);
  if (needs.length) console.log('  needs:', needs.join('; '));
}
