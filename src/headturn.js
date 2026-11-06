// A drawn head at any turn and tilt (step 4, branch head-turn), from the
// turn data import-faces computes for each face (tools/face-turn.mjs):
// volumes lofted from the front and side drawings, and flat cards (eyes,
// mouths, ears, marks) on their surface.
//
//   headTurn(turn, yaw, pitch, { mouth, id })  ->  SVG markup
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
  const rows = v.rows.map(([y, xc, ax, zc, az]) => {
    const c = htAp(R, [xc, y, zc]), p = htAp(R, [ax, 0, 0]), q = htAp(R, [0, 0, az]);
    const e = Math.hypot(p[0], q[0]);
    const d = e < 1e-6 ? [0, 0] : [(p[0] * p[0] + q[0] * q[0]) / e, (p[0] * p[1] + q[0] * q[1]) / e];
    return { c, p, q, w: htW(R, [xc, y, zc]), r: [c[0] + d[0], c[1] + d[1]], l: [c[0] - d[0], c[1] - d[1]] };
  });
  const P = (p) => `${htF(p[0])} ${htF(p[1])}`;
  return rows.map((o, i) => {
    const n = rows[i + 1];
    // the band gets a hairline stroke in its own colour, so neighbouring
    // bands don't show a seam
    const band = n ? `<path d="M${P(o.r)}L${P(n.r)}L${P(n.l)}L${P(o.l)}Z" stroke="${v.fill}" stroke-width="0.012" stroke-linejoin="round"/>` : '';
    const shape = band + `<circle r="1" transform="matrix(${htF(o.p[0])} ${htF(o.p[1])} ${htF(o.q[0])} ${htF(o.q[1])} ${htF(o.c[0])} ${htF(o.c[1])})"/>`;
    return { depth: o.w + bias, shape, r: o.r, l: o.l, svg: `<g fill="${v.fill}">${shape}</g>` };
  });
}
// the volume's outline alone (for a clip path)
function htVolume(v, R) {
  const sl = htSlabs(v, R, 0);
  // plus one outline down the right side and up the left, so the clip has no seams
  const pts = [...sl.map((s) => s.r), ...sl.map((s) => s.l).reverse()];
  const P = (p) => `${htF(p[0])} ${htF(p[1])}`;
  return (pts.length > 2 ? `<path d="M${pts.map(P).join('L')}Z"/>` : '') + sl.map((s) => s.shape.replace(/ stroke="[^"]*" stroke-width="[^"]*" stroke-linejoin="round"/, '')).join('');
}

export function headTurn(turn, yaw, pitch, { mouth = 2, id = 'ht' } = {}) {
  const R = htRot(yaw, pitch);
  const cy = Math.cos(yaw * HT_RAD), sy = Math.sin(yaw * HT_RAD);
  const frontish = Math.abs(cy) >= Math.abs(sy);
  const facing = cy * Math.cos(pitch * HT_RAD);
  // drawn layering wins near the front (under behind the skin, over in
  // front), depth toward the back of the head
  const bias = (layer) => ({ under: -0.15 * facing, back: -0.3 * facing, skin: 0, over: 0.15 }[layer] ?? 0);
  const items = [];
  const skin = turn.volumes.find((v) => v.layer === 'skin');
  const skinShape = skin ? htVolume(skin, R) : '';
  for (const v of turn.volumes) items.push(...htSlabs(v, R, bias(v.layer)));
  // cards: front ones while the face is turned under 45°, side ones past it
  const Xs = -turn.side * (sy < 0 ? -1 : 1);                  // the side toward the viewer
  for (const c of turn.cards) {
    if (/^mouth-/.test(c.layer) && c.layer !== `mouth-${mouth}`) continue;
    if ((c.plane === 'front') !== frontish) continue;
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
  items.sort((a, b) => a.depth - b.depth);
  return `<defs><clipPath id="${id}-skin">${skinShape}</clipPath></defs>` + items.map((i) => i.svg).join('');
}
