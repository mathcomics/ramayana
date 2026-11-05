// Write data/parts.json back out as the editable parts SVG, assembled the
// way the renderer uses it: every part at rotation 0 (limbs hanging
// straight down, neck straight up, feet flat), and parts that share a joint
// stacked on the same anchor (bent torsos on the straight ones, hands on the
// wrist, feet on the ankle), the side view beside the front.
//
//   node tools/export-parts.mjs [male]   -> data/parts/<id>.svg (overwrites)
//
// The file is in the renderer's frame: the figure faces right, front-view
// limbs are its near side (picture-right). 100 px = 1 head-unit, ground at
// y = 0.
import { json, writeOut } from './lib.mjs';

const id = process.argv[2] || 'male';
const M = json('data/parts.json').parts[id];
if (!M) throw new Error(`no parts "${id}" in data/parts.json`);
const K = 100;
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, s) => [a[0] * s, a[1] * s];
const node = (T, i) => T[i][0];
const at = (W, idx, T) => idx.map((i) => node(T, i)).reduce((acc, p, k) => add(acc, mul(p, W[k])), [0, 0]);
const moveSegs = (segs, o, flipY = false) => segs.map((s) => s.map((p) => add(o, flipY ? [-p[0], -p[1]] : p)));

// joints, standing straight (pelvis at 0,0, in head-units)
const T = M.torso.front;
const shoulder = at(M.attach.shoulder.w, M.attach.shoulder.idx, T);
const hip = at(M.attach.hip.w, M.attach.hip.idx, T);
const neckBase = at(M.attach.neck.w, M.attach.neck.idx, T);
const elbow = add(shoulder, [0, M.upperArm.len]);
const wrist = add(elbow, [0, M.forearm.len]);
const knee = add(hip, [0, M.thigh.len]);
const ankle = add(knee, [0, M.shin.len]);
const neckTop = add(neckBase, [0, -M.neck.len]);

// side view, assembled to the right on its own pelvis: the side torso with
// the side-bend torso on it, the side foot on its own ankle
const SX = 2.8;                                          // side pelvis, head-units right of the front
const sideOf = (segs) => moveSegs(segs, [SX, 0]);
const TS = M.torso.side;
// side-view joints: the model's own (attachSide), or first guesses taken
// from the front's, each at the same height as its front-view partner
const sideAt = (k, far) => {
  const a = M.attachSide?.[k];
  if (a) return at(a.w, a.idx, TS);
  const b = M.attach[k === 'shoulderFar' ? 'shoulder' : k];
  const idx = far ? b.idx.map((i) => M.mirror[i]) : b.idx;
  return at(b.w, idx, TS);
};
const level = (p, q) => [p[0], q[1]];                    // keep x, take the front partner's y
const sHip0 = M.attachSide ? sideAt('hip') : [(sideAt('hip')[0] + sideAt('hip', true)[0]) / 2, 0];
const sHip = add(level(sHip0, hip), [SX, 0]);            // one hip point for both legs
const sShoulder = add(M.attachSide ? sideAt('shoulder') : level(sideAt('shoulder'), shoulder), [SX, 0]);
const sShoulderFar = add(M.attachSide ? sideAt('shoulderFar') : level(sideAt('shoulder', true), shoulder), [SX, 0]);
const sNeck = add(M.attachSide ? sideAt('neck') : level(sideAt('neck'), neckBase), [SX, 0]);
const sElbow = add(sShoulder, [0, M.upperArm.len]), sWrist = add(sElbow, [0, M.forearm.len]);
const sKnee = add(sHip, [0, M.thigh.len]), sAnkle = add(sKnee, [0, M.shin.len]);
const hand = (H, w) => Object.fromEntries(Object.entries(H).map(([h, s]) => [`hand-${h}`, moveSegs(s, w)]));

const parts = {
  front: {
    torso: M.torso.front,
    neck: moveSegs(M.neck.segs, neckBase, true),            // bone points up: turn the down-frame over
    'upper-arm': moveSegs(M.upperArm.front, shoulder),
    forearm: moveSegs(M.forearm.front, elbow),
    ...hand(M.hands.front, wrist),
    thigh: moveSegs(M.thigh.front, hip),
    shin: moveSegs(M.shin.front, knee),
    foot: moveSegs(M.foot.front, ankle),
  },
  'front-bend': { torso: M.torso.frontBend },
  side: {
    torso: sideOf(M.torso.side),
    'upper-arm': moveSegs(M.upperArm.side, sShoulder),
    forearm: moveSegs(M.forearm.side, sElbow),
    ...hand(M.hands.side, sWrist),
    thigh: moveSegs(M.thigh.side, sHip),
    shin: moveSegs(M.shin.side, sKnee),
    foot: moveSegs(M.foot.side, sAnkle),
  },
  'side-bend': { torso: sideOf(M.torso.sideBend) },
};
const anchors = { shoulder, elbow, wrist, hip, knee, ankle, 'neck-base': neckBase, 'neck-top': neckTop,
  'side-shoulder': sShoulder, 'side-shoulder-far': sShoulderFar, 'side-elbow': sElbow, 'side-wrist': sWrist,
  'side-hip': sHip, 'side-knee': sKnee, 'side-ankle': sAnkle, 'side-neck-base': sNeck };

// ground at y = 0 (the lowest foot point), pelvis at x = 0
const lowest = Math.max(...[...parts.front.foot, ...parts.side.foot].flat().map((p) => p[1]));
const px = (p) => [p[0] * K, (p[1] - lowest) * K];
const f = (v) => +v.toFixed(2);
const P = (p) => `${f(px(p)[0])} ${f(px(p)[1])}`;
const onLine = ([a, b, c, d]) => [[b, 1 / 3], [c, 2 / 3]].every(([q, t]) =>
  Math.hypot(q[0] - (a[0] + (d[0] - a[0]) * t), q[1] - (a[1] + (d[1] - a[1]) * t)) < 1e-3);
const pathD = (segs) => `M ${P(segs[0][0])} ` + segs.map((s) => (onLine(s) ? `L ${P(s[3])}` : `C ${P(s[1])} ${P(s[2])} ${P(s[3])}`)).join(' ') + ' Z';

const style = 'fill:#b08a6a;fill-opacity:0.35;stroke:#241f1c;stroke-width:1';
const bendStyle = 'fill:#b06a6a;fill-opacity:0.2;stroke:#a03030;stroke-width:1;stroke-dasharray:5 3';
let body = '';
for (const [layer, items] of Object.entries(parts)) {
  const bend = layer.endsWith('bend');                  // drawn over the straight torso, red dashed
  body += `  <g id="${layer}" inkscape:groupmode="layer" inkscape:label="${layer}">\n`;
  for (const [name, segs] of Object.entries(items))
    body += `    <path id="${layer}-${name}" inkscape:label="${name}" style="${bend ? bendStyle : style}" d="${pathD(segs)}"/>\n`;
  body += '  </g>\n';
}
body += '  <g id="anchors" inkscape:groupmode="layer" inkscape:label="anchors">\n';
for (const [name, p] of Object.entries(anchors))
  body += `    <circle id="anchor-${name}" inkscape:label="${name}" cx="${f(px(p)[0])}" cy="${f(px(p)[1])}" r="4" style="fill:#d02020"/>\n`;
body += '  </g>\n';

const all = Object.values(parts).flatMap((o) => Object.values(o)).flat(2).map(px);
const pad = 40;
const x0 = f(Math.min(...all.map((p) => p[0])) - pad), y0 = f(Math.min(...all.map((p) => p[1])) - pad);
const w = f(Math.max(...all.map((p) => p[0])) + pad - x0), h = f(Math.max(...all.map((p) => p[1])) + pad - y0);

const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- ${id} body parts for the drawn-parts renderer (src/parts.js).
     Generated by tools/export-parts.mjs from data/parts.json; edit it here,
     then run tools/import-parts.mjs.

     The figure faces right; front-view limbs are its near side (picture-right).
     Every part is at rotation 0: limbs and hands hang straight down, the
     neck points up, feet are flat. Parts that share a joint sit on the same
     anchor: hands on the wrist, the foot on the ankle, and each bent torso
     (red dashed, layers front-bend / side-bend) on its straight one.
     The side view stands to the right with its own parts and anchors
     (side-...); a side anchor sits at the same height as its front partner,
     and one side-hip serves both legs. As the figure turns, each side part
     is blended with its front partner, so it keeps the same number of edges
     in the same order.

     Labels: torso, neck (front only), upper-arm, forearm, hand-fist,
     hand-out, hand-in, hand-point, thigh, shin, foot.
     anchors: shoulder, elbow, wrist, hip, knee, ankle, neck-base, neck-top,
     side-shoulder, side-shoulder-far, side-elbow, side-wrist, side-hip,
     side-knee, side-ankle, side-neck-base (the circle centre counts).
     100 px = 1 head-unit; ground at y = 0. -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
     width="${w}" height="${h}" viewBox="${x0} ${y0} ${w} ${h}">
<line x1="${x0}" x2="${f(x0 + w)}" y1="0" y2="0" stroke="#c9bfae" stroke-width="1"/>
${body}</svg>
`;
console.log(writeOut(`data/parts/${id}.svg`, svg));
