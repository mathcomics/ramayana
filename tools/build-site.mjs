// Build the reader site: one page per section, each a vertical run of
// screens (phone portrait). Static files only; Cloudflare Pages serves _site/.
//
//   node tools/build-site.mjs        ->  _site/index.html, _site/<section>.html
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { root, loadAssets, loadSections } from './panels-lib.mjs';
import { packScreens, renderScreen } from '../src/scene.js';

const out = join(root, '_site');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const assets = loadAssets();
const sections = loadSections();

const css = `
:root { --bg: #fffdf8; --fg: #2b2620; --muted: #8a7f72; }
* { box-sizing: border-box; }
html { scroll-snap-type: y proximity; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.4 "Helvetica Neue", Helvetica, Arial, sans-serif; }
main { max-width: 480px; margin: 0 auto; }
.screen { scroll-snap-align: start; margin: 0 0 12px; }
.screen svg { display: block; width: 100%; height: auto; }
header, nav { padding: 16px; }
h1 { font-size: 20px; margin: 0 0 4px; font-weight: 600; }
nav a { display: block; padding: 12px 0; color: var(--fg); text-decoration: none; border-bottom: 1px solid #eee5d8; }
.muted { color: var(--muted); font-size: 13px; }
.next { display: block; text-align: center; padding: 24px; color: var(--fg); }
`;
const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>${css}</style></head>
<body><main>${body}</main></body></html>`;

const links = [];
sections.forEach((sec, si) => {
  const screens = packScreens(sec.panels);
  const body = screens.map((ps, i) => {
    const { svg } = renderScreen(ps, assets, sec.backgrounds, { gap: 4 });
    return `<section class="screen" id="s${i + 1}" aria-label="${ps.map((p) => p.id).join(', ')}">${svg}</section>`;
  }).join('\n');
  const next = sections[si + 1];
  writeFileSync(join(out, `${sec.name}.html`), page(sec.title,
    `<header><a class="muted" href="index.html">Ramayana</a><h1>${sec.title}</h1></header>${body}` +
    (next ? `<a class="next" href="${next.name}.html">${next.title} →</a>` : '')));
  links.push(`<a href="${sec.name}.html">${sec.title} <span class="muted">· ${screens.length} screens</span></a>`);
});
writeFileSync(join(out, 'index.html'), page('Ramayana', `<header><h1>Ramayana</h1><div class="muted">Warli-inspired panels</div></header><nav>${links.join('')}</nav>`));
console.log(`_site/: ${sections.length} section(s)`);
