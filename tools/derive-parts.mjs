// Start a new parts set from an existing one by reshaping it (a first draft
// for the artist to redraw), then write it into data/parts.json. Run
// tools/export-parts.mjs <id> afterwards for the editable SVG.
//
//   node tools/derive-parts.mjs monkey   # male, arms 12% longer (tail: species data)
//   node tools/derive-parts.mjs female   # male reshaped: hourglass front, bust and
//                                        # seat in side view, slimmer, a little shorter
//
// Torsos keep their edges node for node; the bent torsos are rebuilt from the
// new straight ones by carrying over how each point of the male torso moves
// when it bends (its turn and stretch about the waist).
import { json, writeOut } from './lib.mjs';

const id = process.argv[2];
const all = json('data/parts.json');
const male = all.parts.male;
const clone = (o) => JSON.parse(JSON.stringify(o));
const r4 = (v) => Math.round(v * 1e4) / 1e4;
const mapSegs = (segs, f) => segs.map((s) => s.map((p) => { const q = f(p); return [r4(q[0]), r4(q[1])]; }));
const lerpTable = (tab, y) => {           // piecewise-linear [[y, v], ...], y ascending
  if (y <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) if (y <= tab[i][0]) {
    const [y0, v0] = tab[i - 1], [y1, v1] = tab[i];
    return v0 + (v1 - v0) * (y - y0) / (y1 - y0);
  }
  return tab[tab.length - 1][1];
};
const bump = (y, at, w) => Math.exp(-(((y - at) / w) ** 2));

// a bent key for a new straight torso: each point turns and stretches about
// the waist as the same point of the male torso does
function bendLike(newStraight, mStraight, mBent) {
  const n3 = mStraight[3][0], n6 = mStraight[6][0];
  const pv = [(n3[0] + n6[0]) / 2, (n3[1] + n6[1]) / 2];
  return newStraight.map((s, i) => s.map((p, j) => {
    const a = [mStraight[i][j][0] - pv[0], mStraight[i][j][1] - pv[1]];
    const b = [mBent[i][j][0] - pv[0], mBent[i][j][1] - pv[1]];
    const ra = Math.hypot(...a), rb = Math.hypot(...b);
    const turn = Math.atan2(b[1], b[0]) - Math.atan2(a[1], a[0]);
    const k = ra > 1e-6 ? rb / ra : 1;
    const v = [p[0] - pv[0], p[1] - pv[1]];
    const c = Math.cos(turn), sn = Math.sin(turn);
    return [r4(pv[0] + (v[0] * c - v[1] * sn) * k), r4(pv[1] + (v[0] * sn + v[1] * c) * k)];
  }));
}
// make the outline turn smoothly through these nodes: the handles either
// side of a node are lined up (each keeps its length)
function smooth(T, nodes) {
  const n = T.length;
  for (const i of nodes) {
    const prev = T[(i - 1 + n) % n], next = T[i];
    const p = next[0], a = prev[2], b = next[1];
    const ua = [p[0] - a[0], p[1] - a[1]], ub = [b[0] - p[0], b[1] - p[1]];
    const la = Math.hypot(...ua), lb = Math.hypot(...ub);
    if (la < 1e-6 || lb < 1e-6) continue;
    const d = [ua[0] / la + ub[0] / lb, ua[1] / la + ub[1] / lb], ld = Math.hypot(...d);
    prev[2] = [r4(p[0] - d[0] / ld * la), r4(p[1] - d[1] / ld * la)];
    next[1] = [r4(p[0] + d[0] / ld * lb), r4(p[1] + d[1] / ld * lb)];
  }
  return T;
}
// a limb part: width × wx, length × ly (bone frame: bone along +y)
const limb = (L, wx, ly) => ({ front: mapSegs(L.front, ([x, y]) => [x * wx, y * ly]), side: mapSegs(L.side, ([x, y]) => [x * wx, y * ly]), len: r4(L.len * ly) });
const scaleAll = (segs, k) => mapSegs(segs, ([x, y]) => [x * k, y * k]);

let M;
if (id === 'monkey') {
  M = clone(male);
  M.upperArm = limb(male.upperArm, 1, 1.12);
  M.forearm = limb(male.forearm, 1, 1.12);
} else if (id === 'female') {
  M = clone(male);
  const H = 0.94;                                        // a little shorter
  // front: narrow shoulders and waist, wide rounded hips (hourglass)
  const front = [[-1.9, 0.8], [-1.5, 0.8], [-1.2, 0.86], [-0.95, 0.8], [-0.6, 0.72], [-0.3, 1.18], [-0.12, 1.24], [0.05, 1.08]];
  const reFront = ([x, y]) => [x * lerpTable(front, y), y * H];
  // side: waist in, bust forward (+x), seat back (-x)
  const reSide = ([x, y]) => {
    const w = 1 - 0.15 * bump(y, -0.6, 0.25);
    const dx = x > 0 ? 0.14 * bump(y, -1.15, 0.22) : -0.16 * bump(y, -0.15, 0.22);
    return [x * w + dx, y * H];
  };
  M.torso.front = smooth(mapSegs(male.torso.front, reFront), [3, 4, 5, 6]);
  M.torso.side = smooth(mapSegs(male.torso.side, reSide), [3, 6]);
  M.torso.frontBend = bendLike(M.torso.front, male.torso.front, male.torso.frontBend);
  M.torso.sideBend = bendLike(M.torso.side, male.torso.side, male.torso.sideBend);
  // slimmer, a little shorter limbs; smaller hands and feet; thinner neck
  M.upperArm = limb(male.upperArm, 0.85, H);
  M.forearm = limb(male.forearm, 0.85, H);
  M.thigh = limb(male.thigh, 0.92, H);
  M.shin = limb(male.shin, 0.85, H);
  M.neck = { segs: mapSegs(male.neck.segs, ([x, y]) => [x * 0.8, y]), len: male.neck.len };
  for (const v of ['front', 'side']) for (const h of Object.keys(M.hands[v])) M.hands[v][h] = scaleAll(male.hands[v][h], 0.88);
  M.foot = { front: scaleAll(male.foot.front, 0.9), side: scaleAll(male.foot.side, 0.9) };
} else throw new Error('usage: derive-parts.mjs monkey|female');

all.parts[id] = M;
console.log(writeOut('data/parts.json', JSON.stringify(all)));
