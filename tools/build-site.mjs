// Build the reader site: an index of chapters and one page per chapter, a vertical scroll of panels
// (phone portrait, each the full width). Static files only; Cloudflare Pages serves _site/.
//
//   node tools/build-site.mjs        ->  _site/index.html (chapters), _site/<NN-name>.html
import { writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { root, loadAssets, loadSections, loadChapters, escXml as esc } from './lib.mjs';
import { renderPanel, findPose } from '../src/scene.js';
import { renderFigure, characterLook, parseColor } from '../src/figure.js';

const out = join(root, '_site');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const assets = loadAssets();
const sections = loadSections().filter((s) => !s.reference);   // panels/reference stays in the lab

// Chapters: every "## N. Title" in manuscript/scenes.md, in order. A chapter
// with a panel folder (panels/NN-*) gets a scrolling page; the others are
// listed on the index as still to come.
const byNumber = new Map(sections.map((sec) => [Number(sec.name.match(/^(\d+)/)?.[1]), sec]));
const chapters = loadChapters().map(({ n, title }) => ({ n, title, sec: byNumber.get(n) }));
for (const [n, sec] of byNumber) {      // a panel folder with no heading in scenes.md
  if (!chapters.some((c) => c.n === n)) chapters.push({ n, title: sec.title.replace(/^\d+\.\s*/, ''), sec });
}
chapters.sort((a, b) => a.n - b.n);
const ready = chapters.filter((c) => c.sec && c.sec.panels.length);

const css = `
:root { --bg: #fffdf8; --fg: #2b2620; --muted: #8a7f72; --line: #eee5d8; }
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.4 "Helvetica Neue", Helvetica, Arial, sans-serif; }
main { max-width: 480px; margin: 0 auto; }
a { color: inherit; }
figure { margin: 0 8px 7px; border-radius: 14px; overflow: hidden; }
figure svg { display: block; width: 100%; height: auto; }
ol.tiles { list-style: none; margin: 0; padding: 20px 0 40px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0; }
ol.tiles li { position: relative; }
ol.tiles .tile { display: block; aspect-ratio: 1; overflow: hidden; box-shadow: 5px 7px 14px rgba(0,0,0,.5); }
ol.tiles a.tile:active { transform: scale(.97); }
ol.tiles .tile svg { display: block; width: 100%; height: 100%; }
ol.tiles .soon { opacity: .35; filter: grayscale(.6); }
main.chapter { padding-top: 8px; padding-bottom: calc(96px + env(safe-area-inset-bottom)); }
.pager { position: fixed; left: 0; right: 0; bottom: calc(14px + env(safe-area-inset-bottom)); display: flex; justify-content: center; gap: 10px; pointer-events: none; z-index: 1; }
.pager a { pointer-events: auto; width: 56px; height: 56px; display: grid; place-items: center; border-radius: 18px; background: rgba(255,255,255,.5); color: #000; text-decoration: none; font-size: 24px; line-height: 1; box-shadow: 0 2px 10px rgba(0,0,0,.18); }
.pager a:active { transform: scale(.95); }
.pager .none { pointer-events: none; width: 56px; height: 56px; border-radius: 18px; background: rgba(255,255,255,.5); opacity: .3; box-shadow: 0 2px 10px rgba(0,0,0,.18); }
.pager svg { width: 26px; height: 26px; }
footer.links { display: flex; justify-content: center; gap: 24px; padding: 0 12px calc(32px + env(safe-area-inset-bottom)); }
footer.links a { display: grid; place-items: center; width: 64px; height: 64px; box-shadow: 5px 7px 14px rgba(0,0,0,.5); color: #fff; }
footer.links a:active { transform: scale(.95); }
footer.links svg { width: 55%; height: 55%; }
footer.links .github { background: #24292f; }
footer.links .instagram { background: linear-gradient(45deg, #f9ce34, #ee2a7b 50%, #6228d7); }
`;
const page = (title, body, cls) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(title)}</title><style>${css}</style></head>
<body><main${cls ? ` class="${cls}"` : ''}>${body}</main></body></html>`;
const HOME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2a1.2 1.2 0 0 1 .8.3l8.6 7.3a.9.9 0 0 1-.6 1.6H19v7.6a1.5 1.5 0 0 1-1.5 1.5h-3v-4.5a2.5 2.5 0 0 0-5 0v4.5h-3A1.5 1.5 0 0 1 5 20v-7.6H3.2a.9.9 0 0 1-.6-1.6l8.6-7.3a1.2 1.2 0 0 1 .8-.3z" fill="currentColor"/></svg>';
const ARROW = (dir) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${dir < 0 ? 'M17 4 5 12l12 8z' : 'M7 4l12 8-12 8z'}" fill="currentColor"/></svg>`;
const NONE = '<span class="none" aria-hidden="true"></span>';
const devanagari = (n) => String(n).replace(/\d/g, (d) => String.fromCharCode(0x966 + +d));
const file = (c) => `${c.sec.name}.html`;

ready.forEach((c, i) => {
  const sec = c.sec;
  const body = sec.panels.map(({ id, def }) => {
    const { svg } = renderPanel(def, assets, { id });
    return `<figure id="p${id}" aria-label="${esc(def.scene || id)}">${svg}</figure>`;
  }).join('\n');
  // Wordless: a floating group of buttons at the bottom — home (the index),
  // a solid arrow to the previous chapter, this chapter's Devanagari number,
  // and an arrow to the next (a faded empty button where there is none);
  // black on white.
  const prev = ready[i - 1], next = ready[i + 1];
  const link = (ch, content) => `<a href="${file(ch)}" aria-label="Chapter ${ch.n}">${content}</a>`;
  const pager = `<nav class="pager"><a href="index.html" aria-label="All chapters">${HOME}</a>` +
    (prev ? link(prev, ARROW(-1)) : NONE) + link(c, devanagari(c.n)) + (next ? link(next, ARROW(1)) : NONE) + `</nav>`;
  writeFileSync(join(out, file(c)), page(`${c.n}. ${c.title} · Ramayana`, `${body}${pager}`, 'chapter'));
});

// The index, wordless: a grid of square tiles, three to a row, one per
// chapter (panels/icons.json): a drawn face, a prop or a small cropped
// panel on the chapter's typical ground. Chapters to come are dimmed and not links; the title is
// only for screen readers.
const ICONS = JSON.parse(readFileSync(join(root, 'panels/icons.json'), 'utf8')).icons;
const GROUNDS = assets.grounds.grounds;
const NEUTRAL = new Set(['sand']);
const typicalGround = (sec) => {
  const n = {};
  for (const { def } of sec?.panels || []) { const g = def.ground || assets.grounds.default; n[g] = (n[g] || 0) + 1; }
  const ranked = Object.entries(n).sort((a, b) => b[1] - a[1]).map(([g]) => g);
  return ranked.find((g) => !NEUTRAL.has(g)) || ranked[0] || assets.grounds.default;
};
// a ground (name or hex) as a CSS background, its gradient as the panels draw it
const cssGround = (g) => {
  const v = GROUNDS[g] ?? g;
  if (Array.isArray(v)) return `linear-gradient(to bottom, ${v.join(', ')})`;
  if (v && typeof v === 'object' && v.horizontal) return `linear-gradient(to right, ${v.horizontal.join(', ')})`;
  return /^#[0-9a-f]{3,8}$/i.test(v) ? v : '#eee';
};
// An icon is one of
//   { "panel": {...}, "crop": [x, y, size] }: a square panel drawn by the
//     renderer (figures, poses, props, repeat), cropped to the square at
//     (x, y) of the given size in panel units (360 across; default all);
//     its ground defaults to the chapter's;
//   { "layers": [...] }: heads and props placed in the tile's own units
//     (100 across), which may run past the edges and are clipped:
//     { "character", "view": "front" | "side", "facing", "x", "y", "size" }
//     (a head alone, size its height; with "pose", the whole figure, its
//     feet on (x, y), size its head height) or { "prop", "x", "y", "size",
//     "rotate", "facing", "body" } (fitted in a size × size box, turned
//     degrees clockwise, recoloured);
//   { "character" } or { "prop", "rotate", "body" }: one such layer, centred.
let iconSeq = 0;
const iconFail = (m) => { throw new Error(`panels/icons.json: ${m}`); };
const headLayer = (L) => {
  const c = assets.characters.characters.find((x) => x.id === L.character) || iconFail(`unknown character "${L.character}"`);
  const look = characterLook(c, assets.characters.colors, assets.faces);
  const found = findPose(assets, L.pose || 'step-hang');
  if (found.error) iconFail(`pose "${L.pose}": ${found.error}`);
  const pose = JSON.parse(JSON.stringify(found.pose));
  const view = look.sideOnly || L.view === 'side' || (L.pose && L.view !== 'front') ? 'side' : 'front';
  // a whole figure (a layer naming a pose): feet on (x, y), size the height of its head
  if (L.pose) return renderFigure(assets.species[look.species], pose, { ...look, x: L.x ?? 50, y: L.y ?? 90, scale: L.size ?? 10,
    facing: L.facing === 'left' ? -1 : 1, view }).svg;
  // the head alone (as a sound-cry burst draws it), its centre on (x, y)
  return renderFigure(assets.species[look.species], pose, { ...look, x: L.x ?? 50, y: L.y ?? 52, scale: L.size ?? 58,
    facing: L.facing === 'left' ? -1 : 1, view, headOnly: true }).svg;
};
const propLayer = (L) => {
  const def = assets.props.props[L.prop];
  if (!def?.svg) iconFail(`no drawing for prop "${L.prop}"`);
  let svg = def.svg;
  if (L.body) {
    const col = parseColor(L.body, assets.characters.colors).color || iconFail(`unknown colour "${L.body}"`);
    if (!def.recolor?.body) iconFail(`prop "${L.prop}" names no body colour to recolour`);
    svg = svg.replaceAll(`fill:${def.recolor.body}`, `fill:${col}`);
  }
  // fitted (turned) in a size × size box centred on (x, y)
  const rot = L.rotate || 0, r = rot * Math.PI / 180, cx = L.x ?? 50, cy = L.y ?? 50;
  const [w, h] = def.size, bw = Math.abs(w * Math.cos(r)) + Math.abs(h * Math.sin(r)), bh = Math.abs(w * Math.sin(r)) + Math.abs(h * Math.cos(r));
  const k = (L.size ?? 72) / Math.max(bw, bh), fx = L.facing === 'left' ? -1 : 1;
  return `<g transform="rotate(${rot} ${cx} ${cy}) translate(${cx} ${cy}) scale(${fx * k} ${k}) translate(${-w / 2} ${-h / 2})">${svg}</g>`;
};
const iconSvg = (spec, n, ground) => {
  const tag = `i${++iconSeq}-`, uniq = (s) => s.replace(/(\sid="|url\(#|href="#)([^")]+)/g, `$1${tag}$2`);
  if (spec.panel) {
    const def = { tall: 1, ground, ...spec.panel };
    const r = renderPanel(def, assets, { id: `icon${n}` });
    const bad = r.issues.filter((m) => !/placeholder/.test(m));
    if (bad.length) iconFail(`chapter ${n}: ${bad.join('; ')}`);
    const [x, y, size] = spec.crop || [0, 0, r.w];
    return r.svg.replace(/ viewBox="[^"]*" width="\d+" height="\d+"/, ` viewBox="${x} ${y} ${size} ${size}" aria-hidden="true"`);
  }
  const layers = spec.layers || [spec];
  return `<svg viewBox="0 0 100 100" aria-hidden="true" overflow="hidden">${uniq(layers.map((L) => (L.prop ? propLayer(L) : headLayer(L))).join(''))}</svg>`;
};
// the two link tiles under the chapters: GitHub and Instagram
const LINKS = '<a class="github" href="https://github.com/mathcomics/ramayana" aria-label="GitHub">' +
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg></a>' +
  '<a class="instagram" href="https://www.instagram.com/ramayana.lilboox" aria-label="Instagram">' +
  '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.6" cy="6.4" r="1.2" fill="currentColor" stroke="none"/></svg></a>';
// each tile above the next, so its shadow falls on the tiles to its right and below
const tiles = chapters.map((c, i) => {
  const spec = ICONS[String(c.n)];
  const ground = spec?.ground || spec?.panel?.ground || typicalGround(c.sec);
  const art = spec ? iconSvg(spec, c.n, ground) : '';
  const style = `background:${cssGround(ground)}`;
  return c.sec && c.sec.panels.length
    ? `<li style="z-index:${chapters.length - i}"><a class="tile" href="${file(c)}" style="${style}" aria-label="${c.n}. ${esc(c.title)}">${art}</a></li>`
    : `<li style="z-index:${chapters.length - i}"><span class="tile soon" style="${style}" aria-label="${c.n}. ${esc(c.title)} (to come)">${art}</span></li>`;
});
writeFileSync(join(out, 'index.html'), page('Ramayana', `<ol class="tiles">${tiles.join('')}</ol>` +
  `<footer class="links">${LINKS}</footer>`));
console.log(`_site/: ${ready.length} of ${chapters.length} chapter(s) with panels`);
