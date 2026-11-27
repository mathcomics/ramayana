// Panels: a panel definition (JSON) in, SVG out.
// Browser-safe: no file access; the caller passes the assets.
// Language: docs/design/panels.md.
//
// Delivery is a vertical scroll of panels. Every panel is the full width
// (360 units) and `tall` × its width high.

import { renderFigure, buildShapes, characterLook, parseColor, panelColors, DEFAULT_OUTFIT } from './figure.js';
import { headView, INTENDED_VIEWS } from './headturn.js';
import { poseComposer, splitPoseName } from './compose.js';

// A figure's pose: any <base>-<gesture> pair, composed from
// assets.poseParts (src/compose.js) and cached per asset set. There is no
// list of poses (docs/design/pose-picking.md).
// -> { pose } or { error } naming the half that is unknown.
const composedFor = new WeakMap();
export function findPose(assets, name) {
  const D = assets.poseParts;
  if (!D || typeof name !== 'string') return { error: 'unknown pose' };
  const [b, g] = splitPoseName(name);
  if (!D.bases[b]) return { error: `no base "${b}"` };
  if (!D.gestures[g]) return { error: `no gesture "${g}"` };
  let c = composedFor.get(assets);
  if (!c) composedFor.set(assets, (c = { compose: poseComposer(assets.species.male), poses: new Map() }));
  if (!c.poses.has(name)) c.poses.set(name, c.compose(D.bases, D.gestures, name));
  return { pose: c.poses.get(name) };
}

export const PANEL_W = 360;
export const DEFAULT_TALL = 1.5;
// A prop with no drawing yet: a labelled dashed box, [width, height] in head-units.
export const PLACEHOLDER = [2, 2];
export const SLOTS = { left: 0.14, 'center-left': 0.32, center: 0.5, 'center-right': 0.68, right: 0.86 };

// Depth (docs/design/panels.md, Depth): how far away an entry is, which
// sets where it stands and how big it is. One-point perspective with the
// horizon as eye level: at depth t (0 = the bottom edge, 1 = the horizon)
// the ground line is at t × horizon and a man's head at HEAD_TOP − t ×
// (HEAD_TOP − horizon), so a man (MAN head-units) is HEAD_TOP × (1 − t) of
// the panel whatever the horizon. Shares are of the panel height. front,
// mid and back name three depths.
export const DEPTH = { front: 0.08, mid: 0.4, back: 0.7 };
// the farthest numeric depth drawn: nearer the horizon a thing would vanish
export const MAX_DEPTH = 0.95;
export const HEAD_TOP = 0.75;
// A man standing straight, feet to the top of the head, in head-units: the
// drawn male's own proportions (a big comic head, not the academic 7.5).
// A test checks it against the drawings.
export const MAN = 6.1;
// closeup: a man standing just in front of the panel, ground line a panel
// below its bottom edge, his head at HEAD_TOP: the panel shows him from
// about the waist up.
export const CLOSEUP_GROUND = -1;
// depth by name: front, mid, back, horizon are distances; top, floor,
// closeup are framing (the top edge, the bottom edge, a raised camera)
export const DEPTH_NAMES = ['top', 'horizon', 'back', 'mid', 'front', 'floor', 'closeup'];
// The horizon (panel field `horizon`, default HORIZON): height above the
// bottom edge as a share of the panel. Depth "horizon" stands things on it,
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

// assets: { species, poseParts, characters, faces, props, grounds }
// id: the panel's id (its file name); not part of the JSON.
// Returns { svg (complete <svg>), w, h, issues: [..] }.
export function renderPanel(panel, assets, { id = 'panel' } = {}) {
  const W = PANEL_W, H = panelHeight(panel);
  const issues = [];
  // each figure's head: the view it wants and the drawn view used (tools/view-gaps.mjs)
  const heads = [];
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
  // mode "negative": the dramatic beat (a transformation, a major death) —
  // the whole ground black, every figure and prop a white silhouette
  const negative = panel.mode === 'negative';
  if (panel.mode != null && !negative) issues.push(`mode "${panel.mode}": the only mode is "negative"`);

  for (const k of ['shot', 'zoom']) if (panel[k] != null) issues.push(`"${k}" is retired: depth sets every size (docs/design/panels.md, Depth)`);
  const hz = panel.horizon ?? HORIZON;
  const unitAt = (t) => HEAD_TOP * (1 - t) * H / MAN;
  // camera "top": a top view, no perspective — a numeric depth is the
  // share of the panel height up the ground, at front size
  const camTop = panel.camera === 'top';
  if (panel.camera != null && !camTop) issues.push(`camera "${panel.camera}": the only camera is "top" (a top view)`);
  // depth: how far away — the ground line and the size together. A number:
  // 0 the bottom edge, 1 the horizon (negative: nearer than the frame,
  // bigger, its ground below the bottom edge); front, mid, back are 0.08,
  // 0.4, 0.7. horizon keeps its own small size. top, floor, closeup are
  // framing, not distances. y = the ground line in panel units; top: the
  // entry hangs from the panel's top edge instead (its top edge on it).
  const depth = (d = 'front', name = '') => {
    if (typeof d === 'number') {
      if (camTop) return { y: H * (1 - d), unit: unitAt(DEPTH.front) };
      if (d >= MAX_DEPTH) issues.push(`${name}: depth ${d} is at or past the horizon (1) — use "horizon", or less than ${MAX_DEPTH}`);
      const t = Math.min(d, MAX_DEPTH);
      return { y: H * (1 - t * hz), unit: unitAt(t) };
    }
    if (d === 'top') return { y: 0, top: true, unit: unitAt(DEPTH.front) };
    if (d === 'horizon') return { y: horizonY, unit: HORIZON_UNIT * H / REF_H };
    if (d === 'floor') return { y: H, unit: unitAt(DEPTH.front) };
    if (d === 'closeup') return { y: H * (1 - CLOSEUP_GROUND), unit: (HEAD_TOP - CLOSEUP_GROUND) * H / MAN };
    if (!(d in DEPTH)) issues.push(`${name}: depth "${d}" unknown (${DEPTH_NAMES.join(' | ')}, or a number)`);
    const t = DEPTH[d] ?? DEPTH.front;
    return { y: H * (1 - t * hz), unit: unitAt(t) };
  };
  // the retired "row" (old lab drafts): a number was a height in the panel
  // at front size; drawn as before, flagged (tools/migrate-depth.mjs converts)
  const legacyRow = (r) => (typeof r === 'number' ? { y: H * (1 - r), unit: unitAt(DEPTH.front) } : depth(r));
  const place = (e) => {
    const name = e.id || e.character || e.who || e.prop;
    if (e.row == null) return depth(e.depth, name);
    issues.push(`${name}: "row" is retired — use "depth" (how far: it sets the size too) and "nudge" to lift (node tools/migrate-depth.mjs converts)`);
    return e.depth != null ? depth(e.depth, name) : legacyRow(e.row);
  };

  // -- one list: figures ("character") and props ("prop"), drawn in order -------
  // Later entries draw over earlier ones; a prop before the figures is
  // scenery, after them a foreground that hides them. Older panels and lab
  // drafts with a separate `props` list (layer back / front) fold in around
  // the figures; "who" is the old name of "character".
  const chars = assets.characters.characters;
  const lib = assets.props?.props || {};
  const legacy = (panel.props || []).map(({ layer, ...p }) => ({ p, front: layer === 'front' }));
  const repeatSeen = {};
  let showSeen = 0;
  const seeded = (str) => {                                   // mulberry32 on a string hash
    let h = 2166136261;
    for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return () => { h = (h + 0x6D2B79F5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  const entries = [
    ...legacy.filter((e) => !e.front).map((e) => e.p),
    ...(panel.figures || []),
    ...legacy.filter((e) => e.front).map((e) => e.p),
  ].flatMap((e) => (e && e.show != null ? showPart(e) : [e]))
    .flatMap((e) => (e && e.repeat != null ? repeatProp(e) : [e]));

  // "show" on a figure: part of it only. "head-alone" is the head without
  // its body, placed like a prop (at, depth, scale, nudge, on) and turned by
  // its own rotate about its centre: the
  // entry stands for an empty `head-alone` prop and the figure on its
  // `face` anchor — a cut-off head, a head growing back. "without-head" is
  // the body with no head (figure.js `headless`).
  function showPart(e) {
    const name = e.id || e.character || e.who || e.prop;
    if (!(e.character || e.who)) { issues.push(`${name}: "show" is for figures`); const { show, ...rest } = e; return [rest]; }
    if (e.show === 'without-head') return [e];
    if (e.show !== 'head-alone') { issues.push(`${name}: "show" is "head-alone" or "without-head" ("${e.show}")`); const { show, ...rest } = e; return [rest]; }
    const { show, at, depth, scale, nudge, on, ...fig } = e;   // rotate stays on the head: it turns about its centre
    if (on && /#face$/.test(on)) { const { show: _, ...rest } = e; return [rest]; }   // already a head on a face anchor
    const id = `${name}~head${++showSeen}`;
    const prop = { prop: 'head-alone', id };
    for (const [k, v] of Object.entries({ at, depth, scale, nudge, on })) if (v != null) prop[k] = v;
    return [prop, { pose: 'stand-hang', ...fig, on: `${id}#face` }];   // the pose only tilts the head
  }

  // "repeat": a prop drawn several times in a row — a cluster of rocks, a
  // clump of lotuses. The entry as written is the middle copy; the others
  // stand beside it, left and right alternately outwards, on its ground line
  // (or its anchor), each its own size and turn, and drawn behind it.
  // `"repeat": 3`, or { n, gap, scale: [min, max], rotate: [min, max], seed }:
  // gap is the space between neighbours in the middle's head-units (negative
  // overlaps); each copy's size (× the middle's) and turn (degrees from the
  // middle's) is drawn from the range, seeded by the prop, the count and
  // `seed` — not by where it stands, so moving the entry keeps its copies.
  // The copies are named "<name>-left" / "-right" ("-left2" … further
  // out), so an entry can stand "on" one of them.
  function repeatProp(e) {
    const { repeat, ...mid } = e;
    const name = e.id || e.prop || e.character || e.who;
    if (!e.prop) { issues.push(`${name}: "repeat" is for props`); return [mid]; }
    const o = typeof repeat === 'number' ? { n: repeat } : repeat || {};
    const n = o.n ?? 3;
    if (!Number.isInteger(n) || n < 1 || n > 9) { issues.push(`${name}: "repeat" takes a count 1–9, or { n, gap, scale, rotate, seed }`); return [mid]; }
    const pair = (k, d) => {
      const v = o[k];
      if (v == null) return d;
      if (Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === 'number')) return v;
      issues.push(`${name}: repeat "${k}" takes [min, max]`);
      return d;
    };
    // a line into the picture ("to") varies less: its depth already shrinks it
    const [sc0, sc1] = pair('scale', o.to != null ? [0.85, 1.1] : [0.6, 1.05]), [ro0, ro1] = pair('rotate', o.to != null ? [-10, 10] : [-12, 12]);
    const key = `${e.prop}|${name}|${n}|${o.seed ?? 0}`;
    const rnd = seeded(`${key}|${(repeatSeen[key] = (repeatSeen[key] ?? -1) + 1)}`);
    const gap = typeof o.gap === 'number' ? o.gap : 0;
    const w1 = (lib[e.prop]?.size || PLACEHOLDER)[0];          // head-units at scale 1
    const sm = e.scale ?? 1, r0 = e.rotate ?? 0;
    if (o.to != null) return recede();
    // "to": { at, depth } — the copies run from the entry toward that point,
    // each touching the last (gap: the space between, in the copy's own
    // head-units), each sized by its own depth; named "<name>-1", "-2" …
    // outwards; drawn farthest first. The point gives the direction: the
    // line runs on past it if n asks for more.
    function recede() {
      const to = o.to, h1 = (lib[e.prop]?.size || PLACEHOLDER)[1];
      const d0 = typeof e.depth === 'number' ? e.depth : DEPTH[e.depth ?? 'front'];
      const at0 = typeof e.at === 'number' ? e.at : SLOTS[e.at ?? 'center'];
      if (!to || typeof to.at !== 'number' || typeof to.depth !== 'number') { issues.push(`${name}: repeat "to" takes { "at": 0–1, "depth": a number }`); return [mid]; }
      if (d0 == null || at0 == null || e.on != null || camTop) { issues.push(`${name}: repeat "to" needs the entry at a number or slot and a perspective depth (a number, front, mid or back), not "on" or a top view`); return [mid]; }
      const P = (at, t) => [at * W, H * (1 - t * hz)];
      const [x0, y0] = P(at0, d0), [x1, y1] = P(to.at, to.depth), len = Math.hypot(x1 - x0, y1 - y0);
      if (len < 1e-6) { issues.push(`${name}: repeat "to" is where the entry stands`); return [mid]; }
      const ux = (x1 - x0) / len, uy = (y1 - y0) / len;
      const tAt = (y) => (1 - y / H) / hz;
      const ext = (t, sc) => { const u = unitAt(t) * sc; return Math.abs(w1 * u * ux) + Math.abs(h1 * u * uy); };   // along the line, px
      const out = [];
      let cx = x0, cy = y0, t = d0, sc = sm;
      for (let k = 1; k < n; k++) {
        const scK = sm * (sc0 + (sc1 - sc0) * rnd()), roK = r0 + ro0 + (ro1 - ro0) * rnd();
        const half = ext(t, sc) / 2 + gap * unitAt(t) * sc;
        let d = half * 2;
        for (let it = 0; it < 8; it++) d = half + ext(Math.min(tAt(cy + uy * d), MAX_DEPTH), scK) / 2;
        const nt = tAt(cy + uy * d);
        if (nt >= MAX_DEPTH) { issues.push(`${name}: repeat "to" reaches the horizon after ${k - 1} cop${k === 2 ? 'y' : 'ies'}`); break; }
        cx += ux * d; cy += uy * d; t = nt; sc = scK;
        out.push({ ...mid, id: `${name}-${k}`, at: cx / W, depth: t, scale: scK, rotate: roK, _copy: true });
      }
      return [...out, mid].sort((a, b) => (b === mid ? d0 : b.depth) - (a === mid ? d0 : a.depth));
    }
    const n0 = e.nudge ?? 0, [mdx, mdy] = typeof n0 === 'number' ? [n0, 0] : Array.isArray(n0) ? n0 : [0, 0];
    const side = (s, count) => {
      const out = [];
      let d = (w1 * sm) / 2, sc = sm;                           // d: centre distance, in row head-units
      for (let k = 1; k <= count; k++) {
        const prev = w1 * sc;
        sc = sm * (sc0 + (sc1 - sc0) * rnd());
        const ro = r0 + ro0 + (ro1 - ro0) * rnd();
        d += (k === 1 ? 0 : prev / 2) + gap * sm + (w1 * sc) / 2;
        out.push({ ...mid, id: `${name}-${s < 0 ? 'left' : 'right'}${k > 1 ? k : ''}`, scale: sc, rotate: ro,
          nudge: [(mdx * sm + s * d) / sc, (mdy * sm) / sc], _copy: true });
      }
      return out;
    };
    const left = side(-1, Math.floor((n - 1) / 2)), right = side(1, Math.ceil((n - 1) / 2));
    // farthest first, so the middle is in front
    const back = [];
    for (let k = Math.max(left.length, right.length) - 1; k >= 0; k--) back.push(...[left[k], right[k]].filter(Boolean));
    return [...back, mid];
  }

  // the colour names of a prop's "color" and of "cloth"
  const palette = panelColors(assets.characters.colors, grounds);
  let nFig = 0;
  const makeFig = (f) => {
    const i = ++nFig, who = f.character ?? f.who;
    const c = chars.find((x) => x.id === who);
    if (!c) { issues.push(`figure ${i}: unknown character "${who}"`); return null; }
    const found = findPose(assets, f.pose);
    if (found.error) issues.push(`figure ${i} (${who}): unknown pose "${f.pose}" (${found.error}), using step-hang`);
    const pose = clone(found.pose || findPose(assets, 'step-hang').pose || {});
    if (f.mouth) pose.mouth = f.mouth;
    if (typeof f.turn === 'number') setPath(pose, 'spine.turn', f.turn);   // head turn, degrees, + to its right
    // limbs are right / left (older panels: near = right, far = left)
    const side = (k) => k.replace(/^near\./, 'right.').replace(/^far\./, 'left.');
    // the character's own weapon (characters.json "weapon") in place of the
    // plain sword a gesture holds; an adjust below still overrides it
    if (c.weapon) for (const s of ['right', 'left']) if (pose[s]?.arm?.prop?.kind === 'sword') pose[s].arm.prop.kind = c.weapon;
    if (f.hands) for (const [h, v] of Object.entries(f.hands)) setPath(pose, side(`${h}.arm.hand`), v);
    for (const [k, v] of Object.entries(f.adjust || {})) setPath(pose, side(k), v);
    const look = characterLook(c, palette, assets.faces, f.cloth);
    for (const k of ['color', 'body']) if (f[k] != null) issues.push(`figure ${i} (${who}): "${k}" does nothing on a figure — its cloth takes "cloth"`);
    if (f.cloth && !look.colors.cloth) issues.push(`figure ${i} (${who}): unknown cloth "${f.cloth}"`);
    // props worn at the neck (a garland): drawn by the figure, hung at its
    // nape by the prop's `neck` anchor (else its top centre)
    if (f.wear) look.wear = [].concat(f.wear).flatMap((id) => {
      const d = assets.props?.props?.[id];
      if (!d?.svg) { issues.push(`figure ${i} (${who}): unknown wear "${id}" (no data/props/${id}.svg)`); return []; }
      return [{ svg: d.svg, neck: d.anchors?.neck ?? [d.size[0] / 2, 0] }];
    });
    const S = assets.species[look.species];
    const r = place(f);
    const unit = r.unit * (f.scale ?? 1);
    if (f.view === 'front' && look.sideOnly) issues.push(`figure ${i} (${who}): side view only (sideOnly in data/characters.json); drawn in side view`);
    const view = f.view === 'front' && !look.sideOnly ? 'front' : 'side';
    // every character has a drawn face; there is no generated fallback
    const built = buildShapes(S, pose, { ...DEFAULT_OUTFIT, ...(look.outfit || {}) }, view, look.bodyScale, look.who);
    const { bbox, headAnchor, joints, shapes } = built;
    // where the hips rest when seated (a "seat" anchor): the underside of
    // the thighs at the pelvis, in the figure's frame (y up is negative)
    const pv = joints?.spine?.pelvis;
    const thighY = pv ? shapes.filter((s) => /-thigh$/.test(s.part || '')).flatMap((s) => s.pts)
      .filter((q) => Math.abs(q[0] - pv[0]) <= 0.25).reduce((m, q) => Math.max(m, q[1]), -Infinity) : -Infinity;
    const seatY = thighY > -Infinity ? thighY : pv?.[1] ?? 0;
    // the head is the nearest drawn view (src/headturn.js); say when the
    // view it wants is not drawn and a neighbour stands in
    const have = look.face ? (look.sideOnly ? ['side'] : Object.keys(look.face)) : [];
    const want = headAnchor.R ? headView(headAnchor.R, look.sideOnly ? ['side'] : INTENDED_VIEWS)?.view : null;
    const got = headAnchor.R ? headView(headAnchor.R, have)?.view : have[0];
    if (!got) issues.push(`figure ${i} (${who}): no drawn face (data/faces/${who}.svg)`);
    else if (want && want !== got) issues.push(`figure ${i} (${who}): head wants the ${want} view, not drawn; drawn as ${got} (docs/issues/missing-views.md)`);
    heads.push({ character: who, want: want ?? got, got });
    const groundY = r.top ? -bbox.y0 * unit : r.y;
    return { f, fi: i - 1, name: f.id || who, pose, view, look, S, built, groundY, unit, rowUnit: r.unit,
      halfW: ((bbox.x1 - bbox.x0) / 2) * unit, halfW1: (bbox.x1 - bbox.x0) / 2, pelvisX: joints?.spine?.pelvis?.[0] ?? 0, seatY, h1: -bbox.y0, rot: f.rotate ?? 0,
      // each hand's grip, in the figure's own frame (y up is negative): a "hand" anchor
      grips: { right: joints?.near?.grip ?? joints?.near?.Wr, left: joints?.far?.grip ?? joints?.far?.Wr },
      facing: f.facing === 'left' ? -1 : 1, x: null };
  };

  let propUses = 0;
  const makeProp = (p) => {
    const def = lib[p.prop];
    if (!def) issues.push(`prop "${p.prop}" not drawn yet: no data/props/${p.prop}.svg (placeholder)`);
    if (p.layer) issues.push(`prop "${p.prop}": "layer" is retired — order the entries instead`);
    const r = place(p);
    const unit = r.unit * (p.scale ?? 1);
    const [w0, h0] = (def?.size || PLACEHOLDER).map((v) => v * unit);
    // rotate: degrees clockwise about the drawing's centre; the prop then
    // stands on the bottom of its rotated box (e.g. -90 lays the fire on its side, 11.25).
    // With "on" it turns about the point it lands on instead (an arrow in a
    // chest turns about where it goes in). Its own anchors never turn.
    const rot = p.rotate ?? 0, rr = rot * Math.PI / 180;
    const [w, h] = rot ? [Math.abs(w0 * Math.cos(rr)) + Math.abs(h0 * Math.sin(rr)), Math.abs(w0 * Math.sin(rr)) + Math.abs(h0 * Math.cos(rr))] : [w0, h0];
    // recolor: def.recolor names the drawing's role colours ({ body, cloth }).
    // "character" takes a character's colours; "color" (the body role) and
    // "cloth" override (a name from data/characters.json "colors", a ground's
    // name — its first colour — or a hex; a pattern suffix keeps the base
    // colour). "body" is the retired name of "color".
    const cid = p.character ?? p.who;
    let svg = def?.svg;
    if (p.body != null) issues.push(`prop "${p.prop}": "body" is retired — use "color"`);
    const main = p.color ?? p.body;
    for (const [field, v, role] of [['color', main, 'body'], ['cloth', p.cloth, 'cloth']]) {
      if (svg && v != null && !def.recolor?.[role]) issues.push(`prop "${p.prop}": "${field}" does nothing — the drawing names no data-recolor-${role}`);
    }
    if (svg && def.recolor && (cid || main || p.cloth)) {
      const c = cid ? chars.find((x) => x.id === cid) : null;
      if (cid && !c) issues.push(`prop "${p.prop}": unknown character "${cid}"`);
      const colour = (field, name) => {
        if (!name) return undefined;
        const col = parseColor(name, palette).color;
        if (!col) issues.push(`prop "${p.prop}": ${field} "${name}" is not a colour (data/characters.json), a ground (data/grounds.json) or a hex`);
        return col;
      };
      const want = { body: colour('color', main ?? c?.body), cloth: colour('cloth', p.cloth ?? c?.cloth) };
      for (const [role, from] of Object.entries(def.recolor)) {
        if (want[role]) svg = svg.replaceAll(`fill:${from}`, `fill:${want[role]}`);
      }
    }
    // a drawing that keeps ids (a mask, a gradient) gets them renamed per use,
    // unique on the page: renderers mishandle a mask id defined twice
    if (svg && /\sid="/.test(svg)) {
      const tag = `${String(id).replace(/\W/g, '_')}-p${++propUses}-`;
      svg = svg.replace(/(\sid="|url\(#|href="#)([^")]+)/g, `$1${tag}$2`);
    }
    return { p, name: p.id || p.prop, def, svg, groundY: r.top ? h : r.y, unit, rowUnit: r.unit, w, h, w0, h0, rot, halfW: w / 2, x: null,
      facing: p.facing === 'left' ? -1 : 1 };   // drawings face right; left mirrors
  };

  // foreground: a band of ground, drawn from the bottom edge up to a
  // straight line whose left and right heights are shares of the panel
  // height ([l, r], or one number for a level one). Its place in the list is
  // its depth, like a prop's. Entries stand on it with "on": "foreground"
  // (or its id): feet on the line at their own x, the size from their own
  // depth (default front) × scale;
  // "at" places them across.
  const makeBand = (b) => {
    const v = typeof b.foreground === 'number' ? [b.foreground, b.foreground] : b.foreground;
    const name = b.id || 'foreground';
    if (!Array.isArray(v) || v.length !== 2 || !v.every((n) => typeof n === 'number')) { issues.push(`${name}: "foreground" takes [left, right] heights (shares of the panel) or one number`); return null; }
    const col = grounds[b.color] || b.color;
    if (!b.color) issues.push(`${name}: a foreground needs a "color" (data/grounds.json or a hex)`);
    else if (!grounds[b.color] && !/^#/.test(b.color)) issues.push(`${name}: color "${b.color}" not in data/grounds.json`);
    for (const k of ['body', 'cloth']) if (b[k] != null) issues.push(`${name}: "${k}" does nothing on a foreground — its colour is "color"`);
    for (const k of ['at', 'depth', 'row', 'scale', 'nudge', 'on']) if (b[k] != null) issues.push(`${name}: "${k}" does nothing on a foreground — "foreground" sets its line`);
    return { b, name, line: v, color: col || '#7a8f6a', x: W / 2, halfW: W / 2, unit: 1, groundY: H, facing: 1 };
  };
  const bandNames = new Set(entries.filter((e) => e.foreground != null).map((e) => e.id || 'foreground'));
  const onBand = (e) => e.on != null && bandNames.has(String(e.on).split('#')[0]);
  // on a foreground, the retired "row" would fight its line: flagged and
  // dropped ("depth" there sets the size only)
  const strip = (e) => {
    if (!onBand(e) || e.row == null) return e;
    issues.push(`${e.id || e.character || e.who || e.prop}: "row" does nothing on a foreground — it sets the ground line; size with "depth"`);
    const { row: _, ...rest } = e; return rest;
  };
  const all = entries.map((e0, i) => {
    const e = strip(e0);
    if (e.foreground != null) return makeBand(e);
    if (e.prop) return makeProp(e);
    if (e.character || e.who) return makeFig(e);
    issues.push(`entry ${i + 1}: needs "character", "prop" or "foreground"`);
    return null;
  }).filter(Boolean);
  const props = all.filter((o) => o.p);
  const bands = all.filter((o) => o.b);
  const ent = (o) => o.f || o.p || o.b;
  const bandOf = (o) => { const e = ent(o); return onBand(e) ? bands.find((b) => b.name === String(e.on).split('#')[0]) : null; };

  // -- placement: number or slot first, then relations --------------------------
  // "nudge": the shift after placement (by at/depth, a relation or
  // "on"), in the entry's own head-units: a number is across, [dx, dy] is
  // across and up (+ up). It is part of the entry's place, so whatever sits
  // on it or is placed by it follows. "lift" is retired; with "on", the
  // prop places the entry and at/depth do nothing. It never resizes: a
  // figure in the air is at the depth of the ground under it, nudged up.
  for (const o of all) {
    if (o.b) continue;
    const e = ent(o), n = e.nudge ?? 0;
    if (e.lift != null) issues.push(`${o.name}: "lift" is retired — use "nudge": [0, ${e.lift}]`);
    if (e.hand != null && !/#hand(-|$)/.test(String(e.on ?? ''))) issues.push(`${o.name}: "hand" picks the hand for a "hand" anchor — it needs "on": "<prop>#hand"`);
    if (e.on && !onBand(e)) for (const k of ['at', 'depth', 'row']) if (e[k] != null) issues.push(`${o.name}: "${k}" does nothing with "on" — the prop places it; shift with "nudge"`);
    const ok = typeof n === 'number' || (Array.isArray(n) && n.length === 2 && n.every((v) => typeof v === 'number'));
    if (!ok) issues.push(`${o.name}: "nudge" takes a number or [dx, dy]`);
    [o.dx, o.dy] = !ok ? [0, 0] : typeof n === 'number' ? [n, 0] : n;
    if (!e.on) o.groundY -= o.dy * o.unit;
  }
  for (const o of all) {
    if (o.b) continue;
    const at = ent(o).at ?? 'center';
    if (typeof at === 'number') o.x = at * W + o.dx * o.unit;
    else if (typeof at === 'string') {
      if (!(at in SLOTS)) issues.push(`${o.name}: unknown position "${at}"`);
      o.x = ((SLOTS[at] ?? 0.5) * W) + o.dx * o.unit;
    }
  }
  const RELS = ['before', 'behind', 'beside', 'left-of', 'right-of'];
  // a figure's rotate: degrees clockwise. On a prop's anchor it turns about
  // that point (keeps its grip, seat or footing); on a foreground, about its
  // feet; otherwise about its centre, then stands on the bottom of its
  // turned box, as a prop does. Returns the pivot and that drop.
  const turnOf = (o) => {
    const r = o.rot * Math.PI / 180, e = ent(o);
    if (e.on && o.pivot) return { px: o.pivot[0], py: o.pivot[1], dy: 0 };
    if (e.on) return { px: o.x, py: o.groundY, dy: 0 };
    const h = o.h1 * o.unit, w = 2 * o.halfW;
    return { px: o.x, py: o.groundY - h / 2, dy: h / 2 - (Math.abs(w * Math.sin(r)) + Math.abs(h * Math.cos(r))) / 2 };
  };
  // A figure's own anchors, from its skeleton in the view drawn (nothing to
  // draw): what it carries goes "on": "<figure>#hands". In the figure's
  // frame (y up is negative); right is the near hand, left the far one.
  const FIG_POINTS = {
    'hand-right': (t) => t.grips.right,
    'hand-left': (t) => t.grips.left,
    hands: (t) => t.grips.right && t.grips.left && [(t.grips.right[0] + t.grips.left[0]) / 2, (t.grips.right[1] + t.grips.left[1]) / 2],
    head: (t) => t.built.headAnchor?.at && [t.built.headAnchor.at[0], t.built.headAnchor.at[1] - (t.S.head?.size ?? 1) / 2],
    shoulder: (t) => t.built.joints?.near?.sh,
    chest: (t) => chestPoint(t),
    tail: (t) => t.built.joints?.tail,                     // the tail's tip (monkeys): a fire on it
  };
  // the chest: a third of the way from the neck to the waist along the
  // spine; in the side view moved out to the front edge of the torso
  // drawing (where an arrow goes in), in the front view its middle
  function chestPoint(t) {
    const s = t.built.joints?.spine;
    if (!s?.neck || !s?.waist) return null;
    const P = [s.neck[0] + (s.waist[0] - s.neck[0]) * 0.35, s.neck[1] + (s.waist[1] - s.neck[1]) * 0.35];
    if (t.view === 'front') return P;
    const len = Math.hypot(s.waist[0] - s.neck[0], s.waist[1] - s.neck[1]) || 1;
    const d = [(s.waist[0] - s.neck[0]) / len, (s.waist[1] - s.neck[1]) / len];   // down the spine
    const n = [d[1], -d[0]];                                                        // forward
    const along = (q) => (q[0] - P[0]) * d[0] + (q[1] - P[1]) * d[1];
    const out = t.built.shapes.filter((x) => x.part === 'torso').flatMap((x) => x.pts || [])
      .filter((q) => Math.abs(along(q)) <= 0.25)
      .reduce((m, q) => Math.max(m, (q[0] - P[0]) * n[0] + (q[1] - P[1]) * n[1]), 0);
    return [P[0] + n[0] * out, P[1] + n[1] * out];
  }
  // the point in the panel: mirrored with the figure, turned with it
  const figPoint = (t, [jx, jy]) => {
    let x = t.x + t.facing * jx * t.unit, y = t.groundY + jy * t.unit;
    if (t.rot) {
      const { px, py, dy } = turnOf(t), r = t.rot * Math.PI / 180, c = Math.cos(r), sn = Math.sin(r);
      [x, y] = [px + (x - px) * c - (y - py) * sn, py + (x - px) * sn + (y - py) * c + dy];
    }
    return [x, y];
  };
  // "on": a figure (or another prop) sits or stands on a prop's anchor, at
  // the prop's depth and its own scale — not the prop's (a big rock does not
  // make its sitter big). On a figure's anchor (FIG_POINTS: carried) the
  // same: a prop's bottom centre (or its feet anchor) lands there, a
  // figure's hips. "<prop>" uses the seat anchor; "<prop>#<anchor>"
  // names another (e.g. stand). A prop stands with its bottom centre on it.
  // A `face` anchor is different: it takes the head alone, centred on the
  // anchor and drawn to the anchor circle's size — a face in a sound bubble.
  const seatOn = (o) => {
    const e = ent(o);
    const [tname, aname = 'seat'] = String(e.on).split('#');
    const carrier = !props.some((x) => x !== o && x.name === tname) && all.find((x) => x !== o && x.f && x.name === tname);
    if (carrier) {
      const pt = FIG_POINTS[aname]?.(carrier);
      if (!pt) { issues.push(`${o.name}: a figure's anchor is ${Object.keys(FIG_POINTS).map((k) => `#${k}`).join(', ')} ("${e.on}")`); if (o.f) o.f = { ...o.f, on: undefined }; else o.p = { ...o.p, on: undefined }; return; }
      // A on B on A: flagged, and A dropped off
      for (let c = carrier, k = 0; c && k <= all.length; k++) {
        if (c === o) { issues.push(`${o.name}: "on" goes round in a circle ("${e.on}")`); if (o.f) o.f = { ...o.f, on: undefined }; else o.p = { ...o.p, on: undefined }; return; }
        const on = ent(c).on;
        c = on && !onBand(ent(c)) ? all.find((x) => x !== c && x.name === String(on).split('#')[0]) : null;
      }
      if (carrier.x == null) return;
      // a prop on a figure turns with it (an arrow in a body), its own rotate on top
      if (!o.f) o.rot = (e.rotate ?? 0) + carrier.rot;
      return placeOn(o, e, carrier, ...figPoint(carrier, pt), aname.startsWith('hand') ? 'carry-hand' : 'carry');
    }
    const t = props.find((x) => x !== o && x.name === tname);
    // a cutter (a drawing marked data-cut: break) is not drawn: its shape cuts
    // a hole in the prop it is on, so what is drawn before that prop shows
    // through. Centred on the named anchor, else on the prop's middle; at the
    // prop's depth and its own scale, then nudged and turned about its centre
    if (o.def?.cut) {
      if (!t) { issues.push(`${o.name}: a cutter ("${o.p.prop}") goes "on" a prop in the panel ("${e.on}")`); o.p = { ...o.p, on: undefined }; return; }
      const named = String(e.on).includes('#'), a = named ? t.def?.anchors?.[aname] : null;
      if (named && !a) { issues.push(`${o.name}: "on" needs a prop with a "${aname}" anchor in the panel ("${e.on}")`); o.p = { ...o.p, on: undefined }; return; }
      if (t.x == null) return;
      const cx = a ? t.x + t.facing * (a[0] * t.unit - t.halfW) : t.x, cy = a ? t.groundY - t.h + a[1] * t.unit : t.groundY - t.h / 2;
      o.rowUnit = t.rowUnit;
      o.unit = o.rowUnit * (e.scale ?? 1);
      [o.w, o.h] = o.def.size.map((v) => v * o.unit);
      o.halfW = o.w / 2;
      o.x = cx + o.dx * o.unit;
      o.groundY = cy - o.dy * o.unit + o.h / 2;
      o.pivot = [o.x, o.groundY - o.h / 2];
      o.cuts = t;
      return;
    }
    const seat = t?.def?.anchors?.[aname];
    if (!seat) { issues.push(`${o.name}: "on" needs a prop with a "${aname}" anchor in the panel ("${e.on}")`); if (o.f) o.f = { ...o.f, on: undefined }; else o.p = { ...o.p, on: undefined }; return; }
    if (t.x == null) return;
    // the anchor's point in the panel (the prop mirrored when it faces left)
    const sx = t.x + t.facing * (seat[0] * t.unit - t.halfW), sy = t.groundY - t.h + seat[1] * t.unit;
    if (aname === 'face') {                     // the head alone, no ground contact
      if (!o.f) { issues.push(`${o.name}: a "face" anchor takes a figure, not a prop ("${e.on}")`); return; }
      o.headOnly = true;
      o.unit = (seat[2] || 1) * t.unit * (e.scale ?? 1);
      o.halfW = ((o.S.head?.width ?? 1) / 2) * o.unit;
      o.groundY = sy - o.dy * o.unit;   // the head's centre, not a ground line
      o.x = sx + o.dx * o.unit;
      o.pivot = [o.x, o.groundY];
      return;
    }
    if (aname === 'inside') {                   // a prop fitted into the circle, centred on it
      if (o.f) { issues.push(`${o.name}: an "inside" anchor takes a prop, not a figure ("${e.on}")`); return; }
      const [w0, h0] = o.def?.size || PLACEHOLDER;
      o.rowUnit = t.rowUnit;
      o.unit = (seat[2] || 1) * t.unit * (e.scale ?? 1) / Math.max(w0, h0);
      [o.w, o.h] = [w0 * o.unit, h0 * o.unit];
      o.halfW = o.w / 2;
      o.x = sx + o.dx * o.unit;
      o.groundY = sy + o.h / 2 - o.dy * o.unit;   // its bottom edge, the box centred on the anchor
      o.pivot = [o.x, o.groundY - o.h / 2];
      return;
    }
    placeOn(o, e, t, sx, sy, aname);
  };
  // put o on the point (sx, sy) of t: aname is the prop anchor's name, or
  // "carry" for a figure's anchor
  const placeOn = (o, e, t, sx, sy, aname) => {
    o.rowUnit = t.rowUnit;
    o.unit = o.rowUnit * (e.scale ?? 1);
    // the anchor point, nudged: a rotated figure or prop turns about it
    const ax = sx + o.dx * o.unit;
    const ay = sy - o.dy * o.unit;
    o.pivot = [ax, ay];
    // a hand anchor: the figure hangs from it by one hand — the higher one,
    // or the one its "hand" names (right / left) — its grip on the point
    if (aname === 'hand' || aname.startsWith('hand-')) {
      if (!o.f) { issues.push(`${o.name}: a "hand" anchor takes a figure, not a prop ("${e.on}")`); return; }
      const { right, left } = o.grips;
      if (e.hand != null && !['right', 'left'].includes(e.hand)) issues.push(`${o.name}: "hand" is right or left`);
      const g = e.hand === 'right' ? right : e.hand === 'left' ? left : (right && left ? (left[1] < right[1] ? left : right) : right || left);
      if (!g) { issues.push(`${o.name}: no hand to hang from`); return; }
      o.halfW = o.halfW1 * o.unit;
      o.groundY = sy - g[1] * o.unit - o.dy * o.unit;
      o.x = sx - g[0] * o.unit * o.facing + o.dx * o.unit;
      return;
    }
    if (o.f) o.halfW = o.halfW1 * o.unit;
    else { [o.w, o.h] = (o.def?.size || PLACEHOLDER).map((v) => v * o.unit); o.halfW = o.w / 2; }
    // a prop with a "feet" anchor stands on it (a bird whose wing pulls its
    // box off its feet); carried in a hand (#hand-right, #hand-left, #hands), on
    // its "hand" anchor if it has one (where the hand holds a drum); otherwise
    // on its bottom centre
    const feet = !o.f && ((aname === 'carry-hand' && o.def?.anchors?.hand) || o.def?.anchors?.feet);
    if (feet) {
      o.groundY = ay + o.h - feet[1] * o.unit;
      o.x = ax - o.facing * (feet[0] * o.unit - o.halfW);
      return;
    }
    // a seat anchor or a carrier's takes the hips; any other (stand …) the lowest point
    const hips = o.f && (aname === 'seat' || aname.startsWith('carry')) ? o.seatY * o.unit : 0;
    o.groundY = sy - hips - o.dy * o.unit;
    o.x = sx - (o.f ? o.pelvisX * o.unit * o.facing : 0) + o.dx * o.unit;
  };
  // a figure on a foreground stands on its line before anything is seated on
  // the figure: what it carries ("on": "<figure>#hands") follows it up the band
  const lineY = (b, x) => H * (1 - (b.line[0] + (b.line[1] - b.line[0]) * x / W));
  const standOnBands = () => { for (const o of all) { const b = bandOf(o); if (b && o.x != null) o.groundY = lineY(b, o.x) - o.dy * o.unit; } };
  for (let pass = 0; pass < 3; pass++) {
    standOnBands();
    for (const o of all) {
      if (o.b) continue;
      if (ent(o).on && !onBand(ent(o))) { seatOn(o); continue; }
      const at = ent(o).at;
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
  // on a foreground: the feet on its line where the entry stands (after the
  // across nudge, so the feet follow the slope), then the up/down nudge
  standOnBands();

  // -- draw: ground, sky, then the list in order -----------------------------------
  // ids are unique per panel and figure, so panels can share a page
  const pre = String(id).replace(/\W/g, '_');
  // a grounds.json colour is a hex; [top, bottom] (or { "vertical": [..] }),
  // a vertical gradient; { "horizontal": [left, right] }, a horizontal one —
  // over the rect it fills. Under a sky the ground's vertical gradient starts
  // at the horizon ("top"), so the land or sea shows all of it
  let defs = '';
  const fill = (g, key, top = null) => {
    const horiz = Array.isArray(g?.horizontal);
    const c = Array.isArray(g) ? g : horiz ? g.horizontal : g?.vertical;
    if (!Array.isArray(c)) return esc(g);
    const gid = `${pre}-${key}`;
    const span = top != null && !horiz ? `gradientUnits="userSpaceOnUse" x1="0" y1="${+top.toFixed(2)}" x2="0" y2="${H}"`
      : `x1="0" y1="0" x2="${horiz ? 1 : 0}" y2="${horiz ? 0 : 1}"`;
    defs += `<linearGradient id="${gid}" ${span}>` +
      c.map((col, i) => `<stop offset="${c.length > 1 ? i / (c.length - 1) : 0}" stop-color="${esc(col)}"/>`).join('') + `</linearGradient>`;
    return `url(#${gid})`;
  };
  let s = negative ? `<rect width="${W}" height="${H}" fill="#000"/>` : `<rect width="${W}" height="${H}" fill="${fill(ground, 'ground', sky ? horizonY : null)}"/>`;
  if (sky && !negative) s += `<rect width="${W}" height="${Math.max(0, horizonY)}" fill="${fill(sky, 'sky')}"/>`;
  if (defs) s = `<defs>${defs}</defs>` + s;
  const drawProp = (o) => {
    const x = o.x - o.halfW, y = o.groundY - o.h;
    // on a point: drawn upright there, then turned about the point
    if (o.svg && o.rot && o.pivot) return `<g transform="rotate(${o.rot} ${+o.pivot[0].toFixed(3)} ${+o.pivot[1].toFixed(3)})"><g transform="translate(${o.facing < 0 ? x + o.w : x} ${y}) scale(${o.facing * o.unit} ${o.unit})">${o.svg}</g></g>`;
    if (o.svg && o.rot) return `<g transform="translate(${o.x} ${o.groundY - o.h / 2}) rotate(${o.rot}) translate(${o.facing < 0 ? o.w0 / 2 : -o.w0 / 2} ${-o.h0 / 2}) scale(${o.facing * o.unit} ${o.unit})">${o.svg}</g>`;
    if (o.svg) return `<g transform="translate(${o.facing < 0 ? x + o.w : x} ${y}) scale(${o.facing * o.unit} ${o.unit})">${o.svg}</g>`;
    return `<g class="placeholder"><rect x="${x}" y="${y}" width="${o.w}" height="${o.h}" fill="#000" fill-opacity="0.06" stroke="#7a6f62" stroke-width="1.2" stroke-dasharray="5 4"/>` +
      `<text x="${o.x}" y="${y + o.h / 2}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.max(9, Math.min(16, o.w / 6))}" fill="#7a6f62" text-anchor="middle" dominant-baseline="middle">${esc(o.p.prop)}</text></g>`;
  };
  const drawBand = (o, k) => {
    const from = defs.length, paint = fill(o.color, `band${k}`), d = defs.slice(from);
    return (d ? `<defs>${d}</defs>` : '') + `<path d="M0 ${H}L0 ${+lineY(o, 0).toFixed(2)}L${W} ${+lineY(o, W).toFixed(2)}L${W} ${H}Z" fill="${paint}"/>`;
  };
  // a figure's rotate (turnOf, above)
  const turn = (o, g) => {
    if (!o.rot) return g;
    const { px, py, dy } = turnOf(o);
    return `<g transform="${dy ? `translate(0 ${+dy.toFixed(3)}) ` : ''}rotate(${o.rot} ${+px.toFixed(3)} ${+py.toFixed(3)})">${g}</g>`;
  };
  // negative: bands are ground (black); figures and props flooded white
  // through their own outline (alpha), so overlapping shapes merge
  const neg = `${pre}-negative`;
  if (negative) s += `<defs><filter id="${neg}" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">` +
    `<feFlood flood-color="#fff"/><feComposite in2="SourceAlpha" operator="in"/></filter></defs>`;
  // cutters: each prop's holes, drawn black into a mask over the whole panel
  const cutters = new Map();
  for (const o of all) if (o.cuts && o.x != null) cutters.set(o.cuts, [...(cutters.get(o.cuts) || []), o]);
  if (cutters.size) s += `<defs><filter id="${pre}-cut" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">` +
    `<feFlood flood-color="#000"/><feComposite in2="SourceAlpha" operator="in"/></filter></defs>`;
  const withHoles = (o, k, g) => {
    const cs = cutters.get(o);
    if (!cs) return g;
    const mid = `${pre}-holes${k}`;
    return `<mask id="${mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/>` +
      `<g filter="url(#${pre}-cut)">${cs.map(drawProp).join('')}</g></mask><g mask="url(#${mid})">${g}</g>`;
  };
  let body = '';
  const flush = () => { s += negative && body ? `<g filter="url(#${neg})">${body}</g>` : body; body = ''; };
  all.forEach((o, k) => {
    if (o.b) { flush(); s += negative ? `<path d="M0 ${H}L0 ${+lineY(o, 0).toFixed(2)}L${W} ${+lineY(o, W).toFixed(2)}L${W} ${H}Z" fill="#000"/>` : drawBand(o, k); return; }
    if (o.def?.cut) return;                     // a hole, drawn into its prop's mask
    body += o.p ? withHoles(o, k, drawProp(o))
      : turn(o, renderFigure(o.S, o.pose, { ...o.look, x: o.x, y: o.groundY, scale: o.unit, facing: o.facing,
        view: o.view, headOnly: o.headOnly, headless: o.f?.show === 'without-head', built: o.built, id: `${pre}-f${o.fi}` }).svg);
  });
  flush();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" data-panel="${esc(id)}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" overflow="hidden">${s}</svg>`;
  return { svg, w: W, h: H, issues, heads, horizon: hz, layout: all.map((o, k) => layoutOf(o, k)) };

  // -- layout: where each entry was drawn, for tools/describe-panel.mjs ----------
  // toPanel maps a point in the entry's own frame to panel units (y down):
  // a figure's frame is its skeleton's (head-units, feet at y 0, y up
  // negative, as built); a prop's is its drawing's (head-units from the
  // drawing's top-left, y down, unmirrored). Nothing here changes the drawing.
  function layoutOf(o, k) {
    const e = ent(o);
    const base = { k, name: o.name, entry: e, copy: !!e._copy, x: o.x, groundY: o.groundY, unit: o.unit, rowUnit: o.rowUnit, facing: o.facing, rot: o.rot ?? 0 };
    if (o.b) return { ...base, kind: 'band', line: o.line, lineY: (x) => lineY(o, x) };
    const rotate = (pt, pv, dy = 0) => {
      const r = o.rot * Math.PI / 180, c = Math.cos(r), sn = Math.sin(r), [px, py] = pv;
      return [px + (pt[0] - px) * c - (pt[1] - py) * sn, py + (pt[0] - px) * sn + (pt[1] - py) * c + dy];
    };
    if (o.f) {
      const [ax, ay] = o.built.headAnchor.at;
      const toPanel = (q) => {
        const p = o.headOnly ? [o.x + o.facing * o.unit * (q[0] - ax), o.groundY + o.unit * (q[1] - ay)] : [o.x + o.facing * q[0] * o.unit, o.groundY + q[1] * o.unit];
        if (!o.rot) return p;
        const t = turnOf(o);
        return rotate(p, [t.px, t.py], t.dy);
      };
      return { ...base, kind: 'figure', character: e.character ?? e.who, pose: e.pose, view: o.view, headOnly: !!o.headOnly, headless: e.show === 'without-head', built: o.built, species: o.S, toPanel };
    }
    const toPanel = (q) => {
      if (o.rot && !o.pivot) {
        const lx = o.facing * o.unit * q[0] + (o.facing < 0 ? o.w0 / 2 : -o.w0 / 2), ly = o.unit * q[1] - o.h0 / 2;
        const r = o.rot * Math.PI / 180, c = Math.cos(r), sn = Math.sin(r);
        return [o.x + lx * c - ly * sn, o.groundY - o.h / 2 + lx * sn + ly * c];
      }
      const p = [(o.facing < 0 ? o.x + o.halfW : o.x - o.halfW) + o.facing * o.unit * q[0], o.groundY - o.h + o.unit * q[1]];
      return o.rot ? rotate(p, o.pivot) : p;
    };
    return { ...base, kind: 'prop', prop: e.prop, def: o.def, cuts: o.cuts?.name, size: o.def?.size || PLACEHOLDER, toPanel };
  }
}

// A drawn SVG file (a prop): keep only the drawing (everything inside <svg>),
// minus a layer labelled "guide" and editor-only markup.
export function svgInner(svgText) {
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
