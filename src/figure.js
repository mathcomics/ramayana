// Figure model: a pose on the artist's drawn body parts (src/parts.js),
// emitted as SVG. Everything is authored FACING RIGHT; facing left mirrors.
// See geom.js for the angle convention (0 = down, +90 = forward).

import { pathD, bbox } from './geom.js';
import { buildParts, dpSegD } from './parts.js';
import { headView } from './headturn.js';


export const DEFAULT_COLORS = {
  body: '#5a2a12',
  cloth: '#c8322a',
  prop: '#241f1c',
};

export const HANDS = ['fist', 'out', 'in', 'point'];
const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);

// Normalise a pose, filling defaults.
//
// Poses name their limbs `right` and `left` (the character's own). In the
// side view the right side is the near one (toward the viewer), so inside
// the renderer they are `near` (right) and `far` (left); older poses with
// near / far keys still load. The head turn `spine.turn` is in degrees from
// the body's own front, + to its right, −90..90 (the old `look`: front 0,
// left 90, right −90).
export function normalizePose(p = {}) {
  const limb = (l = {}) => ({
    arm: {
      shoulder: num(l.arm?.shoulder, 0), out: num(l.arm?.out, 0), elbow: num(l.arm?.elbow, 10), elbowOut: num(l.arm?.elbowOut, 0), wrist: num(l.arm?.wrist, 0), twist: num(l.arm?.twist, 0),
      hand: HANDS.includes(l.arm?.hand) ? l.arm.hand : 'fist',
      ...(l.arm?.prop && /^(sword|club|bow)(-[a-z0-9-]+)?$/.test(l.arm.prop.kind) ? { prop: { kind: l.arm.prop.kind, angle: num(l.arm.prop.angle, 0), out: num(l.arm.prop.out, 0), ...(l.arm.prop.draw ? { draw: true } : {}), ...(l.arm.prop.grip === 'both' ? { grip: 'both' } : {}) } } : {}),
    },
    leg: { hip: num(l.leg?.hip, 0), out: num(l.leg?.out, 0), knee: num(l.leg?.knee, 5), kneeOut: num(l.leg?.kneeOut, 0), ankle: num(l.leg?.ankle, 0), toe: num(l.leg?.toe, 0) },
  });
  const lookIn = ['front', 'left', 'right'].includes(p.look) ? p.look : (p.headView || p.view) === 'front' ? 'left' : 'front';
  const turn = num(p.spine?.turn, { front: 0, left: 90, right: -90 }[lookIn]);
  return {
    name: p.name || 'untitled',
    view: p.view === 'front' ? 'front' : 'side',
    mouth: [1, 2, 3].includes(p.mouth) ? p.mouth : 2,
    spine: {
      lean: num(p.spine?.lean, 0),
      chest: num(p.spine?.chest, 0),
      neck: num(p.spine?.neck, 0),
      head: num(p.spine?.head, 0),
      // head turn about its own up axis (degrees from the body's front, + to its right)
      turn,
    },
    near: limb(p.right ?? p.near),
    far: limb(p.left ?? p.far),
    tail: { lift: num(p.tail?.lift, 30), curl: num(p.tail?.curl, 200), turn: num(p.tail?.turn, 35) },
  };
}

export const DEFAULT_OUTFIT = { bottom: 'briefs', top: 'bare' };

// Build all shapes in draw order: { shapes: [{pts, d, role, part, ...}],
// joints, sk, headAnchor, hairAnchor, bbox }. Every species is drawn from
// the artist's parts (species.parts, src/parts.js), which projects the
// front view from the side pose. Outfit (a rendering choice, not part of
// the pose): the thighs are always cloth; top 'bare' | 'full' (the whole
// torso in cloth colour). Each shape has `d`, the drawn curves as path data.
export function buildShapes(S, poseIn, outfit = DEFAULT_OUTFIT, view = 'side', bodyScale = 1, who = null) {
  if (!S.parts || typeof S.parts !== 'object') throw new Error(`species ${S.id}: no drawn parts (load it with tools/lib.mjs, loadSpecies)`);
  const pose = normalizePose(poseIn);
  const front = view === 'front';
  const { shapes, H, headRot, headR, hair, joints } = buildParts(S.parts, S, pose, outfit, front ? 'front' : 'side', bodyScale, who);
  // The head is drawn as the nearest of the face's drawn views to its
  // orientation headR (src/headturn.js, headView; renderFigure picks it).
  // The front view is mirrored: the character faces the viewer, so its
  // right side (the side view's near side) is on picture-left. The parts are
  // built with the near side on picture-right and flipped here; the head
  // keeps its drawing unmirrored (R conjugated by the flip), so it turns to
  // the same side of the body in both views.
  const F = front ? -1 : 1;
  const flipR = (M) => (front ? M.map((r, i) => r.map((v, j) => ((i === 0) !== (j === 0) ? -v : v))) : M);
  const R = flipR(headR);
  if (front) {
    const fl = (q) => [-q[0], q[1]];
    for (const s of shapes) {
      s.pts = s.pts.map(fl);
      if (s.segs) s.segs = s.segs.map((g) => g.map(fl));
      if (s.mx) s.mx = [-s.mx[0], s.mx[1], -s.mx[2], s.mx[3], -s.mx[4], s.mx[5]];
    }
  }
  const Hm = [F * H[0], H[1]], hairAt = [F * hair.at[0], hair.at[1]];
  const jf = (q) => [F * q[0], q[1]];
  // centred on the body: held props don't move the figure
  const bb = bbox(shapes.filter((s) => s.role !== 'prop').map((s) => s.pts));
  const dx = -(bb.x0 + bb.x1) / 2, dy = -bb.y1;
  const mv = (q) => [q[0] + dx, q[1] + dy];
  for (const s of shapes) {
    s.pts = s.pts.map(mv);
    if (s.segs) { s.segs = s.segs.map((g) => g.map(mv)); s.d = dpSegD(s.segs); }
    if (s.mx) s.mx = [s.mx[0], s.mx[1], s.mx[2], s.mx[3], s.mx[4] + dx, s.mx[5] + dy];
  }
  // joints in the figure's own frame (for the pose lab's handles)
  const jm = (g) => Object.fromEntries(Object.entries(g).map(([k, q]) => [k, mv(jf(q))]));
  const J = { near: jm(joints.near), far: jm(joints.far), spine: jm(joints.spine) };
  return { shapes, joints: J, sk: { pose, front }, headAnchor: { at: mv(Hm), rot: F * headRot, R }, hairAnchor: { ...hair, rot: F * hair.rot, at: mv(hairAt) }, bbox: bbox(shapes.map((s) => s.pts)) };
}

// Colours: a name from data/characters.json "colors" (skin, cloth, stone
// alike: "skin-dark-red", "red", "stone") or a hex, optionally followed by
// a cloth pattern for the upper body (a full top, style bible §5.4):
// "red-check", "red-diamond", "skin-brown-stripe". The pattern is drawn in
// black, in head-units, so it scales with the figure. An unknown name has
// no color.
export const CLOTH_PATTERNS = ['check', 'diamond', 'stripe'];
export function parseColor(name, colors = {}) {
  const s = String(name ?? '');
  const known = (b) => colors[b] ?? (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(b) ? b : undefined);
  const m = s.match(new RegExp(`^(.+)-(${CLOTH_PATTERNS.join('|')})$`));
  if (m && known(m[1])) return { color: known(m[1]), pattern: m[2] };
  return { color: known(s), pattern: null };
}
function patternDef(id, kind, ink) {
  const t = 0.54;                                   // tile, head-units
  const body = {
    check: `<rect width="${t / 2}" height="${t / 2}"/><rect x="${t / 2}" y="${t / 2}" width="${t / 2}" height="${t / 2}"/>`,
    diamond: `<path d="M${t / 2} ${t * 0.18}L${t * 0.82} ${t / 2}L${t / 2} ${t * 0.82}L${t * 0.18} ${t / 2}Z"/>`,
    stripe: `<rect y="${t * 0.36}" width="${t}" height="${t * 0.28}"/>`,
  }[kind];
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${t}" height="${t}"><g fill="${ink}">${body}</g></pattern>`;
}

// Render a figure as an SVG <g>. Ground point at (x, y) in px; `scale` is
// px per head-unit; facing 1 (right) or -1 (left); view 'side' (default)
// or 'front' (derived from the side pose). `id` prefixes the figure's clip
// and pattern ids; give each figure on a page its own (default: a counter).
// The other options are a character look (see characterLook): colors,
// outfit, pattern, face, bodyScale (torso and legs; drawn parts only),
// who (character id: its own held weapons, data/props/held/); built (the
// figure's buildShapes result, if already made).
// Two tones (style bible §4): the far leg (thigh with its cloth, shin,
// foot) and the torso (bare skin or a full top) are 5% lighter than the
// body or cloth colour (each channel 5% of the way to white), so they
// separate from the near leg, the arms and the head.
const SHADED = /^(far-(thigh|shin|foot)|torso)$/, SHADE = 0.05;
function shade(c, k) {
  const m = /^#([0-9a-f]{6})$/i.exec(c || '');
  if (!m) return c;
  const n = parseInt(m[1], 16);
  return '#' + [16, 8, 0].map((b) => { const v = (n >> b) & 255; return Math.round(v + (255 - v) * k).toString(16).padStart(2, '0'); }).join('');
}
// One drawn view of a face alone (pose lab, face sheets): its back layer,
// head and mouth as drawn, head centre at (0, 0); '' when not drawn.
export function drawnView(face, view, mouth = 2, color = DEFAULT_COLORS.body) {
  const d = face?.[view];
  if (!d) return '';
  return `<g color="${color}">${d.defs ? `<defs>${d.defs}</defs>` : ''}${d.back || ''}${d.head || ''}${d.mouth?.[mouth] || ''}</g>`;
}

let clipSeq = 0;
export function renderFigure(species, pose, opts = {}) {
  const { x = 0, y = 0, scale = 20, facing = 1, headOnly = false } = opts;
  const colors = { ...DEFAULT_COLORS, ...(opts.colors || {}) };
  // a sideOnly character (data/characters.json) is always drawn in side
  // view, with its side face as drawn (it has no front face, no turn data)
  const view = opts.sideOnly ? 'side' : opts.view;
  // opts.built: this figure's buildShapes result, when the caller already has
  // it (renderPanel measures the figure first); it must be for the same view
  const { shapes, headAnchor, hairAnchor, sk, bbox: bb, joints } = opts.built
    ?? buildShapes(species, pose, { ...DEFAULT_OUTFIT, ...(opts.outfit || {}) }, view, opts.bodyScale ?? 1, opts.who);
  // Drawn face (data/faces): replaces the guide head (every character has
  // one; the guide shows on species sheets only). The head is the face's
  // drawn view nearest to its orientation (headView: front, quarter, side,
  // back-view, front-down, top; mirrored for the other side), its layers
  // copied unchanged, colours included, and placed with one transform. A
  // sideOnly character (data/characters.json) only has its side view.
  const have = opts.face ? (opts.sideOnly ? ['side'] : Object.keys(opts.face)) : [];
  const hv = headView(headAnchor.R, have);
  const drawn = hv ? opts.face[hv.view] : null;
  const place = (g) => `<g transform="matrix(${hv.m.map((v) => Math.round(v * 1e4) / 1e4).join(' ')} ${headAnchor.at[0]} ${headAnchor.at[1]})">${g}</g>`;
  // the base face's skin is currentColor: the body colour
  const faceHead = drawn && place(`<g color="${colors.body}">${drawn.head || ''}${drawn.mouth?.[sk.pose.mouth] || ''}</g>`);
  // body hair lies on the body: the figure's own view's drawing
  const bodyFace = opts.face?.[sk.front && !opts.sideOnly ? 'front' : 'side'];
  // A head alone, for a prop's `face` anchor (the sound-cry burst carries
  // the crier's face). The drawn face and the hair behind it, nothing else:
  // with no torso there is no neck, and the face's `hair-body` layer is
  // dropped — it hangs from the nape onto the back and has nothing to lie on.
  // `scale` is the head's height in px (a head is 1 head-unit tall for every
  // species), and the head's centre lands on (x, y).
  if (headOnly) {
    const [ax, ay] = headAnchor.at;
    let h = `<g transform="translate(${x} ${y}) scale(${facing * scale} ${scale}) translate(${-ax} ${-ay})">`;
    if (drawn?.defs) h += `<defs>${drawn.defs}</defs>`;
    if (drawn?.back) h += place(drawn.back);
    h += `${faceHead || ''}</g>`;
    const hw = (species.head?.width ?? 1) / 2;
    return { svg: h, bbox: { x0: -hw, x1: hw, y0: -0.5, y1: 0.5 }, joints };
  }
  // Shapes are emitted in draw order; consecutive body shapes share one
  // <g fill> so the silhouette merges visually.
  let svg = `<g transform="translate(${x} ${y}) scale(${facing * scale} ${scale})">`;
  const clipId = opts.id ?? `face${++clipSeq}`;
  let inBody = false;
  if (drawn?.defs) svg += `<defs>${drawn.defs}</defs>`;
  if (drawn?.back) svg += place(drawn.back);          // behind the whole body
  let headDone = false;
  // the far leg and the torso (skin or cloth) a shade darker than the rest
  const fill = (s, c) => (SHADED.test(s.part || '') ? shade(c, SHADE) : c);
  for (const s of shapes) {
    if (s.hairBody) {                                   // the face's body hair, moved with the upper body
      if (bodyFace?.hairBody && hairAnchor) {
        if (inBody) { svg += '</g>'; inBody = false; }
        const [nx, ny] = bodyFace.nape || [0, 0.65];
        svg += `<g transform="translate(${hairAnchor.at[0]} ${hairAnchor.at[1]}) rotate(${hairAnchor.rot}) scale(1 ${hairAnchor.sy}) translate(${-nx} ${-ny})">${bodyFace.hairBody}</g>`;
      }
      continue;
    }
    if (faceHead && s.headPart) {                       // drawn face instead of the generated head
      // placed where the guide head would go
      if (!headDone) { if (inBody) { svg += '</g>'; inBody = false; } svg += faceHead; headDone = true; }
      continue;
    }
    if (s.markup) {                                     // a held weapon drawing, placed along its line
      if (inBody) { svg += '</g>'; inBody = false; }
      svg += `<g transform="matrix(${s.mx.map((v) => Math.round(v * 1e4) / 1e4).join(' ')})">${s.markup}</g>`;
      continue;
    }
    if (s.role === 'body') {
      if (!inBody) { svg += `<g fill="${colors.body}">`; inBody = true; }
      const f = fill(s, colors.body);
      svg += `<path d="${s.d ?? pathD(s.pts)}"${f !== colors.body ? ` fill="${f}"` : ''}/>`;
      continue;
    }
    if (inBody) { svg += '</g>'; inBody = false; }
    if (s.top && opts.pattern && CLOTH_PATTERNS.includes(opts.pattern)) {
      // patterned top: the cloth colour, then the pattern over it
      const id = `${clipId}p${shapes.indexOf(s)}`, d = s.d ?? pathD(s.pts);
      svg += `<defs>${patternDef(id, opts.pattern, '#000000')}</defs>` +
        `<path d="${d}" fill="${fill(s, colors.cloth)}"/><path d="${d}" fill="url(#${id})"/>`;
    } else {
      svg += `<path d="${s.d ?? pathD(s.pts)}" fill="${s.role === 'prop' ? colors.prop : fill(s, colors[s.role])}"/>`;
    }
  }
  if (inBody) svg += '</g>';
  svg += '</g>';
  return { svg, bbox: bb, joints };
}

// Look of a character from data/characters.json: species id plus the
// render options (colours, outfit) for renderFigure.
// `cloth` overrides the character's cloth (e.g. a pattern for one figure).
export function characterLook(character, colors, faces, cloth = character.cloth) {
  const c = parseColor(cloth, colors);
  return {
    face: faces?.faces?.[character.id],
    who: character.id,                                 // picks the character's own held weapons
    ...(character.sideOnly ? { sideOnly: true } : {}), // side view only, side face as drawn
    species: character.species,
    pattern: c.pattern,
    colors: { body: parseColor(character.body, colors).color, cloth: c.color },
    outfit: { top: character.top, bottom: character.bottom },
    bodyScale: character.scale ?? 1,
  };
}
