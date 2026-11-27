// The depth chart: where a standing man's feet and head are in the panel
// at each depth, from the renderer's own constants (src/scene.js), so the
// chart cannot drift from what panels draw.
//
//   node tools/depth-chart.mjs            # every panel height (TALLS) ->
//                                         # docs/design/depth-chart-<tall>.svg
//   node tools/depth-chart.mjs --tall 1.5 # one height
//
// x: the depth t (a number; the named depths marked on it). y: the height
// in the panel as a share of its height (0 the bottom edge, 1 the top).
// Feet at t × horizon, head at HEAD_TOP − t × (HEAD_TOP − horizon); the
// named depth `horizon` has its own size instead (HORIZON_UNIT), drawn as
// its own bar at t = 1. The shares are the same at every height (horizon's
// too); the labels add the pixels, which are not.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './lib.mjs';
import { DEPTH, HEAD_TOP, HORIZON, HORIZON_UNIT, MAX_DEPTH, MAN, PANEL_W, CLOSEUP_GROUND, TALLS } from '../src/scene.js';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const talls = arg('--tall') ? [Number(arg('--tall'))] : TALLS;
for (const tall of talls) {
  const hz = HORIZON, H = PANEL_W * tall, REF_H = 540;
  const feet = (t) => t * hz;
  const head = (t) => HEAD_TOP - t * (HEAD_TOP - hz);
  const horizonMan = HORIZON_UNIT * (H / REF_H) * MAN / H;   // share of the panel

  // colours: categorical slots 1, 2; text and grid inks (light surface)
  const C = { feet: '#257de0', head: '#f47230', text: '#191919', muted: '#666666', grid: '#e7e7e7', axis: '#c4c4c4', surface: '#ffffff' };

  const W = 820, HT = 440, m = { l: 64, r: 150, t: 44, b: 70 };
  const t0 = -0.75, tL = -0.25, t1 = 1.05, y0 = -0.2, y1 = 1.0;
  const X = (t) => m.l + (t - t0) / (t1 - t0) * (W - m.l - m.r);
  const Y = (v) => m.t + (y1 - v) / (y1 - y0) * (HT - m.t - m.b);
  const f = (v) => +v.toFixed(1);
  const pct = (v) => `${+(v * 100).toFixed(1)}%`;
  const pp = (v) => `${pct(v)} · ${Math.round(v * H)} px`;
  const txt = (x, y, s, o = {}) => `<text x="${f(x)}" y="${f(y)}" font-size="${o.size ?? 12}" fill="${o.fill ?? C.muted}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.weight ? ` font-weight="${o.weight}"` : ''}>${s}</text>`;

  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${HT}" width="${W}" height="${HT}" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif">`;
  s += `<title>Depth chart, tall ${tall}: a standing man's feet and head height in the panel against depth</title>`;
  s += `<rect width="${W}" height="${HT}" fill="${C.surface}"/>`;
  s += txt(m.l, 22, `A standing man at each depth — panel tall ${tall} (${PANEL_W}×${H}), horizon ${hz}`, { size: 14, fill: C.text, weight: 600 });

  // gridlines: y every 0.1; the panel's edges and the horizon labelled
  for (let v = -0.2; v <= 1.0001; v += 0.1) {
    const edge = Math.abs(v) < 1e-9 || Math.abs(v - 1) < 1e-9;
    s += `<line x1="${m.l}" x2="${W - m.r}" y1="${f(Y(v))}" y2="${f(Y(v))}" stroke="${edge ? C.axis : C.grid}" stroke-width="1"/>`;
    s += txt(m.l - 8, Y(v) + 4, pct(v), { anchor: 'end', size: 11 });
  }
  s += txt(W - m.r + 6, Y(1) + 4, 'top edge', { size: 11 });
  s += txt(W - m.r + 6, Y(0) + 4, 'bottom edge', { size: 11 });
  s += `<line x1="${m.l}" x2="${W - m.r}" y1="${f(Y(hz))}" y2="${f(Y(hz))}" stroke="${C.muted}" stroke-width="1" stroke-dasharray="4 4"/>`;
  s += txt(W - m.r + 6, Y(hz) + 4, `horizon ${pp(hz)}`, { size: 11 });

  // past MAX_DEPTH: flagged
  s += `<rect x="${f(X(MAX_DEPTH))}" y="${m.t}" width="${f(X(1) - X(MAX_DEPTH))}" height="${HT - m.t - m.b}" fill="#000" fill-opacity="0.05"/>`;
  s += txt(X((MAX_DEPTH + 1) / 2), m.t + 12, 'flagged', { anchor: 'middle', size: 10 });

  // the man: a band between feet and head, then the two lines
  const ts = Array.from({ length: 61 }, (_, i) => tL + (MAX_DEPTH - tL) * i / 60);
  s += `<path d="M${ts.map((t) => `${f(X(t))} ${f(Y(feet(t)))}`).join('L')}L${[...ts].reverse().map((t) => `${f(X(t))} ${f(Y(head(t)))}`).join('L')}Z" fill="${C.feet}" fill-opacity="0.08"/>`;
  for (const [k, fn] of [['feet', feet], ['head', head]])
    s += `<path d="M${ts.map((t) => `${f(X(t))} ${f(Y(fn(t)))}`).join('L')}" fill="none" stroke="${C[k]}" stroke-width="2" stroke-linecap="round"/>`;
  s += txt(X(tL) + 4, Y(head(tL)) - 8, 'head (top of the figure)', { fill: C.text, size: 12 });
  s += txt(X(tL) + 4, Y(feet(tL)) + 18, 'feet (bottom of the figure)', { fill: C.text, size: 12 });

  // the named depths: a rule, dots on both lines, the values
  for (const [name, t] of Object.entries(DEPTH)) {
    s += `<line x1="${f(X(t))}" x2="${f(X(t))}" y1="${m.t}" y2="${HT - m.b}" stroke="${C.axis}" stroke-width="1"/>`;
    for (const [k, v] of [['feet', feet(t)], ['head', head(t)]])
      s += `<circle cx="${f(X(t))}" cy="${f(Y(v))}" r="4.5" fill="${C[k]}" stroke="${C.surface}" stroke-width="2"/>`;
    s += txt(X(t) + 7, Y(head(t)) - 7, pp(head(t)), { fill: C.text, size: 11 });
    s += txt(X(t) + 7, Y(feet(t)) + 15, pp(feet(t)), { fill: C.text, size: 11 });
    s += txt(X(t) - 7, Y((head(t) + hz) / 2) - 8, `man ${pct(head(t) - feet(t))}`, { size: 11, anchor: 'end' });
    s += txt(X(t) - 7, Y((head(t) + hz) / 2) + 6, `${Math.round((head(t) - feet(t)) * H)} px`, { size: 11, anchor: 'end' });
    s += txt(X(t), HT - m.b + 32, `<tspan font-weight="600" fill="${C.text}">${name}</tspan>`, { anchor: 'middle', size: 12 });
  }
  // the named depth "horizon": its own fixed size, at t = 1
  s += `<line x1="${f(X(1))}" x2="${f(X(1))}" y1="${f(Y(hz))}" y2="${f(Y(hz + horizonMan))}" stroke="${C.feet}" stroke-width="6" stroke-linecap="round" stroke-opacity="0.35"/>`;
  s += `<circle cx="${f(X(1))}" cy="${f(Y(hz))}" r="4.5" fill="${C.feet}" stroke="${C.surface}" stroke-width="2"/>`;
  s += `<circle cx="${f(X(1))}" cy="${f(Y(hz + horizonMan))}" r="4.5" fill="${C.head}" stroke="${C.surface}" stroke-width="2"/>`;
  s += txt(X(1) + 8, Y(hz + horizonMan) + 4, `man ${pp(horizonMan)}`, { size: 11 });
  s += txt(X(1), HT - m.b + 32, `<tspan font-weight="600" fill="${C.text}">horizon</tspan>`, { anchor: 'middle', size: 12 });
  s += txt(X(1), HT - m.b + 46, 'its own size', { anchor: 'middle', size: 10 });

  // the framing "closeup": a camera raised to face height, not a depth on the
  // lines — the ground a panel below the bottom edge (feet off the chart),
  // the head at HEAD_TOP; its own column at the left
  const tc = -0.45, cl = HEAD_TOP - CLOSEUP_GROUND, eqT = 1 - cl / HEAD_TOP;
  s += `<line x1="${f(X(tc))}" x2="${f(X(tc))}" y1="${f(Y(y0) - 8)}" y2="${f(Y(HEAD_TOP))}" stroke="${C.feet}" stroke-width="6" stroke-linecap="round" stroke-opacity="0.35"/>`;
  s += `<path d="M${f(X(tc) - 7)} ${f(Y(y0) - 10)}L${f(X(tc) + 7)} ${f(Y(y0) - 10)}L${f(X(tc))} ${f(Y(y0))}Z" fill="${C.feet}"/>`;
  s += `<circle cx="${f(X(tc))}" cy="${f(Y(HEAD_TOP))}" r="4.5" fill="${C.head}" stroke="${C.surface}" stroke-width="2"/>`;
  s += txt(X(tc) + 8, Y(HEAD_TOP) - 7, pp(HEAD_TOP), { fill: C.text, size: 11 });
  s += txt(X(tc) + 8, Y(y0) - 18, `feet ${pct(CLOSEUP_GROUND)}`, { fill: C.text, size: 11 });
  s += txt(X(tc) + 8, Y(y0) - 4, `${Math.round(CLOSEUP_GROUND * H)} px`, { fill: C.text, size: 11 });
  s += txt(X(tc) + 8, Y(0.3), `man ${pct(cl)}`, { size: 11 });
  s += txt(X(tc) + 8, Y(0.3) + 14, `${Math.round(cl * H)} px`, { size: 11 });
  s += txt(X(tc), HT - m.b + 32, `<tspan font-weight="600" fill="${C.text}">closeup</tspan>`, { anchor: 'middle', size: 12 });
  s += txt(X(tc), HT - m.b + 46, `size of t = ${+eqT.toFixed(2)}`, { anchor: 'middle', size: 10 });

  // x axis: the numeric depth
  for (let t = -0.2; t <= 1.0001; t += 0.2) {
    s += `<line x1="${f(X(t))}" x2="${f(X(t))}" y1="${HT - m.b}" y2="${HT - m.b + 5}" stroke="${C.axis}"/>`;
    s += txt(X(t), HT - m.b + 17, +t.toFixed(1), { anchor: 'middle', size: 11 });
  }
  for (const t of Object.values(DEPTH)) s += txt(X(t), HT - m.b + 46, `= ${t}`, { anchor: 'middle', size: 10 });
  s += txt((m.l + W - m.r) / 2, HT - 6, 'depth t → farther (negative: nearer than the frame)', { anchor: 'middle', size: 12, fill: C.text });
  s += `<text transform="translate(16 ${f((m.t + HT - m.b) / 2)}) rotate(-90)" font-size="12" fill="${C.text}" text-anchor="middle">height in the panel (share of its height)</text>`;
  s += '</svg>\n';

  const out = join(root, 'docs/design', `depth-chart-${tall}.svg`);
  writeFileSync(out, s);
  console.log(out);
}
