// Panels: a panel definition (JSON, optional background SVG) in, SVG out.
// Browser-safe: no file access; the caller passes the assets.
// Language: docs/design/panels.md.
//
// Delivery is a vertical scroll of panels. Every panel is the full width
// (360 units) and `tall` × its width high.

import { renderFigure, buildShapes, characterLook, normalizePose, parseCloth } from './figure.js';

export const PANEL_W = 360;
export const DEFAULT_TALL = 1.5;
// A prop with no drawing yet: a labelled dashed box, [width, height] in head-units.
export const PLACEHOLDER = [2, 2];
export const SLOTS = { left: 0.14, 'center-left': 0.32, center: 0.5, 'center-right': 0.68, right: 0.86 };

// Rows (docs/design/panels.md, Rows): where an entry stands, and how big.
// front / mid / back are one-point perspective with the horizon as eye
// level: a row at depth t (0 = the bottom edge, 1 = the horizon) has its
// ground line at t × horizon and a man's head at HEAD_TOP − t × (HEAD_TOP −
// horizon), so a man (MAN head-units) is HEAD_TOP × (1 − t) of the panel
// whatever the horizon. Shares are of the panel height.
export const DEPTH = { front: 0.08, mid: 0.4, back: 0.7 };
export const HEAD_TOP = 0.75;
// A man standing straight, feet to the top of the head, in head-units: the
// drawn male's own proportions (a big comic head, not the academic 7.5).
// A test checks it against the drawings.
export const MAN = 6.1;
// closeup: a man standing just in front of the panel, ground line a panel
// below its bottom edge, his head at HEAD_TOP: the panel shows him from
// about the waist up.
export const CLOSEUP_GROUND = -1;
export const ROW_NAMES = ['top', 'horizon', 'back', 'mid', 'front', 'floor', 'closeup'];
// The horizon (panel field `horizon`, default HORIZON): height above the
// bottom edge as a share of the panel. Row "horizon" stands things on it,
// far away: HORIZON_UNIT px per head-unit in a 1.5 panel (540 tall).
export const HORIZON = 0.37;
export const HORIZON_UNIT = 16;
const REF_H = 540;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const setPath = (o, path, v) => { const k = path.split('.'); let t = o; while (k.length > 1) { const p = k.shift(); t = t[p] ??= {}; } t[k[0]] = v; };
const clone = (o) => JSON.parse(JSON.stringify(o));

// Panel heights, as a multiple of the panel's width: 1.5 (the usual
// panel), 1 (square) and 0.6 (a strip). Anything taller is too tall.
export const TALLS = [0.6, 1, 1.5];
const validTall = (panel) => { const t = Number(panel.tall ?? DEFAULT_TALL); return TALLS.includes(t) ? t : null; };
export const panelHeight = (panel) => Math.round(PANEL_W * (validTall(panel) ?? DEFAULT_TALL));

// assets: { species, poses, characters, faces, props, grounds }
// id: the panel's id (its file name); not part of the JSON.
// background: optional SVG markup in the panel's coordinates (360 × h).
// Returns { svg (complete <svg>), w, h, issues: [..] }.
export function renderPanel(panel, assets, { id = 'panel', background = '' } = {}) {
  const W = PANEL_W, H = panelHeight(panel);
  const issues = [];
  if (validTall(panel) == null) issues.push(`tall ${JSON.stringify(panel.tall)}: use ${TALLS.join(', ')}`);
  if (panel.size != null) issues.push(`size is now tall (height ÷ width): 0.75 → 1.5, 0.5 → 1, 0.3 → 0.6`);
  const grounds = assets.grounds?.grounds || {};
  const ground = grounds[panel.ground] || panel.ground || grounds[assets.grounds?.default] || '#efe8db';
  if (panel.ground && !grounds[panel.ground] && !/^#/.test(panel.ground)) issues.push(`ground "${panel.ground}" not in data/grounds.json`);

  // sky: a colour above the horizon (a ground name or a hex); horizon = its
  // height above the panel's bottom edge, as a share of the panel height
  const sky = panel.sky ? (grounds[panel.sky] || panel.sky) : null;
  if (panel.sky && !grounds[panel.sky] && !/^#/.test(panel.sky)) issues.push(`sky "${panel.sky}" not in data/grounds.json`);
  const horizonY = H * (1 - (panel.horizon ?? HORIZON));

  for (const k of ['shot', 'zoom']) if (panel[k] != null) issues.push(`"${k}" is retired: rows set every size (docs/design/panels.md, Rows)`);
  const hz = panel.horizon ?? HORIZON;
  const unitAt = (t) => HEAD_TOP * (1 - t) * H / MAN;
  // row: a name or a number (the bottom edge as a share of the panel
  // height). y = the ground line in panel units; top: the entry hangs
  // from the panel's top edge instead (its top edge on it).
  const row = (r = 'front') => {
    if (typeof r === 'number') return { y: H * (1 - r), unit: unitAt(DEPTH.front) };
    if (r === 'top') return { y: 0, top: true, unit: unitAt(DEPTH.front) };
    if (r === 'horizon') return { y: horizonY, unit: HORIZON_UNIT * H / REF_H };
    if (r === 'floor') return { y: H, unit: unitAt(DEPTH.front) };
    if (r === 'closeup') return { y: H * (1 - CLOSEUP_GROUND), unit: (HEAD_TOP - CLOSEUP_GROUND) * H / MAN };
    if (!(r in DEPTH)) issues.push(`row "${r}" unknown (${ROW_NAMES.join(' | ')}, or a number)`);
    const t = DEPTH[r] ?? DEPTH.front;
    return { y: H * (1 - t * hz), unit: unitAt(t) };
  };

  // -- one list: figures ("character") and props ("prop"), drawn in order -------
  // Later entries draw over earlier ones; a prop before the figures is
  // scenery, after them a foreground that hides them. Older panels and lab
  // drafts with a separate `props` list (layer back / front) fold in around
  // the figures; "who" is the old name of "character".
  const chars = assets.characters.characters;
  const lib = assets.props?.props || {};
  const legacy = (panel.props || []).map(({ layer, ...p }) => ({ p, front: layer === 'front' }));
  const entries = [
    ...legacy.filter((e) => !e.front).map((e) => e.p),
    ...(panel.figures || []),
    ...legacy.filter((e) => e.front).map((e) => e.p),
  ];

  let nFig = 0;
  const makeFig = (f) => {
    const i = ++nFig, who = f.character ?? f.who;
    const c = chars.find((x) => x.id === who);
    if (!c) { issues.push(`figure ${i}: unknown character "${who}"`); return null; }
    const base = assets.poses.find((p) => p.name === f.pose);
    if (!base) issues.push(`figure ${i} (${who}): unknown pose "${f.pose}", using step-hang`);
    const pose = clone(base || assets.poses.find((p) => p.name === 'step-hang') || {});
    if (f.mouth) pose.mouth = f.mouth;
    if (typeof f.turn === 'number') setPath(pose, 'spine.turn', f.turn);   // head turn, degrees, + to its right
    // limbs are right / left (older panels: near = right, far = left)
    const side = (k) => k.replace(/^near\./, 'right.').replace(/^far\./, 'left.');
    if (f.hands) for (const [h, v] of Object.entries(f.hands)) setPath(pose, side(`${h}.arm.hand`), v);
    for (const [k, v] of Object.entries(f.adjust || {})) setPath(pose, side(k), v);
    const look = characterLook(c, assets.characters.palette, assets.faces, f.cloth);
    if (f.cloth && !look.colors.cloth) issues.push(`figure ${i} (${who}): unknown cloth "${f.cloth}"`);
    const S = assets.species[look.species];
    const r = row(f.row);
    const unit = r.unit * (f.scale ?? 1);
    const view = f.view === 'front' ? 'front' : 'side';
    // every character has a drawn face; there is no generated fallback
    const { bbox, headAnchor, joints } = buildShapes(S, pose, look.outfit, view, look.bodyScale, look.who);
    const headView = headAnchor.view ?? (view === 'front' ? 'front' : normalizePose(pose).headView);
    if (!look.face?.[headView]?.head) issues.push(`figure ${i} (${who}): no drawn ${headView} face (the ${headView} layer of data/faces/${who}.svg)`);
    const groundY = r.top ? -bbox.y0 * unit : r.y;
    return { f, fi: i - 1, name: f.id || who, pose, view, look, S, groundY, unit,
      halfW: ((bbox.x1 - bbox.x0) / 2) * unit, halfW1: (bbox.x1 - bbox.x0) / 2, pelvisX: joints?.spine?.pelvis?.[0] ?? 0,
      facing: f.facing === 'left' ? -1 : 1, x: null };
  };

  const makeProp = (p) => {
    const def = lib[p.prop];
    if (!def) issues.push(`prop "${p.prop}" not drawn yet: no data/props/${p.prop}.svg (placeholder)`);
    if (p.layer) issues.push(`prop "${p.prop}": "layer" is retired — order the entries instead`);
    const r = row(p.row);
    const unit = r.unit * (p.scale ?? 1);
    const [w0, h0] = (def?.size || PLACEHOLDER).map((v) => v * unit);
    // rotate: degrees clockwise about the drawing's centre; the prop then
    // stands on the bottom of its rotated box (e.g. 90 turns the sideways fire upright)
    const rot = p.rotate ?? 0, rr = rot * Math.PI / 180;
    const [w, h] = rot ? [Math.abs(w0 * Math.cos(rr)) + Math.abs(h0 * Math.sin(rr)), Math.abs(w0 * Math.sin(rr)) + Math.abs(h0 * Math.cos(rr))] : [w0, h0];
    if (rot && p.on) issues.push(`prop "${p.prop}": "rotate" with "on" — the anchors are not rotated`);
    // recolor: def.recolor names the drawing's role colours ({ body, cloth }).
    // "character" takes a character's colours; "body" / "cloth" override (hex,
    // or a cloth palette name; a pattern suffix keeps the base colour).
    const cid = p.character ?? p.who;
    let svg = def?.svg;
    if (svg && def.recolor && (cid || p.body || p.cloth)) {
      const c = cid ? chars.find((x) => x.id === cid) : null;
      if (cid && !c) issues.push(`prop "${p.prop}": unknown character "${cid}"`);
      const clothName = p.cloth ?? c?.cloth;
      const want = { body: p.body ?? c?.body,
        cloth: clothName && (parseCloth(clothName, assets.characters.palette.cloth).color ?? clothName) };
      for (const [role, from] of Object.entries(def.recolor)) {
        if (want[role]) svg = svg.replaceAll(`fill:${from}`, `fill:${want[role]}`);
      }
    }
    return { p, name: p.id || p.prop, def, svg, groundY: r.top ? h : r.y, unit, w, h, w0, h0, rot, halfW: w / 2, x: null,
      facing: p.facing === 'left' ? -1 : 1 };   // drawings face right; left mirrors
  };

  const all = entries.map((e, i) => {
    if (e.prop) return makeProp(e);
    if (e.character || e.who) return makeFig(e);
    issues.push(`entry ${i + 1}: needs "character" or "prop"`);
    return null;
  }).filter(Boolean);
  const props = all.filter((o) => o.p);

  // -- placement: number or slot first, then relations --------------------------
  // "nudge": the one fine shift after placement (by at/row, a relation or
  // "on"), in the entry's own head-units: a number is across, [dx, dy] is
  // across and up (+ up). It is part of the entry's place, so whatever sits
  // on it or is placed by it follows. "lift" is retired; with "on", the
  // prop places the entry and at/row do nothing.
  for (const o of all) {
    const e = o.f || o.p, n = e.nudge ?? 0;
    if (e.lift != null) issues.push(`${o.name}: "lift" is retired — use "nudge": [0, ${e.lift}]`);
    if (e.on) for (const k of ['at', 'row']) if (e[k] != null) issues.push(`${o.name}: "${k}" does nothing with "on" — the prop places it; shift with "nudge"`);
    const ok = typeof n === 'number' || (Array.isArray(n) && n.length === 2 && n.every((v) => typeof v === 'number'));
    if (!ok) issues.push(`${o.name}: "nudge" takes a number or [dx, dy]`);
    [o.dx, o.dy] = !ok ? [0, 0] : typeof n === 'number' ? [n, 0] : n;
    if (!e.on) o.groundY -= o.dy * o.unit;
  }
  for (const o of all) {
    const at = (o.f || o.p).at ?? 'center';
    if (typeof at === 'number') o.x = at * W + o.dx * o.unit;
    else if (typeof at === 'string') {
      if (!(at in SLOTS)) issues.push(`${o.name}: unknown position "${at}"`);
      o.x = ((SLOTS[at] ?? 0.5) * W) + o.dx * o.unit;
    }
  }
  const RELS = ['before', 'behind', 'beside', 'left-of', 'right-of'];
  // "on": a figure (or another prop) sits or stands on a prop's anchor, at
  // the prop's scale. "<prop>" uses the seat anchor; "<prop>#<anchor>"
  // names another (e.g. stand). A prop stands with its bottom centre on it.
  // A `face` anchor is different: it takes the head alone, centred on the
  // anchor and drawn to the anchor circle's size — a face in a sound bubble.
  const seatOn = (o) => {
    const e = o.f || o.p;
    const [tname, aname = 'seat'] = String(e.on).split('#');
    const t = props.find((x) => x !== o && x.name === tname);
    const seat = t?.def?.anchors?.[aname];
    if (!seat) { issues.push(`${o.name}: "on" needs a prop with a "${aname}" anchor in the panel ("${e.on}")`); if (o.f) o.f = { ...o.f, on: undefined }; else o.p = { ...o.p, on: undefined }; return; }
    if (t.x == null) return;
    if (aname === 'face') {                     // the head alone, no ground contact
      if (!o.f) { issues.push(`${o.name}: a "face" anchor takes a figure, not a prop ("${e.on}")`); return; }
      o.headOnly = true;
      o.unit = (seat[2] || 1) * t.unit * (e.scale ?? 1);
      o.halfW = ((o.S.head?.width ?? 1) / 2) * o.unit;
      o.groundY = t.groundY - t.h + seat[1] * t.unit - o.dy * o.unit;   // the head's centre, not a ground line
      o.x = t.x + t.facing * (seat[0] * t.unit - t.halfW) + o.dx * o.unit;
      return;
    }
    o.unit = t.unit * (e.scale ?? 1);
    if (o.f) o.halfW = o.halfW1 * o.unit;
    else { [o.w, o.h] = (o.def?.size || PLACEHOLDER).map((v) => v * o.unit); o.halfW = o.w / 2; }
    o.groundY = t.groundY - t.h + seat[1] * t.unit - o.dy * o.unit;
    o.x = t.x + t.facing * (seat[0] * t.unit - t.halfW) - (o.f ? o.pelvisX * o.unit * o.facing : 0) + o.dx * o.unit;
  };
  for (let pass = 0; pass < 3; pass++) {
    for (const o of all) {
      if ((o.f || o.p).on) { seatOn(o); continue; }
      const at = (o.f || o.p).at;
      if (!at || typeof at !== 'object') continue;
      const [rel, target] = Object.entries(at).find(([k]) => RELS.includes(k)) || [];
      const t = target && all.find((x) => x.name === target);
      if (!t) { if (pass === 0) issues.push(`${o.name}: relation target "${target}" not in panel`); o.x ??= W / 2; continue; }
      if (t.x == null) continue;
      const d = o.halfW + t.halfW + (at.gap ?? 0) * o.unit;
      const tf = t.facing || 1;
      const sign = rel === 'before' ? tf : rel === 'behind' ? -tf : rel === 'left-of' ? -1 : rel === 'right-of' ? 1 : (t.x < W / 2 ? 1 : -1);
      o.x = t.x + sign * d + o.dx * o.unit;
    }
  }
  for (const o of all) o.x ??= W / 2;

  // -- draw: ground, sky, background, then the list in order ---------------------
  // ids are unique per panel and figure, so panels can share a page
  const pre = String(id).replace(/\W/g, '_');
  // a grounds.json colour is a hex; [top, bottom] (or { "vertical": [..] }),
  // a vertical gradient; { "horizontal": [left, right] }, a horizontal one —
  // over the rect it fills
  let defs = '';
  const fill = (g, key) => {
    const horiz = Array.isArray(g?.horizontal);
    const c = Array.isArray(g) ? g : horiz ? g.horizontal : g?.vertical;
    if (!Array.isArray(c)) return esc(g);
    const gid = `${pre}-${key}`;
    defs += `<linearGradient id="${gid}" x1="0" y1="0" x2="${horiz ? 1 : 0}" y2="${horiz ? 0 : 1}">` +
      c.map((col, i) => `<stop offset="${c.length > 1 ? i / (c.length - 1) : 0}" stop-color="${esc(col)}"/>`).join('') + `</linearGradient>`;
    return `url(#${gid})`;
  };
  let s = `<rect width="${W}" height="${H}" fill="${fill(ground, 'ground')}"/>`;
  if (sky) s += `<rect width="${W}" height="${Math.max(0, horizonY)}" fill="${fill(sky, 'sky')}"/>`;
  if (defs) s = `<defs>${defs}</defs>` + s;
  if (background) s += `<g class="background">${background}</g>`;
  const drawProp = (o) => {
    const x = o.x - o.halfW, y = o.groundY - o.h;
    if (o.svg && o.rot) return `<g transform="translate(${o.x} ${o.groundY - o.h / 2}) rotate(${o.rot}) translate(${o.facing < 0 ? o.w0 / 2 : -o.w0 / 2} ${-o.h0 / 2}) scale(${o.facing * o.unit} ${o.unit})">${o.svg}</g>`;
    if (o.svg) return `<g transform="translate(${o.facing < 0 ? x + o.w : x} ${y}) scale(${o.facing * o.unit} ${o.unit})">${o.svg}</g>`;
    return `<g class="placeholder"><rect x="${x}" y="${y}" width="${o.w}" height="${o.h}" fill="#000" fill-opacity="0.06" stroke="#7a6f62" stroke-width="1.2" stroke-dasharray="5 4"/>` +
      `<text x="${o.x}" y="${y + o.h / 2}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.max(9, Math.min(16, o.w / 6))}" fill="#7a6f62" text-anchor="middle" dominant-baseline="middle">${esc(o.p.prop)}</text></g>`;
  };
  all.forEach((o) => {
    s += o.p ? drawProp(o)
      : renderFigure(o.S, o.pose, { ...o.look, x: o.x, y: o.groundY, scale: o.unit, facing: o.facing,
        view: o.view, headOnly: o.headOnly, id: `${pre}-f${o.fi}` }).svg;
  });
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
