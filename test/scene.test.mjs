import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPanel, panelHeight, backgroundInner, PANEL_W, MAN } from '../src/scene.js';
import { loadAssets, loadSections } from '../tools/lib.mjs';
import { buildShapes, characterLook } from '../src/figure.js';

const assets = loadAssets();
const xOf = (svg, n) => [...svg.matchAll(/<g transform="translate\(([-\d.e]+) ([-\d.e]+)\) scale\(/g)].map((m) => +m[1])[n];

test('panel height is tall × width (1.5, 1, 0.6, 0.4), with a fallback', () => {
  assert.equal(panelHeight({}), 540);
  assert.equal(panelHeight({ tall: 1 }), 360);
  assert.equal(panelHeight({ tall: 0.6 }), Math.round(0.6 * PANEL_W));
  assert.equal(panelHeight({ tall: 0.4 }), Math.round(0.4 * PANEL_W));
  assert.equal(renderPanel({ tall: 0.5 }, assets).issues.length, 1);  // only the listed heights
  assert.equal(panelHeight({ tall: 2 }), 540);            // nothing taller than 1.5
  assert.equal(panelHeight({ tall: -1 }), 540);
  assert.equal(renderPanel({ tall: 'big' }, assets).issues.length, 1);
  assert.equal(renderPanel({ tall: 2 }, assets).issues.length, 1);
  assert.equal(renderPanel({ size: 0.5 }, assets).issues.length, 1);  // the old field
});

test('every committed panel renders without issues (placeholders aside)', () => {
  for (const sec of loadSections()) for (const { id, def } of sec.panels) {
    const r = renderPanel(def, assets, { id, background: sec.backgrounds[id] });
    assert.deepEqual(r.issues.filter((m) => !/placeholder/.test(m)), [], id);
    assert.match(r.svg, /^<svg [^>]*viewBox="0 0 360 \d+"/);
  }
});

test('unknown names become issues, not crashes', () => {
  const r = renderPanel({ ground: 'mauve', figures: [
    { prop: 'spaceship' },
    { character: 'nobody' }, { character: 'rama', pose: 'moonwalk', row: 'sky', at: 'far-left' },
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

test('rows: back figures stand higher and smaller', () => {
  const svg = renderPanel({ figures: [{ character: 'rama', row: 'front' }, { character: 'rama', row: 'back' }] }, assets).svg;
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

test('sky: a colour above the horizon; row "horizon" stands things on it', () => {
  const r = renderPanel({ tall: 1, sky: 'sky', horizon: 0.25, figures: [{ prop: 'golden-deer-run', row: 'horizon' }] }, assets);
  assert.match(r.svg, /<rect width="360" height="270" fill="url\(#panel-sky\)"\/>/);
  assert.ok(r.svg.includes(`<stop offset="0" stop-color="${assets.grounds.grounds.sky[0]}"/>`), 'sky gradient from grounds.json');
  // a hex sky (or ground) is a flat fill; a hex ground draws no gradient
  const flat = renderPanel({ ground: '#123456', sky: '#abcdef' }, assets).svg;
  assert.match(flat, /<rect width="360" height="\d+(\.\d+)?" fill="#123456"\/><rect width="360" height="[\d.]+" fill="#abcdef"\/>/);
  assert.doesNotMatch(flat, /linearGradient/);
  const y = +r.svg.match(/<g transform="translate\([-\d.]+ ([-\d.]+)\) scale\(/)?.[1];
  assert.ok(Math.abs(y + 5.557 * 16 * 360 / 540 - 270) < 0.01, `deer bottom on the horizon (${y})`);
  assert.equal(renderPanel({ sky: 'nope' }, assets).issues.length, 1);
});

test('rows: perspective depths, closeup, top, numbers; shot and zoom retired', () => {
  const propY = (row, extra = {}) => {
    const r = renderPanel({ figures: [{ prop: 'golden-deer-run', row, ...extra }] }, assets);
    const [, y, sc] = r.svg.match(/<g transform="translate\([-\d.]+ ([-\d.]+)\) scale\(([-\d.]+)/);
    return { top: +y, unit: +sc, bottom: +y + assets.props.props['golden-deer-run'].size[1] * +sc, issues: r.issues };
  };
  const man = (t) => 0.75 * (1 - t) * 540 / MAN;
  const near = (a, b) => Math.abs(a - b) < 0.01;
  for (const [row, t] of [['front', 0.08], ['mid', 0.4], ['back', 0.7]]) {
    const p = propY(row);
    assert.ok(near(p.unit, man(t)) && near(p.bottom, 540 * (1 - t * 0.37)), `${row} row`);
  }
  // the horizon moves a row's ground line, not its size
  const low = renderPanel({ horizon: 0.2, figures: [{ prop: 'golden-deer-run', row: 'back' }] }, assets).svg;
  assert.ok(near(+low.match(/scale\(([-\d.]+)/)[1], man(0.7)), 'the horizon leaves sizes alone');
  const c = propY('closeup');
  assert.ok(near(c.unit, 1.75 * 540 / MAN) && near(c.bottom, 1080), 'closeup: ground a panel below, head at 75 %');
  const t = propY('top');
  assert.ok(near(t.top, 0) && near(t.unit, man(0.08)), 'top: top edge on the panel top, front size');
  const n = propY(0.5);
  assert.ok(near(n.bottom, 270) && near(n.unit, man(0.08)), 'a number: the bottom edge at that share');
  assert.ok(near(propY(0.5, { nudge: [0, 1] }).bottom, 270 - man(0.08)), 'nudge [dx, dy]: own head-units, + up');
  assert.match(propY(0.5, { lift: 1 }).issues.join(' '), /"lift" is retired/);
  assert.equal(propY('nope').issues.filter((i) => /row "nope"/.test(i)).length, 1);
  for (const k of ['shot', 'zoom']) assert.match(renderPanel({ [k]: 'wide' }, assets).issues.join(' '), new RegExp(`"${k}" is retired`));
});

test('"on": a figure sits on the prop\'s seat, at its scale; mirrored props mirror the seat', () => {
  const seat = assets.props.props['throne-ayodhya'].anchors.seat;
  // the hips: the underside of the thighs at the pelvis, in the figure's frame
  const kingPose = JSON.parse(JSON.stringify(assets.poses.find((p) => p.name === 'sit-armknee')));
  const kingLook = characterLook(assets.characters.characters.find((c) => c.id === 'dasharatha'), assets.characters.palette, assets.faces);
  const { joints: kj, shapes: ks } = buildShapes(assets.species[kingLook.species], kingPose, kingLook.outfit, 'side', kingLook.bodyScale, kingLook.who);
  const hipsY = Math.max(...ks.filter((s) => /-thigh$/.test(s.part || '')).flatMap((s) => s.pts).filter((q) => Math.abs(q[0] - kj.spine.pelvis[0]) <= 0.25).map((q) => q[1]));
  for (const facing of ['right', 'left']) {
    const r = renderPanel({ figures: [{ prop: 'throne-ayodhya', at: 0.5, row: 'mid', facing }, { character: 'dasharatha', pose: 'sit-armknee', on: 'throne-ayodhya' }] }, assets);
    assert.deepEqual(r.issues.filter((i) => !/placeholder/.test(i)), []);
    const [, fy, fs] = r.svg.match(/data-panel[\s\S]*?<\/g><g transform="translate\([-\d.]+ ([-\d.]+)\) scale\(([-\d.]+)/) || [];
    const unit = 0.75 * (1 - 0.4) * 540 / MAN, top = 540 * (1 - 0.4 * 0.37) - assets.props.props['throne-ayodhya'].size[1] * unit;
    assert.ok(Math.abs(+fy + hipsY * unit - (top + seat[1] * unit)) < 0.01, `${facing}: the hips on the seat`);
    assert.equal(Math.abs(+fs), unit);
  }
  assert.equal(renderPanel({ figures: [{ character: 'rama', pose: 'sit-armknee', on: 'throne-ayodhya' }] }, assets).issues.length, 1);
  // nudge moves a seated figure off the seat, and a nudged prop carries its sitter
  const at = (figs) => renderPanel({ figures: figs }, assets).svg.match(/data-panel[\s\S]*?<\/g><g transform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)/).slice(1).map(Number);
  const throne = { prop: 'throne-ayodhya', at: 0.5, row: 'mid' }, king = { character: 'dasharatha', pose: 'sit-armknee', on: 'throne-ayodhya' };
  const [x0, y0, u] = at([throne, king]);
  const [x1, y1] = at([throne, { ...king, nudge: [0.5, 1] }]);
  assert.ok(Math.abs(x1 - x0 - 0.5 * u) < 0.01 && Math.abs(y0 - y1 - u) < 0.01, 'nudge on a seated figure');
  const [x2, y2] = at([{ ...throne, nudge: [1, 1] }, king]);
  assert.ok(Math.abs(x2 - x0 - u) < 0.01 && Math.abs(y0 - y2 - u) < 0.01, 'the sitter follows a nudged prop');
  assert.match(renderPanel({ figures: [throne, { ...king, at: 0.2, row: 'back' }] }, assets).issues.join(' '), /"at" does nothing with "on"[\s\S]*"row" does nothing with "on"/);
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
  // row on a foreground is flagged; a band takes its own "id"
  assert.match(place([fg, { character: 'rama', pose: 'step-hang', on: 'foreground', row: 'mid' }]).issues.join(' '), /"row" does nothing on a foreground/);
  assert.deepEqual(place([{ ...fg, id: 'hill' }, { character: 'rama', pose: 'step-hang', on: 'hill' }]).issues, []);
  assert.match(place([{ foreground: 'x', color: 'forest' }]).issues.join(' '), /takes \[left, right\]/);
});

test('a "hand" anchor: the figure hangs by its higher hand, or the one "hand" names', () => {
  const wall = { prop: 'palace-side', at: 0.5, row: 'front' }, def = assets.props.props['palace-side'];
  const fig = (extra) => ({ character: 'hanuman', pose: 'leap-reach', on: 'palace-side#hand', ...extra });
  const r = renderPanel({ tall: 1, figures: [wall, fig({})] }, assets);
  assert.deepEqual(r.issues, []);
  const [, fx, fy, fs] = r.svg.match(/<\/g><g transform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)/).map(Number);
  // where the anchor is in the panel
  const unit = fs, H = 360, ground = H * (1 - 0.08 * 0.37), top = ground - def.size[1] * unit;
  const ax = 180 + (def.anchors.hand[0] - def.size[0] / 2) * unit, ay = top + def.anchors.hand[1] * unit;
  const pose = JSON.parse(JSON.stringify(assets.poses.find((p) => p.name === 'leap-reach')));
  const look = characterLook(assets.characters.characters.find((c) => c.id === 'hanuman'), assets.characters.palette, assets.faces);
  const { joints } = buildShapes(assets.species[look.species], pose, look.outfit, 'side', look.bodyScale, look.who);
  const g = [joints.near.grip, joints.far.grip].sort((a, b) => a[1] - b[1])[0];
  assert.ok(Math.abs(fx + g[0] * unit - ax) < 1e-6 && Math.abs(fy + g[1] * unit - ay) < 1e-6, 'the higher grip on the anchor');
  assert.match(renderPanel({ figures: [fig({ hand: 'left', on: undefined })] }, assets).issues.join(' '), /"hand" picks the hand/);
  assert.match(renderPanel({ figures: [wall, { prop: 'golden-deer', on: 'palace-side#hand' }] }, assets).issues.join(' '), /takes a figure/);
});

test('a seat anchor takes the hips, a stand anchor the feet', () => {
  const rock = { prop: 'rock-square', at: 0.5, scale: 0.5 };
  const y = (on) => +renderPanel({ figures: [rock, { character: 'sita', pose: 'chair-grief', on }] }, assets).svg.match(/<\/g><g transform="translate\([-\d.]+ ([-\d.]+)\) scale\(/)[1];
  const def = assets.props.props['rock-square'];
  assert.equal(def.anchors.seat[1], def.anchors.stand[1]);       // the same point on this rock
  assert.ok(y('rock-square#seat') - y('rock-square#stand') > 0.5 * 0.08 * 540 / MAN, 'seated: the feet hang below the seat');
});

test('rotate on a figure: about its anchor when on a prop; else about its centre, standing on its turned box', () => {
  const wall = { prop: 'palace-side', at: 0.5, scale: 4, row: -0.1 };
  const fig = { character: 'hanuman', pose: 'crawl-onhands', facing: 'left', on: 'palace-side#hand', scale: 0.09 };
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

test('backgroundInner keeps the drawing, drops the guide layer and editor markup', () => {
  const src = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="x">
    <sodipodi:namedview id="nv"/><metadata>m</metadata><!-- note -->
    <g inkscape:label="guide"><rect width="1" height="1"/></g>
    <g inkscape:groupmode="layer" inkscape:label="hills"><path d="M0 0L1 1"/></g></svg>`;
  const out = backgroundInner(src);
  assert.match(out, /<path d="M0 0L1 1"\/>/);
  for (const s of ['namedview', 'metadata', 'note', 'rect', 'inkscape:']) assert.ok(!out.includes(s), s);
  assert.equal(backgroundInner(''), '');
});

test('a character without a drawn face is an issue (no generated fallback)', () => {
  const noFace = { ...assets, faces: { faces: {} } };
  const r = renderPanel({ figures: [{ character: 'rama' }, { character: 'sita', view: 'front' }] }, noFace);
  assert.match(r.issues.join('\n'), /rama\): no drawn side face/);
  assert.match(r.issues.join('\n'), /sita\): no drawn front face/);
});

test('MAN is the drawn male standing straight (feet to head top)', async () => {
  const { renderFigure } = await import('../src/figure.js');
  const p = JSON.parse(JSON.stringify(assets.poses.find((q) => q.name === 'walk-swing')));
  p.spine = { lean: 0, chest: 0, neck: 0, head: 0, turn: 0 };
  for (const s of ['right', 'left']) {
    Object.assign(p[s].leg, { hip: 0, knee: 0, ankle: 0, out: 0, kneeOut: 0, toe: 0 });
    Object.assign(p[s].arm, { shoulder: 0, elbow: 0, wrist: 0, out: 0, elbowOut: 0, twist: 0 });
  }
  const { bbox } = renderFigure(assets.species.male, p, { scale: 1 });
  assert.ok(Math.abs(bbox.y1 - bbox.y0 - MAN) < 0.1, `drawn male is ${(bbox.y1 - bbox.y0).toFixed(2)} head-units, MAN is ${MAN}`);
});
