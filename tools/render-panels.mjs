// Render panel screens to PNG for checking, and list issues and needs.
//
//   node tools/render-panels.mjs [section-prefix]   ->  out/panels/<section>/screen-N.png
//                                                       out/panels/<section>.png (all screens side by side)
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { root, loadAssets, loadSections } from './panels-lib.mjs';
import { packScreens, renderScreen, SCREEN } from '../src/scene.js';

const only = process.argv[2];
const assets = loadAssets();
for (const sec of loadSections().filter((s) => !only || s.name.startsWith(only))) {
  const out = join(root, 'out/panels', sec.name);
  mkdirSync(out, { recursive: true });
  const screens = packScreens(sec.panels);
  let strip = '', x = 0;
  screens.forEach((ps, i) => {
    const { svg, issues } = renderScreen(ps, assets, sec.backgrounds);
    writeFileSync(join(out, `screen-${i + 1}.svg`), svg);
    execFileSync('rsvg-convert', ['-z', '2', '-o', join(out, `screen-${i + 1}.png`), join(out, `screen-${i + 1}.svg`)]);
    strip += `<g transform="translate(${x} 30)">${svg}</g><text x="${x}" y="20" font-family="Helvetica" font-size="13" fill="#555">${ps.map((p) => p.id).join(' + ')}</text>`;
    x += SCREEN.w + 24;
    issues.filter((m) => !/placeholder/.test(m)).forEach((m) => console.log('  !', m));
  });
  const W = x - 24, H = 30 + 728;
  writeFileSync(join(root, 'out/panels', `${sec.name}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/>${strip}</svg>`);
  execFileSync('rsvg-convert', ['-z', '1.5', '-o', join(root, 'out/panels', `${sec.name}.png`), join(root, 'out/panels', `${sec.name}.svg`)]);
  const needs = [...new Set(sec.panels.flatMap((p) => p.needs || []))];
  console.log(`${sec.name}: ${sec.panels.length} panels, ${screens.length} screens -> out/panels/${sec.name}.png`);
  if (needs.length) console.log('  needs:', needs.join('; '));
}
