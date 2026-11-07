// Build the reader site: an index of chapters and one page per chapter, a vertical scroll of panels
// (phone portrait, each the full width). Static files only; Cloudflare Pages serves _site/.
//
//   node tools/build-site.mjs        ->  _site/index.html (chapters), _site/<NN-name>.html
import { writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { root, loadAssets, loadSections } from './lib.mjs';
import { renderPanel } from '../src/scene.js';

const out = join(root, '_site');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const assets = loadAssets();
const sections = loadSections();

// Chapters: every "## N. Title" in manuscript/scenes.md, in order. A chapter
// with a panel folder (panels/NN-*) gets a scrolling page; the others are
// listed on the index as still to come.
const scenes = readFileSync(join(root, 'manuscript', 'scenes.md'), 'utf8');
const byNumber = new Map(sections.map((sec) => [Number(sec.name.match(/^(\d+)/)?.[1]), sec]));
const chapters = [...scenes.matchAll(/^## (\d+)\. (.+)$/gm)].map(([, n, title]) => ({
  n: Number(n), title: title.trim(), sec: byNumber.get(Number(n)),
}));
for (const [n, sec] of byNumber) {      // a panel folder with no heading in scenes.md
  if (!chapters.some((c) => c.n === n)) chapters.push({ n, title: sec.title.replace(/^\d+\.\s*/, ''), sec });
}
chapters.sort((a, b) => a.n - b.n);
const ready = chapters.filter((c) => c.sec && c.sec.panels.length);

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const css = `
:root { --bg: #fffdf8; --fg: #2b2620; --muted: #8a7f72; --line: #eee5d8; }
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.4 "Helvetica Neue", Helvetica, Arial, sans-serif; }
main { max-width: 480px; margin: 0 auto; }
a { color: inherit; }
header { padding: 20px 16px 16px; }
h1 { font-size: 22px; margin: 2px 0 0; font-weight: 600; }
.kicker { color: var(--muted); font-size: 13px; text-decoration: none; letter-spacing: .04em; text-transform: uppercase; }
figure { margin: 0 0 6px; }
figure svg { display: block; width: 100%; height: auto; }
ol.chapters { list-style: none; margin: 0; padding: 0 16px 32px; }
ol.chapters li { border-bottom: 1px solid var(--line); }
ol.chapters a, ol.chapters span.soon { display: flex; gap: 12px; align-items: baseline; padding: 14px 0; text-decoration: none; }
ol.chapters .num { width: 1.6em; text-align: right; color: var(--muted); font-variant-numeric: tabular-nums; }
ol.chapters .title { flex: 1; }
ol.chapters .meta { color: var(--muted); font-size: 13px; }
ol.chapters span.soon { color: var(--muted); }
.pager { display: flex; justify-content: space-between; gap: 12px; padding: 24px 16px 40px; font-size: 15px; }
.pager a { text-decoration: none; }
.pager .next { margin-left: auto; text-align: right; }
.pager small { display: block; color: var(--muted); font-size: 12px; }
`;
const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(title)}</title><style>${css}</style></head>
<body><main>${body}</main></body></html>`;
const file = (c) => `${c.sec.name}.html`;

ready.forEach((c, i) => {
  const sec = c.sec;
  const body = sec.panels.map(({ id, def }) => {
    const { svg } = renderPanel(def, assets, { id, background: sec.backgrounds[id] });
    return `<figure id="p${id}" aria-label="${esc(def.scene || id)}">${svg}</figure>`;
  }).join('\n');
  const prev = ready[i - 1], next = ready[i + 1];
  const pager = `<nav class="pager">` +
    (prev ? `<a href="${file(prev)}"><small>← Chapter ${prev.n}</small>${esc(prev.title)}</a>` : `<a href="index.html"><small>←</small>Chapters</a>`) +
    (next ? `<a class="next" href="${file(next)}"><small>Chapter ${next.n} →</small>${esc(next.title)}</a>` : `<a class="next" href="index.html"><small>↑</small>Chapters</a>`) +
    `</nav>`;
  writeFileSync(join(out, file(c)), page(`${c.n}. ${c.title} · Ramayana`,
    `<header><a class="kicker" href="index.html">Ramayana · Chapter ${c.n}</a><h1>${esc(c.title)}</h1></header>${body}${pager}`));
});

const items = chapters.map((c) => c.sec && c.sec.panels.length
  ? `<li><a href="${file(c)}"><span class="num">${c.n}</span><span class="title">${esc(c.title)}</span><span class="meta">${c.sec.panels.length} panels</span></a></li>`
  : `<li><span class="soon"><span class="num">${c.n}</span><span class="title">${esc(c.title)}</span><span class="meta">to come</span></span></li>`);
writeFileSync(join(out, 'index.html'), page('Ramayana',
  `<header><span class="kicker">Chapters</span><h1>Ramayana</h1></header><ol class="chapters">${items.join('')}</ol>`));
console.log(`_site/: ${ready.length} of ${chapters.length} chapter(s) with panels`);
