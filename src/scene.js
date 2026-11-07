// Panels: a panel definition (JSON, optional background SVG) in, SVG out.
// Browser-safe: no file access; the caller passes the assets.
// Language: docs/design/panels.md.
//
// Delivery is a vertical scroll of panels. Every panel is the full width
// (360 units) and `size` × one screen height (720 units) tall.

import { renderFigure, buildShapes, characterLook, normalizePose } from './figure.js';

export const SCREEN = { w: 360, h: 720 };
export const DEFAULT_SIZE = 0.75;
export const SLOTS = { left: 0.14, 'center-left': 0.32, center: 0.5, 'center-right': 0.68, right: 0.86 };

// Rows. Figures scale with the panel: unit = units per head-unit in a 0.75
// panel (540 tall), and in proportion for other sizes. A male figure is
// ~7.5 head-units, so the front row is ~2/3 of the panel height.
// ground = height of the ground line above the panel's bottom edge, as a
// share of the panel height.
//
// A panel's `shot` picks a set of rows (from the artist's layouts in
// layouts/<size>-<shot>.svg; docs/design/panels.md):
// - far:  small figures, deep rows (the default)
// - wide: whole figures, bigger, rows close together (layouts/0.75-wide.svg)
// - mid:  close; the front row is cut at the thighs, the ground lines are
//         below the panel (negative), the panel crops the figures
//         (layouts/0.75-mid.svg)
export const SHOTS = {
  far: {
    front: { unit: 46, ground: 0.03 },
    mid:   { unit: 34, ground: 0.17 },
    back:  { unit: 24, ground: 0.34 },
  },
  wide: {
    front: { unit: 55.2, ground: 0.031 },
    mid:   { unit: 40.8, ground: 0.085 },
    back:  { unit: 28.8, ground: 0.136 },
  },
  mid: {
    front: { unit: 110.4, ground: -0.735 },
    mid:   { unit: 81.6, ground: -0.568 },
    back:  { unit: 57.6, ground: -0.429 },
  },
};
export const ROWS = SHOTS.far;
// The horizon (panel field `horizon`, default HORIZON): height above the
// bottom edge as a share of the panel. Row "horizon" stands things on it,
// far away: HORIZON_UNIT px per head-unit in a 0.75 panel (from the
// artist's 0.5-deer-running layout); `scale` for nearer things.
export const HORIZON = 0.37;
export const HORIZON_UNIT = 16;
const REF_H = 540;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const setPath = (o, path, v) => { const k = path.split('.'); let t = o; while (k.length > 1) { const p = k.shift(); t = t[p] ??= {}; } t[k[0]] = v; };
const clone = (o) => JSON.parse(JSON.stringify(o));

// Panel sizes, as a share of a phone screen's height: 0.75 (the usual
// panel), 0.5 and 0.3 (a strip). A full screen (1) is too tall.
export const SIZES = [0.3, 0.5, 0.75];
const validSize = (panel) => { const s = Number(panel.size ?? DEFAULT_SIZE); return SIZES.includes(s) ? s : null; };
export const panelHeight = (panel) => Math.round(SCREEN.h * (validSize(panel) ?? DEFAULT_SIZE));

// assets: { species, poses, characters, faces, props, grounds }
// id: the panel's id (its file name); not part of the JSON.
// background: optional SVG markup in the panel's coordinates (360 × h).
// Returns { svg (complete <svg>), w, h, issues: [..] }.
export function renderPanel(panel, assets, { id = 'panel', background = '' } = {}) {
  const W = SCREEN.w, H = panelHeight(panel);
  const zoom = panel.zoom ?? 1;           // figures only: "small in the panel"
  const issues = [];
  if (validSize(panel) == null) issues.push(`size ${JSON.stringify(panel.size)}: use ${SIZES.join(', ')}`);
  const grounds = assets.grounds?.grounds || {};
  const ground = grounds[panel.ground] || panel.ground || grounds[assets.grounds?.default] || '#efe8db';
  if (panel.ground && !grounds[panel.ground] && !/^#/.test(panel.ground)) issues.push(`ground "${panel.ground}" not in data/grounds.json`);

  // sky: a colour above the horizon (a ground name or a hex); horizon = its
  // height above the panel's bottom edge, as a share of the panel height
  const sky = panel.sky ? (grounds[panel.sky] || panel.sky) : null;
  if (panel.sky && !grounds[panel.sky] && !/^#/.test(panel.sky)) issues.push(`sky "${panel.sky}" not in data/grounds.json`);
  const horizonY = H * (1 - (panel.horizon ?? HORIZON));

  const shot = SHOTS[panel.shot ?? 'far'] || SHOTS.far;
  if (panel.shot && !SHOTS[panel.shot]) issues.push(`shot "${panel.shot}" unknown (${Object.keys(SHOTS).join(' | ')})`);
  const row = (r = 'front') => {
    if (r === 'horizon') return { y: horizonY, unit: HORIZON_UNIT * H / REF_H };
    if (!shot[r]) issues.push(`row "${r}" unknown (back | mid | front)`);
    const R = shot[r] || shot.front;
    return { y: H * (1 - R.ground), unit: R.unit * H / REF_H };
  };

  // -- figures ------------------------------------------------------------------
  const chars = assets.characters.characters;
  const figs = (panel.figures || []).map((f, i) => {
    const c = chars.find((x) => x.id === f.who);
    if (!c) { issues.push(`figure ${i + 1}: unknown character "${f.who}"`); return null; }
    const base = assets.poses.find((p) => p.name === f.pose);
    if (!base) issues.push(`figure ${i + 1} (${f.who}): unknown pose "${f.pose}", using stand`);
    const pose = clone(base || assets.poses.find((p) => p.name === 'stand') || {});
    if (f.mouth) pose.mouth = f.mouth;
    if (typeof f.turn === 'number') setPath(pose, 'spine.turn', f.turn);   // head turn, degrees, + to its right
    // limbs are right / left (older panels: near = right, far = left)
    const side = (k) => k.replace(/^near\./, 'right.').replace(/^far\./, 'left.');
    if (f.hands) for (const [h, v] of Object.entries(f.hands)) setPath(pose, side(`${h}.arm.hand`), v);
    for (const [k, v] of Object.entries(f.adjust || {})) setPath(pose, side(k), v);
    const look = characterLook(c, assets.characters.palette, assets.faces, f.cloth);
    if (f.cloth && !look.colors.cloth) issues.push(`figure ${i + 1} (${f.who}): unknown cloth "${f.cloth}"`);
    const S = assets.species[look.species];
    const r = row(f.row);
    const unit = r.unit * zoom * (f.scale ?? 1);
    const view = f.view === 'front' ? 'front' : 'side';
    // every character has a drawn face; there is no generated fallback
    const { bbox, headAnchor, joints } = buildShapes(S, pose, look.outfit, view, look.bodyScale, look.who);
    const headView = headAnchor.view ?? (view === 'front' ? 'front' : normalizePose(pose).headView);
    if (!look.face?.[headView]?.head) issues.push(`figure ${i + 1} (${f.who}): no drawn ${headView} face (the ${headView} layer of data/faces/${f.who}.svg)`);
    return { f, name: f.id || f.who, pose, view, look, S, groundY: r.y - (f.lift ?? 0) * unit, unit,
      halfW: ((bbox.x1 - bbox.x0) / 2) * unit, halfW1: (bbox.x1 - bbox.x0) / 2, pelvisX: joints?.spine?.pelvis?.[0] ?? 0,
      facing: f.facing === 'left' ? -1 : 1, x: null };
  }).filter(Boolean);

  // -- props (placeholders until the artist's SVG exists) -----------------------
  const lib = assets.props?.props || {};
  const props = (panel.props || []).map((p) => {
    const def = lib[p.prop];
    if (!def) issues.push(`prop "${p.prop}" not in data/props.json`);
    else if (!def.svg) issues.push(`prop "${p.prop}" not drawn yet (placeholder)`);
    const r = row(p.row);
    const unit = r.unit * (p.scale ?? 1);
    const [w, h] = (def?.size || [2, 2]).map((v) => v * unit);
    return { p, name: p.id || p.prop, def, groundY: r.y - (p.lift ?? 0) * unit, unit, w, h, halfW: w / 2, x: null, layer: p.layer || 'back',
      facing: p.facing === 'left' ? -1 : 1 };   // drawings face right; left mirrors
  });

  // -- placement: number or slot first, then relations --------------------------
  const all = [...figs, ...props];
  for (const o of all) {
    const at = (o.f || o.p).at ?? 'center';
    if (typeof at === 'number') o.x = at * W;
    else if (typeof at === 'string') {
      if (!(at in SLOTS)) issues.push(`${o.name}: unknown position "${at}"`);
      o.x = (SLOTS[at] ?? 0.5) * W;
    }
  }
  const RELS = ['before', 'behind', 'beside', 'left-of', 'right-of'];
  // "on": a figure sits on a prop's seat anchor, at the prop's scale
  const seatOn = (o) => {
    const t = props.find((x) => x.name === o.f.on);
    const seat = t?.def?.anchors?.seat;
    if (!seat) { issues.push(`${o.name}: "on" needs a prop with a seat in the panel ("${o.f.on}")`); o.f = { ...o.f, on: undefined }; return; }
    if (t.x == null) return;
    o.unit = t.unit * (o.f.scale ?? 1);
    o.halfW = o.halfW1 * o.unit;
    o.groundY = t.groundY - t.h + seat[1] * t.unit;
    o.x = t.x + t.facing * (seat[0] * t.unit - t.halfW) - o.pelvisX * o.unit * o.facing;
  };
  for (let pass = 0; pass < 3; pass++) {
    for (const o of all) {
      if (o.f?.on) { seatOn(o); continue; }
      const at = (o.f || o.p).at;
      if (!at || typeof at !== 'object') continue;
      const [rel, target] = Object.entries(at).find(([k]) => RELS.includes(k)) || [];
      const t = target && all.find((x) => x.name === target);
      if (!t) { if (pass === 0) issues.push(`${o.name}: relation target "${target}" not in panel`); o.x ??= W / 2; continue; }
      if (t.x == null) continue;
      const d = o.halfW + t.halfW + (at.gap ?? 0) * o.unit;
      const tf = t.facing || 1;
      const sign = rel === 'before' ? tf : rel === 'behind' ? -tf : rel === 'left-of' ? -1 : rel === 'right-of' ? 1 : (t.x < W / 2 ? 1 : -1);
      o.x = t.x + sign * d;
    }
  }
  for (const o of all) { o.x ??= W / 2; o.x += ((o.f || o.p).nudge ?? 0) * o.unit; }

  // -- draw: ground, background, back props, figures in list order, front props
  let s = `<rect width="${W}" height="${H}" fill="${esc(ground)}"/>`;
  if (sky) s += `<rect width="${W}" height="${Math.max(0, horizonY)}" fill="${esc(sky)}"/>`;
  if (background) s += `<g class="background">${background}</g>`;
  const drawProp = (o) => {
    const x = o.x - o.halfW, y = o.groundY - o.h;
    if (o.def?.svg) return `<g transform="translate(${o.facing < 0 ? x + o.w : x} ${y}) scale(${o.facing * o.unit} ${o.unit})">${o.def.svg}</g>`;
    return `<g class="placeholder"><rect x="${x}" y="${y}" width="${o.w}" height="${o.h}" fill="#000" fill-opacity="0.06" stroke="#7a6f62" stroke-width="1.2" stroke-dasharray="5 4"/>` +
      `<text x="${o.x}" y="${y + o.h / 2}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.max(9, Math.min(16, o.w / 6))}" fill="#7a6f62" text-anchor="middle" dominant-baseline="middle">${esc(o.p.prop)}</text></g>`;
  };
  props.filter((o) => o.layer !== 'front').forEach((o) => { s += drawProp(o); });
  // ids are unique per panel and figure, so panels can share a page
  const pre = String(id).replace(/\W/g, '_');
  figs.forEach((o, i) => {
    s += renderFigure(o.S, o.pose, { ...o.look, x: o.x, y: o.groundY, scale: o.unit, facing: o.facing,
      view: o.view, id: `${pre}-f${i}` }).svg;
  });
  props.filter((o) => o.layer === 'front').forEach((o) => { s += drawProp(o); });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" data-panel="${esc(id)}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" overflow="hidden">${s}</svg>`;
  return { svg, w: W, h: H, issues };
}

// Background SVG files: keep only the drawing (everything inside <svg>),
// minus a layer labelled "guide" and editor-only markup.
export function backgroundInner(svgText) {
  if (!svgText) return '';
  const m = svgText.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/);
  let inner = m ? m[1] : svgText;
  inner = inner.replace(/<(sodipodi:namedview|metadata)\b[\s\S]*?(\/>|<\/\1>)/g, '');
  inner = inner.replace(/<g\b[^>]*(inkscape:label|id)="guide"[^>]*>[\s\S]*?<\/g>/g, '');
  inner = inner.replace(/<!--[\s\S]*?-->/g, '');
  inner = inner.replace(/\s(inkscape|sodipodi):[\w-]+="[^"]*"/g, '');
  inner = inner.replace(/<(sodipodi|inkscape):[\w-]+\b[\s\S]*?(\/>|<\/(sodipodi|inkscape):[\w-]+>)/g, '');
  return inner;
}
