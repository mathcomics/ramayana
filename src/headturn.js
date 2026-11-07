// A drawn head at any turn and tilt (step 4, branch head-turn), from the
// turn data import-faces computes for each face (tools/face-turn.mjs):
// volumes lofted from the front and side drawings, and flat cards (eyes,
// mouths, ears, marks) on their surface.
//
//   headTurn(turn, yaw, pitch, { mouth, id, drawn })  ->  SVG markup
//
// yaw (degrees): 0 = the face toward the viewer, 90 = looking
// picture-right (the side drawing), 180 = the back of the head. pitch: +
// raises the face. Head-units, head centre at (0,0), y down; the skin is
// currentColor (the caller sets the body colour).
//
// Draw order is by layer (painter's): back / under behind the skin, over
// in front, as drawn; past 90° (the back of the head toward the viewer)
// back / under hair goes over the skin. A volume uses its front drawing's
// layer while the face is turned less than 45°, else its side drawing's.

const HT_RAD = Math.PI / 180;
const htF = (v) => (Math.round(v * 1e4) / 1e4).toString();

function htRot(yaw, pitch) {
  const cy = Math.cos(yaw * HT_RAD), sy = Math.sin(yaw * HT_RAD), cp = Math.cos(pitch * HT_RAD), sp = Math.sin(pitch * HT_RAD);
  // object (x right, y down, z toward the viewer at yaw 0) -> picture (u, v, w toward the viewer)
  const Ry = [[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]];
  const Rx = [[1, 0, 0], [0, cp, -sp], [0, sp, cp]];
  return Rx.map((r) => [0, 1, 2].map((j) => r[0] * Ry[0][j] + r[1] * Ry[1][j] + r[2] * Ry[2][j]));
}
const htAp = (R, p) => [R[0][0] * p[0] + R[0][1] * p[1] + R[0][2] * p[2], R[1][0] * p[0] + R[1][1] * p[1] + R[1][2] * p[2]];

const htW = (R, p) => R[2][0] * p[0] + R[2][1] * p[1] + R[2][2] * p[2];

// A volume as slabs: each row an ellipse (front width × side depth) and the
// band joining its left- and rightmost points to the next row's, each with
// the depth of its row's centre, so slabs of all volumes can be sorted.
function htSlabs(v, R, bias) {
  // the rows stack along the head's up axis as seen; each row's outermost
  // points across that direction join up into bands
  const up = htAp(R, [0, 1, 0]), ul = Math.hypot(up[0], up[1]);
  const nrm = ul < 1e-3 ? [1, 0] : [-up[1] / ul, up[0] / ul];
  const rows = v.rows.map(([y, xc, ax, zc, az]) => {
    const c = htAp(R, [xc, y, zc]), p = htAp(R, [ax, 0, 0]), q = htAp(R, [0, 0, az]);
    const pn = p[0] * nrm[0] + p[1] * nrm[1], qn = q[0] * nrm[0] + q[1] * nrm[1];
    const e = Math.hypot(pn, qn);
    const d = e < 1e-6 ? [0, 0] : [(p[0] * pn + q[0] * qn) / e, (p[1] * pn + q[1] * qn) / e];
    return { c, p, q, w: htW(R, [xc, y, zc]), r: [c[0] + d[0], c[1] + d[1]], l: [c[0] - d[0], c[1] - d[1]] };
  });
  const P = (p) => `${htF(p[0])} ${htF(p[1])}`;
  // each band spans the rows on either side of its own, so neighbouring
  // bands overlap and no seam shows
  return rows.map((o, i) => {
    const a = rows[i - 1] || o, b = rows[i + 1] || o;
    const band = rows.length > 1 ? `<path d="M${P(a.r)}L${P(o.r)}L${P(b.r)}L${P(b.l)}L${P(o.l)}L${P(a.l)}Z"/>` : '';
    // the row's ellipse, unless seen edge-on (a near-flat ellipse adds nothing
    // and upsets clip paths)
    const det = o.p[0] * o.q[1] - o.p[1] * o.q[0];
    const ell = Math.abs(det) > 1e-3 ? `<circle r="1" transform="matrix(${htF(o.p[0])} ${htF(o.p[1])} ${htF(o.q[0])} ${htF(o.q[1])} ${htF(o.c[0])} ${htF(o.c[1])})"/>` : '';
    const shape = band + ell;
    return { depth: o.w + bias, shape, ell, det, r: o.r, l: o.l, svg: `<g fill="${v.fill}">${shape}</g>` };
  });
}
// the volume's outline alone (for a clip path): the outline down the right
// side and up the left, plus the rows' ellipses seen well open (the top and
// bottom of the head when tilted). Thin ellipses are left out: rsvg drops
// coverage where many thin shapes overlap in a clip path.
function htVolume(v, R) {
  const sl = htSlabs(v, R, 0);
  const pts = [...sl.map((s) => s.r), ...sl.map((s) => s.l).reverse()];
  const P = (p) => `${htF(p[0])} ${htF(p[1])}`;
  return (pts.length > 2 ? `<path d="M${pts.map(P).join('L')}Z"/>` : '') + sl.filter((s) => Math.abs(s.det) > 0.03).map((s) => s.ell).join('');
}

// opts: mouth (1–3), id (clip id prefix), R (a 3×3 matrix from head-local
// to picture coordinates, instead of yaw / pitch: a figure's head), part
// ('head': everything but the back layer; 'back': only it, drawn behind the
// body; 'all').
// drawn: the face's own drawings ({ front, side }: head, mouth, back). At
// the drawn angles they are used as drawn: the front drawing when the face
// looks straight at the viewer (any roll in the picture), the side drawing
// when the head is seen exactly from the side (any tilt, which is then a
// turn in the picture). Slices are only for the angles between.
const HT_EXACT = 0.9995;
export function headTurn(turn, yaw, pitch, { mouth = 2, id = 'ht', R = null, part = 'all', drawn = null } = {}) {
  R = R || htRot(yaw, pitch);
  const view = drawn && (R[2][2] > HT_EXACT ? 'front' : Math.abs(R[2][0]) > HT_EXACT ? 'side' : null);
  if (view && drawn[view]) {
    const d = drawn[view];
    // drawing coordinates -> picture: front (x right, y down); side (x forward = the face's direction, y down)
    const m = view === 'front' ? [R[0][0], R[1][0], R[0][1], R[1][1], 0, 0] : [R[0][2], R[1][2], R[0][1], R[1][1], 0, 0];
    const back = part !== 'head' ? d.back || '' : '';
    const head = part !== 'back' ? (d.head || '') + (d.mouth?.[mouth] || '') : '';
    return back || head ? `<g transform="matrix(${m.map(htF).join(' ')})">${back}${head}</g>` : '';
  }
  // front drawings while the camera sees more of the face than of its side
  const frontish = Math.abs(R[2][2]) >= Math.abs(R[2][0]);
  const facing = R[2][2];                                     // +1 face toward the viewer, -1 the back of the head
  // drawn layering wins near the front (under behind the skin, over in
  // front), depth toward the back of the head
  const bias0 = (layer) => ({ under: -0.15 * facing, back: -0.3 * facing, skin: 0, over: 0.15 }[layer] ?? 0);
  // a volume follows its front drawing's layer near the front and its side
  // drawing's toward the side view (the side drawing's layering is exact at 90°)
  const sw = (Math.abs(R[2][0]) / (Math.hypot(R[2][0], R[2][2]) || 1)) ** 4;
  const bias = (layer, sideLayer = layer) => (1 - sw) * bias0(layer) + sw * bias0(sideLayer);
  // the back layer (as drawn in the view it is closer to) goes behind the body
  const want = (layer) => part === 'all' || (part === 'back') === (layer === 'back');
  const items = [];
  const skin = turn.volumes.find((v) => v.layer === 'skin');
  const skinShape = skin ? htVolume(skin, R) : '';
  for (const v of turn.volumes) if (want(frontish ? v.layer : v.sideLayer || v.layer)) items.push(...htSlabs(v, R, bias(v.layer, v.sideLayer)));
  // cards: front ones while the face is turned under 45°, side ones past it
  const Xs = turn.side * (R[2][0] >= 0 ? 1 : -1);             // the side toward the viewer
  for (const c of turn.cards) {
    if (/^mouth-/.test(c.layer) && c.layer !== `mouth-${mouth}`) continue;
    if ((c.plane === 'front') !== frontish || !want(c.layer)) continue;
    let m, w;
    if (c.plane === 'front') {
      if (c.layer !== 'skin' && R[2][2] <= 0.02) continue;     // the face turned away
      m = [R[0][0], R[1][0], R[0][1], R[1][1], R[0][2] * c.depth, R[1][2] * c.depth];
      w = htW(R, [c.at[0], c.at[1], c.depth]);
    } else {
      m = [R[0][2], R[1][2], R[0][1], R[1][1], R[0][0] * Xs, R[1][0] * Xs];
      w = htW(R, [Xs, c.at[1], c.at[0]]);
    }
    const clip = c.layer === 'eyes' || /^mouth-/.test(c.layer);
    const g = `<g transform="matrix(${m.map(htF).join(' ')})">${c.svg}</g>`;
    // on the surface: just in front of the volume slab it sits on
    items.push({ depth: w + 0.3 + bias(c.layer), svg: clip && skin ? `<g clip-path="url(#${id}-skin)">${g}</g>` : g });
  }
  if (!items.length) return '';
  items.sort((a, b) => a.depth - b.depth);
  return `<defs><clipPath id="${id}-skin">${skinShape}</clipPath></defs>` + items.map((i) => i.svg).join('');
}

// A figure's head: head-local -> picture, from the side pose. The head
// tilts in the side plane by `tilt` (lean + chest + neck + head; + bows the
// face) and turns about its own up axis by `turn` (+ toward the body's near
// side). Front view: the camera looks at the body's front (picture-right =
// the near side). Side view: the camera looks at the side (picture-right =
// forward); the head is taken as symmetric, so the far side is shown, as in
// the side drawing.
export function headMatrix(tilt, turn, front) {
  const t = tilt * HT_RAD, a = (front ? turn : -turn) * HT_RAD;
  const ct = Math.cos(t), st = Math.sin(t), ca = Math.cos(a), sa = Math.sin(a);
  // head-local (x, y, z = face) -> body (X near side, Y down, Z forward): turn about Y, then tilt about X
  const turnM = [[ca, 0, sa], [0, 1, 0], [-sa, 0, ca]];
  const tiltM = [[1, 0, 0], [0, ct, st], [0, -st, ct]];
  const B = tiltM.map((r) => [0, 1, 2].map((j) => r[0] * turnM[0][j] + r[1] * turnM[1][j] + r[2] * turnM[2][j]));
  // body -> picture (u, v, w toward the viewer)
  return front ? [B[0], B[1], B[2]] : [B[2], B[1], B[0].map((v) => -v)];
}
