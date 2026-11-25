import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { renderPanel, panelHeight, svgInner, findPose, PANEL_W, MAN } from '../src/scene.js';
import { loadAssets, loadSections } from '../tools/lib.mjs';
import { buildShapes, characterLook } from '../src/figure.js';

const assets = loadAssets();
const xOf = (svg, n) => [...svg.matchAll(/<g transform="translate\(([-\d.e]+) ([-\d.e]+)\) scale\(/g)].map((m) => +m[1])[n];

test('panel height is tall × width (1.5, 1, 0.6), with a fallback', () => {
  assert.equal(panelHeight({}), 540);
  assert.equal(panelHeight({ tall: 1 }), 360);
  assert.equal(panelHeight({ tall: 0.6 }), Math.round(0.6 * PANEL_W));
  assert.equal(panelHeight({ tall: 2 }), 540);            // nothing taller than 1.5
  assert.equal(panelHeight({ tall: -1 }), 540);
  assert.equal(renderPanel({ tall: 'big' }, assets).issues.length, 1);
  assert.equal(renderPanel({ tall: 2 }, assets).issues.length, 1);
  assert.equal(renderPanel({ size: 0.5 }, assets).issues.length, 1);  // the old field
});

test('every committed panel renders without issues (placeholders aside)', () => {
  for (const sec of loadSections()) for (const { id, def } of sec.panels) {
    const r = renderPanel(def, assets, { id });
    assert.deepEqual(r.issues.filter((m) => !/placeholder/.test(m)), [], id);
    assert.match(r.svg, /^<svg [^>]*viewBox="0 0 360 \d+"/);
  }
});

test('unknown names become issues, not crashes', () => {
  const r = renderPanel({ ground: 'mauve', figures: [
    { prop: 'spaceship' },
    { character: 'nobody' }, { character: 'rama', pose: 'moonwalk', depth: 'sky', at: 'far-left' },
  ] }, assets);
  const all = r.issues.join('\n');
  for (const s of ['mauve', 'nobody', 'moonwalk', 'sky', 'far-left', 'spaceship']) assert.match(all, new RegExp(s));
});

test('placement: numbers, slots and relations', () => {
  const fig = (extra) => ({ character: 'rama', pose: 'step-hang', ...extra });
  const at = (a) => xOf(renderPanel({ figures: [fig({ at: a })] }, assets).svg, 0);
  assert.equal(at(0.25), 90);
  assert.equal(at('right'), 0.86 * 360);
  const rel = (r, facing = 'right') => {
    const svg = renderPanel({ figures: [fig({ id: 'a', at: 0.5, facing }), fig({ at: { [r]: 'a' } })] }, assets).svg;
    return xOf(svg, 1) - xOf(svg, 0);
  };
  assert.ok(rel('right-of') > 0 && rel('left-of') < 0);
  assert.ok(rel('before', 'right') > 0 && rel('before', 'left') < 0);   // in front of the face
  assert.ok(rel('behind', 'right') < 0);
  assert.equal(Math.round(rel('right-of')), -Math.round(rel('left-of')));
});

test('depth: back figures stand higher and smaller', () => {
  const svg = renderPanel({ figures: [{ character: 'rama', depth: 'front' }, { character: 'rama', depth: 'back' }] }, assets).svg;
  const g = [...svg.matchAll(/translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)/g)].map((m) => [+m[2], +m[3]]);
  assert.ok(g[1][0] < g[0][0] && g[1][1] < g[0][1]);
});

test('missing props draw a labelled placeholder', () => {
  const r = renderPanel({ figures: [{ prop: 'cave' }] }, assets);
  assert.match(r.svg, /class="placeholder"[\s\S]*>cave</);
});

test('one list: later entries draw over earlier; legacy props/who/layer still read', () => {
  // the prop after the figure is drawn after it (a foreground); rama's
  // body colour marks the figure in the stream
  const body = '#916f6f';
  const after = renderPanel({ figures: [{ character: 'rama', pose: 'step-hang' }, { prop: 'cave' }] }, assets).svg;
  assert.ok(after.indexOf('class="placeholder"') > after.indexOf(body), 'prop after the figure draws over it');
  const before = renderPanel({ figures: [{ prop: 'cave' }, { character: 'rama', pose: 'step-hang' }] }, assets).svg;
  assert.ok(before.indexOf('class="placeholder"') < before.indexOf(body), 'prop before the figure draws behind it');
  // old form: separate props list with layer, figures with who — same render
  const legacy = renderPanel({ props: [{ prop: 'cave', layer: 'front' }], figures: [{ who: 'rama', pose: 'step-hang' }] }, assets);
  assert.equal(legacy.svg, after);
  assert.deepEqual(legacy.issues.filter((i) => !/placeholder/.test(i)), []);
  // in the one list, layer is retired
  const r = renderPanel({ figures: [{ prop: 'cave', layer: 'front' }] }, assets);
  assert.match(r.issues.join('\n'), /"layer" is retired/);
});

test('sky: a colour above the horizon; depth "horizon" stands things on it', () => {
  const r = renderPanel({ tall: 1, sky: 'blue-sky', horizon: 0.25, figures: [{ prop: 'stag-run', depth: 'horizon' }] }, assets);
  assert.match(r.svg, /<rect width="360" height="270" fill="url\(#panel-sky\)"\/>/);
  assert.ok(r.svg.includes(`<stop offset="0" stop-color="${assets.grounds.grounds['blue-sky'][0]}"/>`), 'sky gradient from grounds.json');
  // the ground's vertical gradient starts at the horizon; without a sky it spans the panel
  assert.match(renderPanel({ tall: 1, ground: 'grass', sky: 'blue-sky', horizon: 0.25 }, assets).svg, /id="panel-ground" gradientUnits="userSpaceOnUse" x1="0" y1="270" x2="0" y2="360"/);
  assert.match(renderPanel({ tall: 1, ground: 'grass' }, assets).svg, /id="panel-ground" x1="0" y1="0" x2="0" y2="1"/);
  // a hex sky (or ground) is a flat fill; a hex ground draws no gradient
  const flat = renderPanel({ ground: '#123456', sky: '#abcdef' }, assets).svg;
  assert.match(flat, /<rect width="360" height="\d+(\.\d+)?" fill="#123456"\/><rect width="360" height="[\d.]+" fill="#abcdef"\/>/);
  assert.doesNotMatch(flat, /linearGradient/);
  const y = +r.svg.match(/<g transform="translate\([-\d.]+ ([-\d.]+)\) scale\(/)?.[1];
  assert.ok(Math.abs(y + 5.557 * 16 * 360 / 540 - 270) < 0.01, `deer bottom on the horizon (${y})`);
  assert.equal(renderPanel({ sky: 'nope' }, assets).issues.length, 1);
});

test('depth: perspective depths, closeup, top, numbers, a top view; row retired; shot and zoom retired', () => {
  const propY = (depth, extra = {}, panel = {}) => {
    const r = renderPanel({ ...panel, figures: [{ prop: 'stag-run', depth, ...extra }] }, assets);
    const [, y, sc] = r.svg.match(/<g transform="translate\([-\d.]+ ([-\d.]+)\) scale\(([-\d.]+)/);
    return { top: +y, unit: +sc, bottom: +y + assets.props.props['stag-run'].size[1] * +sc, issues: r.issues };
  };
  const man = (t) => 0.75 * (1 - t) * 540 / MAN;
  const near = (a, b) => Math.abs(a - b) < 0.01;
  for (const [d, t] of [['front', 0.08], ['mid', 0.4], ['back', 0.7]]) {
    const p = propY(d);
    assert.ok(near(p.unit, man(t)) && near(p.bottom, 540 * (1 - t * 0.37)), `${d}`);
  }
  // the horizon moves a depth's ground line, not its size
  const low = renderPanel({ horizon: 0.2, figures: [{ prop: 'stag-run', depth: 'back' }] }, assets).svg;
  assert.ok(near(+low.match(/scale\(([-\d.]+)/)[1], man(0.7)), 'the horizon leaves sizes alone');
  const c = propY('closeup');
  assert.ok(near(c.unit, 1.75 * 540 / MAN) && near(c.bottom, 1080), 'closeup: ground a panel below, head at 75 %');
  const t = propY('top');
  assert.ok(near(t.top, 0) && near(t.unit, man(0.08)), 'top: top edge on the panel top, front size');
  // a number is a depth: the ground line and the size together; negative is nearer than the frame
  for (const d of [0.5, 0.25, -0.5]) {
    const n = propY(d);
    assert.ok(near(n.bottom, 540 * (1 - d * 0.37)) && near(n.unit, man(d)), `depth ${d}`);
  }
  assert.deepEqual(propY(0.4).unit.toFixed(6), propY('mid').unit.toFixed(6), 'a named depth is its number');
  assert.match(propY(1).issues.join(' '), /depth 1 is at or past the horizon/);
  // nudge moves without resizing
  const up = propY(0.5, { nudge: [0, 1] });
  assert.ok(near(up.bottom, propY(0.5).bottom - man(0.5)) && near(up.unit, man(0.5)), 'nudge [dx, dy]: own head-units, + up, same size');
  // a top view: a number is a height up the ground, at front size
  const tv = propY(0.5, {}, { camera: 'top' });
  assert.ok(near(tv.bottom, 270) && near(tv.unit, man(0.08)), 'camera top: no perspective');
  assert.match(propY('front', {}, { camera: 'side' }).issues.join(' '), /the only camera is "top"/);
  // the retired row: still drawn as before (a number: a height at front size), and flagged
  const old = renderPanel({ figures: [{ prop: 'stag-run', row: 0.5 }] }, assets);
  assert.match(old.issues.join(' '), /"row" is retired/);
  assert.ok(near(+old.svg.match(/translate\([-\d.]+ ([-\d.]+)\) scale\(([-\d.]+)/)[2], man(0.08)), 'old row: front size');
  assert.match(propY(0.5, { lift: 1 }).issues.join(' '), /"lift" is retired/);
  assert.equal(propY('nope').issues.filter((i) => /depth "nope"/.test(i)).length, 1);
  for (const k of ['shot', 'zoom']) assert.match(renderPanel({ [k]: 'wide' }, assets).issues.join(' '), new RegExp(`"${k}" is retired`));
});

test('repeat "to": a line into the picture, each copy touching the last and sized by its depth', () => {
  const line = { prop: 'rock-square', id: 's', at: 0.1, depth: 0, repeat: { n: 4, to: { at: 0.6, depth: 0.8 }, scale: [1, 1], rotate: [0, 0] } };
  const r = renderPanel({ tall: 1, figures: [line, { character: 'monkey1', pose: 'step-hang', on: 's-2#stand' }] }, assets);
  assert.deepEqual(r.issues, []);
  const L = Object.fromEntries(r.layout.map((l) => [l.name, l]));
  const ds = ['s', 's-1', 's-2', 's-3'].map((k) => L[k]);
  for (let k = 1; k < 4; k++) {
    assert.ok(ds[k].groundY < ds[k - 1].groundY && ds[k].unit < ds[k - 1].unit && ds[k].x > ds[k - 1].x, `copy ${k} farther, smaller, along the line`);
    // touching: the centres as far apart as the half-extents along the line
    const dx = ds[k].x - ds[k - 1].x, dy = ds[k].groundY - ds[k - 1].groundY, len = Math.hypot(dx, dy), u = [dx / len, dy / len];
    const ext = (l) => Math.abs(l.size[0] * l.unit * u[0]) + Math.abs(l.size[1] * l.unit * u[1]);
    assert.ok(Math.abs(len - (ext(ds[k]) + ext(ds[k - 1])) / 2) < 0.5, `copy ${k} touches the one before`);
  }
  // drawn farthest first; a figure on a copy takes its depth
  assert.deepEqual(r.layout.slice(0, 4).map((l) => l.name), ['s-3', 's-2', 's-1', 's']);
  assert.ok(Math.abs(L.monkey1.unit - L['s-2'].rowUnit) < 1e-9);
  assert.match(renderPanel({ figures: [{ ...line, repeat: { n: 9, to: { at: 0.5, depth: 0.9 } } }] }, assets).issues.join(' '), /reaches the horizon/);
  assert.match(renderPanel({ figures: [{ ...line, repeat: { n: 3, to: { at: 0.5 } } }] }, assets).issues.join(' '), /repeat "to" takes/);
});

test('"on": a figure sits on the prop\'s seat, at its row (not the prop\'s scale); mirrored props mirror the seat', () => {
  const seat = assets.props.props['throne-ayodhya'].anchors.seat;
  // the hips: the underside of the thighs at the pelvis, in the figure's frame
  const kingPose = JSON.parse(JSON.stringify(findPose(assets, 'sit-armknee').pose));
  const kingLook = characterLook(assets.characters.characters.find((c) => c.id === 'dasharatha'), assets.characters.colors, assets.faces);
  const { joints: kj, shapes: ks } = buildShapes(assets.species[kingLook.species], kingPose, kingLook.outfit, 'side', kingLook.bodyScale, kingLook.who);
  const hipsY = Math.max(...ks.filter((s) => /-thigh$/.test(s.part || '')).flatMap((s) => s.pts).filter((q) => Math.abs(q[0] - kj.spine.pelvis[0]) <= 0.25).map((q) => q[1]));
  for (const facing of ['right', 'left']) {
    const r = renderPanel({ figures: [{ prop: 'throne-ayodhya', at: 0.5, depth: 'mid', facing }, { character: 'dasharatha', pose: 'sit-armknee', on: 'throne-ayodhya' }] }, assets);
    assert.deepEqual(r.issues.filter((i) => !/placeholder/.test(i)), []);
    const [, fy, fs] = r.svg.match(/data-panel[\s\S]*?<\/g><g transform="translate\([-\d.]+ ([-\d.]+)\) scale\(([-\d.]+)/) || [];
    const unit = 0.75 * (1 - 0.4) * 540 / MAN, top = 540 * (1 - 0.4 * 0.37) - assets.props.props['throne-ayodhya'].size[1] * unit;
    assert.ok(Math.abs(+fy + hipsY * unit - (top + seat[1] * unit)) < 0.01, `${facing}: the hips on the seat`);
    assert.equal(Math.abs(+fs), unit);
  }
  assert.equal(renderPanel({ figures: [{ character: 'rama', pose: 'sit-armknee', on: 'throne-ayodhya' }] }, assets).issues.length, 1);
  // nudge moves a seated figure off the seat, and a nudged prop carries its sitter
  const at = (figs) => renderPanel({ figures: figs }, assets).svg.match(/data-panel[\s\S]*?<\/g><g transform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)/).slice(1).map(Number);
  const throne = { prop: 'throne-ayodhya', at: 0.5, depth: 'mid' }, king = { character: 'dasharatha', pose: 'sit-armknee', on: 'throne-ayodhya' };
  const [x0, y0, u] = at([throne, king]);
  const [x1, y1] = at([throne, { ...king, nudge: [0.5, 1] }]);
  assert.ok(Math.abs(x1 - x0 - 0.5 * u) < 0.01 && Math.abs(y0 - y1 - u) < 0.01, 'nudge on a seated figure');
  const [x2, y2] = at([{ ...throne, nudge: [1, 1] }, king]);
  assert.ok(Math.abs(x2 - x0 - u) < 0.01 && Math.abs(y0 - y2 - u) < 0.01, 'the sitter follows a nudged prop');
  // a bigger throne does not make a bigger king: the sitter keeps its depth's size × its own scale
  assert.equal(at([{ ...throne, scale: 2 }, king])[2], u, 'the prop\'s scale stays with the prop');
  assert.ok(Math.abs(at([{ ...throne, scale: 2 }, { ...king, scale: 0.5 }])[2] - u / 2) < 1e-9, 'the figure\'s own scale');
  assert.match(renderPanel({ figures: [throne, { ...king, at: 0.2, depth: 'back' }] }, assets).issues.join(' '), /"at" does nothing with "on"[\s\S]*"depth" does nothing with "on"/);
});

test('"on" a figure: a carried prop on its hands, head or shoulder, from the skeleton', () => {
  const look = characterLook(assets.characters.characters.find((c) => c.id === 'hanuman'), assets.characters.colors, assets.faces);
  const pose = JSON.parse(JSON.stringify(findPose(assets, 'arch-overhead').pose));
  const num = (v) => +v;
  for (const [view, facing] of [['front', 'right'], ['side', 'right'], ['side', 'left']]) {
    const { joints } = buildShapes(assets.species.monkey, pose, look.outfit, view, look.bodyScale, look.who);
    const r = renderPanel({ figures: [
      { character: 'hanuman', id: 'h', pose: 'arch-overhead', view, facing, at: 0.4, depth: 'mid' },
      { prop: 'rock-circle', on: 'h#hands', scale: 0.5 },
    ] }, assets);
    assert.deepEqual(r.issues, [], view);
    const [fx, fy, fu] = r.svg.match(/data-panel[\s\S]*?<g transform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)/).slice(1).map(num);
    const [px, py, pu] = [...r.svg.matchAll(/<g transform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+) /g)].at(-1).slice(1).map(num);
    const size = assets.props.props['rock-circle'].size, f = facing === 'left' ? -1 : 1;
    const mid = [(joints.near.grip[0] + joints.far.grip[0]) / 2, (joints.near.grip[1] + joints.far.grip[1]) / 2];
    // the rock's bottom centre on the hands' midpoint, at the carrier's depth × its own scale
    const u = Math.abs(fu);
    assert.ok(Math.abs(Math.abs(pu) - u * 0.5) < 1e-9, `${view}: the depth's size × scale`);
    // (the rock keeps its own facing: right)
    assert.ok(Math.abs(px + size[0] * Math.abs(pu) / 2 - (fx + f * mid[0] * u)) < 1e-6, `${view} ${facing}: centred between the hands`);
    assert.ok(Math.abs(py + size[1] * Math.abs(pu) - (fy + mid[1] * u)) < 1e-6, `${view} ${facing}: resting on them`);
  }
  // the others place without issues; a wrong anchor and a circle are flagged
  for (const a of ['hand-right', 'hand-left', 'head', 'shoulder'])
    assert.deepEqual(renderPanel({ figures: [{ character: 'rama', pose: 'step-hang' }, { prop: 'rock-circle', on: `rama#${a}`, scale: 0.3 }] }, assets).issues, [], a);
  assert.match(renderPanel({ figures: [{ character: 'rama', pose: 'step-hang' }, { prop: 'rock-circle', on: 'rama#knee' }] }, assets).issues.join(' '), /a figure's anchor is #hand-right/);
  assert.match(renderPanel({ figures: [{ character: 'rama', id: 'a', pose: 'step-hang', on: 'b#shoulder' }, { character: 'sita', id: 'b', pose: 'step-hang', on: 'a#shoulder' }] }, assets).issues.join(' '), /goes round in a circle/);
});

test('a foreground: a band of ground in the list; "on" stands entries on its line at their own x', () => {
  const fg = { foreground: [0.1, 0.3], color: '#667456' };
  const place = (figs) => renderPanel({ tall: 1, figures: figs }, assets);
  const feet = (svg) => [...svg.matchAll(/<g transform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)/g)].map((m) => m.slice(1).map(Number));
  // the band: from the bottom edge up to the line, drawn at its place in the list
  const r = place([{ character: 'rama', pose: 'step-hang', at: 0.5 }, fg]);
  assert.deepEqual(r.issues, []);
  assert.ok(r.svg.endsWith('<path d="M0 360L0 324L360 252L360 360Z" fill="#667456"/></svg>'), 'drawn last: over the figure before it');
  // on it: the line's height at x (0.25 across: 0.15 of the panel), front size; nudge dy from the line
  const [[x, y, u]] = feet(place([fg, { character: 'rama', pose: 'step-hang', at: 0.25, on: 'foreground' }]).svg);
  assert.ok(Math.abs(x - 90) < 1e-6 && Math.abs(y - 360 * 0.85) < 1e-6, 'feet on the line');
  const [[, y2]] = feet(place([fg, { character: 'rama', pose: 'step-hang', at: 0.25, on: 'foreground', nudge: [0, -1] }]).svg);
  assert.ok(Math.abs(y2 - y - u) < 1e-6, 'nudge [0, -1]: a head below the line');
  // across nudge: the feet follow the slope
  const [[x3, y3]] = feet(place([fg, { character: 'rama', pose: 'step-hang', at: 0.25, on: 'foreground', nudge: [1, 0] }]).svg);
  assert.ok(Math.abs(x3 - 90 - u) < 1e-6 && Math.abs(y3 - 360 * (1 - (0.1 + 0.2 * x3 / 360))) < 1e-6, 'along the slope');
  // the retired row on a foreground is flagged; depth there sets the size only; a band takes its own "id"
  assert.match(place([fg, { character: 'rama', pose: 'step-hang', on: 'foreground', row: 'mid' }]).issues.join(' '), /"row" does nothing on a foreground/);
  const deep = place([fg, { character: 'rama', pose: 'step-hang', at: 0.25, on: 'foreground', depth: 0.4 }]);
  assert.deepEqual(deep.issues, []);
  const [[, yd]] = feet(deep.svg);
  assert.ok(Math.abs(yd - y) < 1e-6, 'depth on a foreground: the feet stay on the line');
  assert.ok(Math.abs(deep.layout.at(-1).unit - 0.75 * 0.6 * 360 / MAN) < 1e-9, 'depth on a foreground: the size is the depth\'s');
  assert.deepEqual(place([{ ...fg, id: 'hill' }, { character: 'rama', pose: 'step-hang', on: 'hill' }]).issues, []);
  assert.match(place([{ foreground: 'x', color: 'forest' }]).issues.join(' '), /takes \[left, right\]/);
});

test('a "hand" anchor: the figure hangs by its higher hand, or the one "hand" names', () => {
  const wall = { prop: 'city-side', at: 0.5, depth: 'front' }, def = assets.props.props['city-side'];
  const fig = (extra) => ({ character: 'hanuman', pose: 'leap-reach', on: 'city-side#hand', ...extra });
  const r = renderPanel({ tall: 1, figures: [wall, fig({})] }, assets);
  assert.deepEqual(r.issues, []);
  const [, fx, fy, fs] = r.svg.match(/<\/g><g transform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)/).map(Number);
  // where the anchor is in the panel
  const unit = fs, H = 360, ground = H * (1 - 0.08 * 0.37), top = ground - def.size[1] * unit;
  const ax = 180 + (def.anchors.hand[0] - def.size[0] / 2) * unit, ay = top + def.anchors.hand[1] * unit;
  const pose = JSON.parse(JSON.stringify(findPose(assets, 'leap-reach').pose));
  const look = characterLook(assets.characters.characters.find((c) => c.id === 'hanuman'), assets.characters.colors, assets.faces);
  const { joints } = buildShapes(assets.species[look.species], pose, look.outfit, 'side', look.bodyScale, look.who);
  const g = [joints.near.grip, joints.far.grip].sort((a, b) => a[1] - b[1])[0];
  assert.ok(Math.abs(fx + g[0] * unit - ax) < 1e-6 && Math.abs(fy + g[1] * unit - ay) < 1e-6, 'the higher grip on the anchor');
  assert.match(renderPanel({ figures: [fig({ hand: 'left', on: undefined })] }, assets).issues.join(' '), /"hand" picks the hand/);
  assert.match(renderPanel({ figures: [wall, { prop: 'stag-stand', on: 'city-side#hand' }] }, assets).issues.join(' '), /takes a figure/);
});

test('a prop with a "feet" anchor stands on it, facing either way', () => {
  const rock = { prop: 'rock-circle', at: 0.5 }, def = assets.props.props['vulture-lookback'];
  const rd = assets.props.props['rock-circle'];
  for (const facing of ['right', 'left']) {
    const r = renderPanel({ tall: 1, figures: [rock, { prop: 'vulture-lookback', facing, on: 'rock-circle#stand' }] }, assets);
    assert.deepEqual(r.issues, []);
    const g = [...r.svg.matchAll(/<g transform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)(?: ([-\d.]+))?\)/g)].map((m) => m.slice(1).map(Number));
    const [rx, ry, ru] = g[0], [vx, vy, vs] = g[1];
    // the rock's stand anchor, and the vulture's feet, in the panel
    const ax = rx + rd.anchors.stand[0] * ru, ay = ry + rd.anchors.stand[1] * ru;
    const fx = vx + def.anchors.feet[0] * vs, fy = vy + def.anchors.feet[1] * Math.abs(vs);
    assert.ok(Math.abs(fx - ax) < 1e-6 && Math.abs(fy - ay) < 1e-6, `${facing}: feet (${fx}, ${fy}) on the anchor (${ax}, ${ay})`);
  }
});

test('a seat anchor takes the hips, a stand anchor the feet', () => {
  const rock = { prop: 'rock-square', at: 0.5, scale: 0.5 };
  const y = (on) => +renderPanel({ figures: [rock, { character: 'sita', pose: 'chair-grief', on }] }, assets).svg.match(/<\/g><g transform="translate\([-\d.]+ ([-\d.]+)\) scale\(/)[1];
  const def = assets.props.props['rock-square'];
  assert.equal(def.anchors.seat[1], def.anchors.stand[1]);       // the same point on this rock
  assert.ok(y('rock-square#seat') - y('rock-square#stand') > 0.5 * 0.08 * 540 / MAN, 'seated: the feet hang below the seat');
});

test('rotate on a figure: about its anchor when on a prop; else about its centre, standing on its turned box', () => {
  const wall = { prop: 'city-side', at: 0.5, scale: 2.8972, depth: -0.2703 };
  const fig = { character: 'hanuman', pose: 'crawl-onhands', facing: 'left', on: 'city-side#hand', scale: 0.09 };
  const plain = renderPanel({ tall: 1.5, figures: [wall, fig] }, assets);
  const turned = renderPanel({ tall: 1.5, figures: [wall, { ...fig, rotate: 90 }] }, assets);
  assert.deepEqual(turned.issues, []);
  const [, px, py] = turned.svg.match(/<g transform="rotate\(90 ([-\d.]+) ([-\d.]+)\)">/).map(Number);
  // the pivot is the gripping hand, so the grip stays put
  assert.ok(px > 0 && py > 0);
  assert.ok(turned.svg.includes(plain.svg.slice(plain.svg.indexOf('</g><g') + 4, plain.svg.lastIndexOf('</svg>'))), 'the figure itself unchanged inside the turn');
  const free = renderPanel({ figures: [{ character: 'rama', pose: 'step-hang', at: 0.5, rotate: 90 }] }, assets).svg;
  assert.match(free, /<g transform="translate\(0 [-\d.]+\) rotate\(90 180 [-\d.]+\)">/);
  assert.equal(renderPanel({ figures: [{ character: 'rama', pose: 'step-hang', at: 0.5, rotate: 0 }] }, assets).svg,
    renderPanel({ figures: [{ character: 'rama', pose: 'step-hang', at: 0.5 }] }, assets).svg);
});

test('two panels on one page never share an id', () => {
  const a = renderPanel({ figures: [{ character: 'rama' }] }, assets, { id: '01.01' }).svg;
  const b = renderPanel({ figures: [{ character: 'rama' }] }, assets, { id: '01.02' }).svg;
  const ids = (s) => [...s.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids(a).filter((x) => ids(b).includes(x)), []);
});

test('svgInner keeps the drawing, drops the guide layer and editor markup', () => {
  const src = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="x">
    <sodipodi:namedview id="nv"/><metadata>m</metadata><!-- note -->
    <g inkscape:label="guide"><rect width="1" height="1"/></g>
    <g inkscape:groupmode="layer" inkscape:label="hills"><path d="M0 0L1 1"/></g></svg>`;
  const out = svgInner(src);
  assert.match(out, /<path d="M0 0L1 1"\/>/);
  for (const s of ['namedview', 'metadata', 'note', 'rect', 'inkscape:']) assert.ok(!out.includes(s), s);
  assert.equal(svgInner(''), '');
});

test('a character without a drawn face is an issue (no generated fallback)', () => {
  const noFace = { ...assets, faces: { faces: {} } };
  const r = renderPanel({ figures: [{ character: 'rama' }, { character: 'sita', view: 'front' }] }, noFace);
  assert.match(r.issues.join('\n'), /rama\): no drawn face/);
  assert.match(r.issues.join('\n'), /sita\): no drawn face/);
});

test('MAN is the drawn male standing straight (feet to head top)', async () => {
  const { renderFigure } = await import('../src/figure.js');
  const p = JSON.parse(JSON.stringify(findPose(assets, 'walk-swing').pose));
  p.spine = { lean: 0, chest: 0, neck: 0, head: 0, turn: 0 };
  for (const s of ['right', 'left']) {
    Object.assign(p[s].leg, { hip: 0, knee: 0, ankle: 0, out: 0, kneeOut: 0, toe: 0 });
    Object.assign(p[s].arm, { shoulder: 0, elbow: 0, wrist: 0, out: 0, elbowOut: 0, twist: 0 });
  }
  const { bbox } = renderFigure(assets.species.male, p, { scale: 1 });
  assert.ok(Math.abs(bbox.y1 - bbox.y0 - MAN) < 0.1, `drawn male is ${(bbox.y1 - bbox.y0).toFixed(2)} head-units, MAN is ${MAN}`);
});

test('every panel tag is listed in panels/layouts.md (Tags)', () => {
  const md = readFileSync(join(import.meta.dirname, '../panels/layouts.md'), 'utf8');
  const listed = new Set([...md.matchAll(/^\| `([a-z-]+)` \|/gm)].map((m) => m[1]));
  for (const sec of loadSections()) for (const { id, def } of sec.panels)
    for (const t of def.tags || []) assert.ok(listed.has(t), `${id}: tag ${t} is not in panels/layouts.md`);
});

test('a figure sets "mouth" only to override its gesture\'s mouth', () => {
  const G = JSON.parse(readFileSync(join(import.meta.dirname, '../data/gestures.json'), 'utf8')).gestures;
  for (const sec of loadSections()) for (const { id, def } of sec.panels)
    for (const e of def.figures || []) {
      const g = e.pose?.includes('-') && G[e.pose.slice(e.pose.indexOf('-') + 1)];
      if (e.mouth != null && g) assert.notEqual(e.mouth, g.mouth ?? 2,
        `${id} ${e.id || e.character} (${e.pose}): mouth ${e.mouth} is already the gesture's — leave it out`);
    }
});

test('a panel may name any <base>-<gesture>: composed from its base and gesture', async () => {
  const { composePoses } = await import('../src/compose.js');
  const D = assets.poseParts;
  const r = renderPanel({ figures: [{ character: 'rama', pose: 'stepwide-unicorn' }] }, assets);
  assert.deepEqual(r.issues, []);
  assert.deepEqual(findPose(assets, 'stepwide-unicorn').pose, composePoses(assets.species.male, D.bases, D.gestures, ['stepwide-unicorn'])[0]);
  assert.equal(findPose(assets, 'step-hang').pose, findPose(assets, 'step-hang').pose, 'composed once per asset set');
  // an unknown half is named, and the figure falls back to step-hang
  const bad = renderPanel({ figures: [{ character: 'rama', pose: 'stepwide-wave2' }, { character: 'rama', pose: 'hop-unicorn' }] }, assets);
  assert.match(bad.issues[0], /no gesture "wave2"/);
  assert.match(bad.issues[1], /no base "hop"/);
});

test('"repeat": a prop drawn several times, the entry in the middle, copies of seeded random size and turn behind', () => {
  const w = assets.props.props['rock-circle'].size[0];
  const rock = { prop: 'rock-circle', at: 0.5, depth: 'mid' };
  const svg = (figs) => { const r = renderPanel({ tall: 1, figures: figs }, assets); assert.deepEqual(r.issues, []); return r.svg; };
  // a fixed range leaves nothing to chance: every copy that size and turn, edge to edge
  assert.equal(svg([{ ...rock, repeat: { n: 3, scale: [0.8, 0.8], rotate: [5, 5] } }]), svg([
    { ...rock, id: 'rock-circle-left', scale: 0.8, rotate: 5, nudge: [-(w / 2 + 0.4 * w) / 0.8, 0] },
    { ...rock, id: 'rock-circle-right', scale: 0.8, rotate: 5, nudge: [(w / 2 + 0.4 * w) / 0.8, 0] },
    rock,
  ]));
  // gap (in the middle's head-units); the middle's scale and nudge carried
  const big = { ...rock, scale: 2, nudge: [1, 0.5] };
  assert.equal(svg([{ ...big, repeat: { n: 2, gap: 0.5, scale: [0.5, 0.5], rotate: [10, 10] } }]), svg([
    { ...big, id: 'rock-circle-right', scale: 1, rotate: 10, nudge: [(2 + w + 1 + w / 2) / 1, 1] },
    big,
  ]));
  // the default is random but seeded: the same every time, the same wherever it stands, different per seed
  const five = { ...rock, repeat: 5 };
  assert.equal(svg([five]), svg([five]));
  assert.notEqual(svg([five]), svg([{ ...rock, repeat: { n: 5, seed: 1 } }]));
  assert.notEqual(svg([five]), svg([{ ...rock, repeat: { n: 5, scale: [1, 1], rotate: [0, 0] } }]));
  assert.equal(svg([{ ...rock, repeat: 1 }]), svg([rock]));
  // the copies are named, so an entry can stand on one
  assert.deepEqual(renderPanel({ figures: [{ ...rock, repeat: 3 }, { character: 'rama', pose: 'step-hang', on: 'rock-circle-left#stand' }] }, assets).issues, []);
  // only props repeat; bad values are issues
  for (const bad of [{ character: 'rama', pose: 'step-hang', repeat: 3 }, { ...rock, repeat: 20 }, { ...rock, repeat: { scale: 0.8 } }])
    assert.equal(renderPanel({ figures: [bad] }, assets).issues.length, 1, JSON.stringify(bad));
});

test('"#chest": a carried prop lands on the front of the chest; with "rotate" it turns about that point', () => {
  const look = characterLook(assets.characters.characters.find((c) => c.id === 'rama'), assets.characters.colors, assets.faces);
  const { joints: j, shapes } = buildShapes(assets.species[look.species], JSON.parse(JSON.stringify(findPose(assets, 'step-hang').pose)), look.outfit, 'side', look.bodyScale, look.who);
  // a third of the way down the spine, out to the torso's front edge
  const P = [j.spine.neck[0] + (j.spine.waist[0] - j.spine.neck[0]) * 0.35, j.spine.neck[1] + (j.spine.waist[1] - j.spine.neck[1]) * 0.35];
  assert.ok(Math.max(...shapes.filter((s) => s.part === 'torso').flatMap((s) => s.pts).map((q) => q[0])) > P[0], 'the torso reaches in front of the spine');
  const arrow = assets.props.props['arrow-stuck'];
  const figs = (extra) => [{ character: 'rama', pose: 'step-hang', at: 0.5 }, { prop: 'arrow-stuck', on: 'rama#chest', ...extra }];
  const r = renderPanel({ figures: figs() }, assets);
  assert.deepEqual(r.issues, []);
  const g = [...r.svg.matchAll(/<g transform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)(?: ([-\d.]+))?\)/g)].map((m) => m.slice(1).map(Number));
  const [fx, fy, fu] = g[0], [ax, ay, au] = g[g.length - 1];
  const feet = [ax + arrow.anchors.feet[0] * au, ay + arrow.anchors.feet[1] * au];
  assert.ok(Math.abs(feet[1] - (fy + P[1] * fu)) < 0.3 * fu, 'at chest height');
  assert.ok(feet[0] > fx + P[0] * fu, 'in front of the spine');
  // turned: drawn the same, inside a rotate about the arrow's feet
  const t = renderPanel({ figures: figs({ rotate: 40 }) }, assets);
  assert.deepEqual(t.issues, []);
  const [, px, py] = t.svg.match(/rotate\(40 ([-\d.]+) ([-\d.]+)\)/).map(Number);
  assert.ok(Math.abs(px - feet[0]) < 0.01 && Math.abs(py - feet[1]) < 0.01, `turns about where it goes in (${px}, ${py}) vs (${feet})`);
  // front view: the middle of the chest
  assert.deepEqual(renderPanel({ figures: [{ character: 'rama', pose: 'step-hang', view: 'front' }, { prop: 'arrow-stuck', on: 'rama#chest' }] }, assets).issues, []);
});

test('a prop "on" an "inside" anchor is centred on it and fitted to its circle', () => {
  const r = renderPanel({ figures: [{ prop: 'bubble-thought', at: 0.5, depth: 0.3 }, { prop: 'heart', on: 'bubble-thought#inside' }] }, assets);
  assert.deepEqual(r.issues, []);
  const bubble = assets.props.props['bubble-thought'], heart = assets.props.props.heart;
  const ins = bubble.anchors.inside;
  // the heart's scale: the circle's diameter over the heart's longer side, at the bubble's unit
  // the two props' placements, in order: <g transform="translate(x y) scale(unit unit)">
  const [[bx, by, bs], hs] = [...r.svg.matchAll(/<g transform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+) [-\d.]+\)"/g)].map((m) => m.slice(1).map(Number));
  assert.ok(Math.abs(hs[2] - ins[2] * bs / Math.max(...heart.size)) < 1e-6);
  // its box centred on the anchor
  assert.ok(Math.abs(hs[0] + heart.size[0] * hs[2] / 2 - (bx + ins[0] * bs)) < 0.01);
  assert.ok(Math.abs(hs[1] + heart.size[1] * hs[2] / 2 - (by + ins[1] * bs)) < 0.01);
  assert.match(renderPanel({ figures: [{ prop: 'bubble-thought' }, { character: 'sita', on: 'bubble-thought#inside' }] }, assets).issues.join(), /takes a prop/);
});

test('show: head-alone is the head-alone prop with the figure on its face (rotate turns the head); without-head drops the head', () => {
  const one = { tall: 1, figures: [{ character: 'ravana', show: 'head-alone', facing: 'right', at: 0.4, scale: 1.5, rotate: 30, nudge: [0, 1], mouth: 3 }] };
  const two = { tall: 1, figures: [
    { prop: 'head-alone', id: 'h', at: 0.4, scale: 1.5, nudge: [0, 1] },
    { character: 'ravana', pose: 'stand-hang', on: 'h#face', facing: 'right', mouth: 3, rotate: 30 }] };
  const a = renderPanel(one, assets), b = renderPanel(two, assets);
  assert.deepEqual(a.issues, []);
  assert.equal(a.svg, b.svg);
  const whole = renderPanel({ tall: 1, figures: [{ character: 'rama', pose: 'step-hang', at: 0.5 }] }, assets).svg;
  const headless = renderPanel({ tall: 1, figures: [{ character: 'rama', pose: 'step-hang', at: 0.5, show: 'without-head' }] }, assets);
  assert.deepEqual(headless.issues, []);
  assert.ok(headless.svg.length < whole.length - 500, 'the head and hair are gone');
  assert.equal(renderPanel({ tall: 1, figures: [{ character: 'rama', pose: 'step-hang', show: 'arms' }] }, assets).issues.length, 1);
});

test('cloth: rakshasas always wear a red pattern, monkeys never a pattern (artist, 2026-11-21)', () => {
  const RAX = new Set(['ravana', 'indrajit', 'vibhishana', 'surpanakha', 'raxas_m1', 'raxas_m2', 'raxas_m3', 'raxas_m4', 'raxas_f1', 'raxas_f2', 'raxas_f3']);
  const MON = new Set(['hanuman', 'sugriva', 'monkey1', 'monkey2', 'monkey3']);
  const OK = new Set(['red-check', 'red-stripe', 'red-diamond']);
  const chars = assets.characters.characters;
  for (const c of chars) {
    const cloth = c.cloth ?? c.outfit?.cloth;
    if (RAX.has(c.id)) assert.ok(OK.has(cloth), `${c.id}: default cloth ${cloth}`);
    if (MON.has(c.id)) assert.ok(!/-(check|stripe|diamond)$/.test(cloth), `${c.id}: default cloth ${cloth}`);
  }
  const bad = [];
  for (const sec of loadSections()) for (const { id, def } of sec.panels) for (const e of def.figures || []) {
    const c = e.character ?? e.who;
    if (e.cloth == null) continue;
    if (RAX.has(c) && !OK.has(e.cloth)) bad.push(`${id} ${c}: ${e.cloth}`);
    if (MON.has(c) && /-(check|stripe|diamond)$/.test(e.cloth)) bad.push(`${id} ${c}: ${e.cloth}`);
  }
  assert.deepEqual(bad, []);
});
