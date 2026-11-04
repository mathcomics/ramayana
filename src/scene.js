// Panels and screens: a panel definition (JSON, optional background SVG) in,
// SVG out. Browser-safe: no file access; the caller passes the assets.
// Language: docs/panels.md.

import { renderFigure, buildShapes, characterLook } from './figure.js';

// ---- geometry -------------------------------------------------------------
// A screen is 360 × 720 units (phone portrait). A panel spans the width and
// a share of the height.
export const SCREEN = { w: 360, h: 720 };
export const SIZES = { full: 720, half: 360, third: 240 };
export const SLOTS = { left: 0.14, 'center-left': 0.32, center: 0.5, 'center-right': 0.68, right: 0.86 };

// Rows: where the ground line sits (fraction of panel height, from the top)
// and how big a head-unit is. Front is the default row.
const ROWS = {
  full:  { back: { ground: 0.47, unit: 11 }, mid: { ground: 0.7, unit: 15 }, front: { ground: 0.95, unit: 20 } },
  half:  { back: { ground: 0.62, unit: 11 }, mid: { ground: 0.78, unit: 15 }, front: { ground: 0.93, unit: 20 } },
  third: { back: { ground: 0.6, unit: 9 },  mid: { ground: 0.78, unit: 12 }, front: { ground: 0.92, unit: 15 } },
};
const ROW_ORDER = ['back', 'mid', 'front'];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const setPath = (o, path, v) => { const k = path.split('.'); let t = o; while (k.length > 1) { const p = k.shift(); t = t[p] ??= {}; } t[k[0]] = v; };
const clone = (o) => JSON.parse(JSON.stringify(o));

// ---- one panel --------------------------------------------------------------
// assets: { species, poses, characters, faces, props, grounds }
//   species:  { monkey: {...}, male: {...}, female: {...} }
//   poses:    [ {name, ...} ]          (data/poses.json .poses)
//   characters: data/characters.json  faces: data/faces.json
//   props:    data/props.json          grounds: data/grounds.json
// background: optional SVG text drawn in the panel's coordinates (360 × h).
// Returns { svg (inner markup, panel coordinates), w, h, issues: [..] }.
export function renderPanel(panel, assets, background = '', idPrefix = 'p') {
  const size = SIZES[panel.size] ? panel.size : 'half';
  const W = SCREEN.w, H = SIZES[size];
  const zoom = panel.zoom ?? 1;           // figures only: "small in the panel"
  const issues = [];
  const grounds = assets.grounds?.grounds || {};
  const ground = grounds[panel.ground] || panel.ground || grounds[assets.grounds?.default] || '#efe8db';
  if (panel.ground && !grounds[panel.ground] && !/^#/.test(panel.ground)) issues.push(`ground "${panel.ground}" not in data/grounds.json`);

  const row = (r) => {
    const R = ROWS[size][r] || ROWS[size].front;
    if (r && !ROWS[size][r]) issues.push(`row "${r}" unknown (back | mid | front)`);
    return { y: R.ground * H, unit: R.unit };
  };

  // -- figures: resolve character, pose, size, box ----------------------------
  const chars = assets.characters.characters;
  const figs = (panel.figures || []).map((f, i) => {
    const c = chars.find((x) => x.id === f.who);
    if (!c) { issues.push(`figure ${i + 1}: unknown character "${f.who}"`); return null; }
    const base = assets.poses.find((p) => p.name === f.pose);
    if (!base) issues.push(`figure ${i + 1} (${f.who}): unknown pose "${f.pose}", using stand`);
    const pose = clone(base || assets.poses.find((p) => p.name === 'stand') || {});
    if (f.mouth) pose.mouth = f.mouth;
    if (f.headView) pose.headView = f.headView;
    if (f.hands) { if (f.hands.near) setPath(pose, 'near.arm.hand', f.hands.near); if (f.hands.far) setPath(pose, 'far.arm.hand', f.hands.far); }
    for (const [k, v] of Object.entries(f.adjust || {})) setPath(pose, k, v);
    const look = characterLook(c, assets.characters.palette, assets.faces);
    const S = assets.species[look.species];
    const r = row(f.row || 'front');
    const unit = r.unit * zoom * (f.scale ?? 1);
    const { bbox } = buildShapes(S, pose, look.outfit);
    return { f, i, c, pose, look, S, row: f.row || 'front', groundY: r.y - (f.lift ?? 0) * unit, unit,
      halfW: ((bbox.x1 - bbox.x0) / 2) * unit, facing: f.facing === 'left' ? -1 : 1, x: null };
  }).filter(Boolean);

  // -- props: placeholders until the artist's SVG exists ------------------------
  const lib = assets.props?.props || {};
  const props = (panel.props || []).map((p, i) => {
    const def = lib[p.prop];
    if (!def) issues.push(`prop "${p.prop}" not in data/props.json`);
    const r = row(p.row || 'front');
    const unit = r.unit * (p.scale ?? 1);
    const [w, h] = (def?.size || [2, 2]).map((v) => v * unit);
    if (!def?.svg) issues.push(`prop "${p.prop}" not drawn yet (placeholder)`);
    return { p, i, def, row: p.row || 'front', groundY: r.y, w, h, halfW: w / 2, x: null, layer: p.layer || 'back' };
  });

  // -- placement: slots first, then relations ---------------------------------
  const slotX = (at, what) => {
    if (typeof at === 'string') {
      if (!(at in SLOTS)) { issues.push(`${what}: unknown slot "${at}"`); return W / 2; }
      return SLOTS[at] * W;
    }
    return null;
  };
  const all = [...figs.map((o) => ({ kind: 'fig', o })), ...props.map((o) => ({ kind: 'prop', o }))];
  const byId = (id) => figs.find((o) => o.f.who === id || o.f.id === id) || props.find((o) => o.p.prop === id || o.p.id === id);
  for (const { o } of all) { const at = (o.f || o.p).at ?? 'center'; o.x = slotX(at, (o.f?.who || o.p?.prop)); }
  for (let pass = 0; pass < 3; pass++) {
    for (const { o } of all) {
      const at = (o.f || o.p).at;
      if (!at || typeof at === 'string') continue;
      const [rel, target] = Object.entries(at).find(([k]) => ['before', 'behind', 'beside', 'left-of', 'right-of'].includes(k)) || [];
      const t = target && byId(target);
      if (!t) { if (pass === 0) issues.push(`${o.f?.who || o.p?.prop}: relation target "${target}" not in panel`); o.x ??= W / 2; continue; }
      if (t.x == null) continue;
      const gap = (at.gap ?? 0.3) * (o.unit || t.unit || 20);
      const d = o.halfW + t.halfW + gap;
      const tf = t.facing || 1;
      const sign = rel === 'before' ? tf : rel === 'behind' ? -tf : rel === 'left-of' ? -1 : rel === 'right-of' ? 1
        : (t.x < W / 2 ? 1 : -1); // beside: toward the open side
      o.x = t.x + sign * d;
    }
  }
  for (const { o } of all) o.x += ((o.f || o.p).nudge ?? 0) * (o.unit || 20);

  // -- draw -----------------------------------------------------------------
  let s = `<rect width="${W}" height="${H}" fill="${esc(ground)}"/>`;
  if (background) s += `<g class="background">${background}</g>`;
  const drawProp = (o) => {
    if (o.def?.svg) return `<g transform="translate(${o.x - o.halfW} ${o.groundY - o.h}) scale(${o.w / o.def.size[0]} ${o.h / o.def.size[1]})">${o.def.svg}</g>`;
    const x = o.x - o.halfW, y = o.groundY - o.h;
    return `<g class="placeholder"><rect x="${x}" y="${y}" width="${o.w}" height="${o.h}" fill="#000" fill-opacity="0.06" stroke="#7a6f62" stroke-width="1" stroke-dasharray="4 3"/>` +
      `<text x="${o.x}" y="${y + o.h / 2}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.max(8, Math.min(14, o.w / 6))}" fill="#7a6f62" text-anchor="middle" dominant-baseline="middle">${esc(o.p.prop)}</text></g>`;
  };
  for (const r of ROW_ORDER) {
    props.filter((o) => o.row === r && o.layer === 'back').forEach((o) => { s += drawProp(o); });
    figs.filter((o) => o.row === r).forEach((o) => {
      s += renderFigure(o.S, o.pose, { x: o.x, y: o.groundY, scale: o.unit, facing: o.facing,
        colors: o.look.colors, outfit: o.look.outfit, face: o.look.face }).svg;
    });
    props.filter((o) => o.row === r && o.layer === 'front').forEach((o) => { s += drawProp(o); });
  }
  // clip ids from renderFigure are global; keep panels independent
  s = s.replace(/id="(face\d+[^"]*)"/g, `id="${idPrefix}-$1"`).replace(/url\(#(face\d+[^)]*)\)/g, `url(#${idPrefix}-$1)`);
  return { svg: s, w: W, h: H, issues };
}

// ---- screens --------------------------------------------------------------
// Panels are packed in order: a full panel is one screen; halves and thirds
// stack until the screen is full. A panel can force a new screen with
// "newScreen": true.
export function packScreens(panels) {
  const screens = [];
  let cur = null, used = 0;
  for (const p of panels) {
    const h = SIZES[p.size] || SIZES.half;
    if (!cur || used + h > SCREEN.h + 0.5 || p.newScreen) { cur = []; screens.push(cur); used = 0; }
    cur.push(p); used += h;
  }
  return screens;
}

// One screen as a standalone SVG. backgrounds: { panelId: svgText }.
export function renderScreen(panels, assets, backgrounds = {}, opts = {}) {
  let y = 0, s = '', issues = [];
  const gap = opts.gap ?? 4;
  panels.forEach((p, i) => {
    const r = renderPanel(p, assets, backgrounds[p.id] || '', `${(p.id || 'p' + i).replace(/\W/g, '_')}`);
    s += `<svg data-panel="${esc(p.id)}" x="0" y="${y}" width="${r.w}" height="${r.h}" viewBox="0 0 ${r.w} ${r.h}" overflow="hidden">${r.svg}</svg>`;
    issues.push(...r.issues.map((m) => `${p.id}: ${m}`));
    y += r.h + gap;
  });
  const H = Math.max(y - gap, 1);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SCREEN.w} ${H}" width="${SCREEN.w}" height="${H}">` +
    `<rect width="${SCREEN.w}" height="${H}" fill="${opts.gutter || '#fffdf8'}"/>${s}</svg>`;
  return { svg, issues };
}

// Background SVG files: keep only the drawing (everything inside <svg>),
// minus a layer labelled "guide".
export function backgroundInner(svgText) {
  if (!svgText) return '';
  const m = svgText.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/);
  let inner = m ? m[1] : svgText;
  inner = inner.replace(/<(sodipodi:namedview|metadata)\b[\s\S]*?(\/>|<\/\1>)/g, '');
  inner = inner.replace(/<g\b[^>]*(inkscape:label|id)="guide"[^>]*>[\s\S]*?<\/g>/g, '');
  inner = inner.replace(/<!--[\s\S]*?-->/g, '');
  inner = inner.replace(/\s(inkscape|sodipodi):[\w-]+="[^"]*"/g, '');    // editor-only attributes
  inner = inner.replace(/<(sodipodi|inkscape):[\w-]+\b[\s\S]*?(\/>|<\/(sodipodi|inkscape):[\w-]+>)/g, '');
  return inner;
}
