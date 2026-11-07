import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPanel, panelHeight, backgroundInner, SCREEN } from '../src/scene.js';
import { loadAssets, loadSections } from '../tools/lib.mjs';

const assets = loadAssets();
const xOf = (svg, n) => [...svg.matchAll(/<g transform="translate\(([-\d.e]+) ([-\d.e]+)\) scale\(/g)].map((m) => +m[1])[n];

test('panel height is size × screen height (0.75, 0.5, 0.3), with a fallback', () => {
  assert.equal(panelHeight({}), 540);
  assert.equal(panelHeight({ size: 0.5 }), 360);
  assert.equal(panelHeight({ size: 0.3 }), Math.round(0.3 * SCREEN.h));
  assert.equal(panelHeight({ size: 1 }), 540);            // no full-screen panels
  assert.equal(panelHeight({ size: -1 }), 540);
  assert.equal(renderPanel({ size: 'big' }, assets).issues.length, 1);
  assert.equal(renderPanel({ size: 1 }, assets).issues.length, 1);
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
    { who: 'nobody' }, { who: 'rama', pose: 'moonwalk', row: 'sky', at: 'far-left' },
  ], props: [{ prop: 'spaceship' }] }, assets);
  const all = r.issues.join('\n');
  for (const s of ['mauve', 'nobody', 'moonwalk', 'sky', 'far-left', 'spaceship']) assert.match(all, new RegExp(s));
});

test('placement: numbers, slots and relations', () => {
  const fig = (extra) => ({ who: 'rama', pose: 'step-hang', ...extra });
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
  const svg = renderPanel({ figures: [{ who: 'rama', row: 'front' }, { who: 'rama', row: 'back' }] }, assets).svg;
  const g = [...svg.matchAll(/translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)/g)].map((m) => [+m[2], +m[3]]);
  assert.ok(g[1][0] < g[0][0] && g[1][1] < g[0][1]);
});

test('missing props draw a labelled placeholder', () => {
  const r = renderPanel({ props: [{ prop: 'cave' }] }, assets);
  assert.match(r.svg, /class="placeholder"[\s\S]*>cave</);
});

test('sky: a colour above the horizon; row "horizon" stands things on it', () => {
  const r = renderPanel({ size: 0.5, sky: 'sky', horizon: 0.25, props: [{ prop: 'golden-deer-run', row: 'horizon' }] }, assets);
  assert.match(r.svg, /<rect width="360" height="270" fill="#00aad4"\/>/);
  const y = +r.svg.match(/<g transform="translate\([-\d.]+ ([-\d.]+)\) scale\(/)?.[1];
  assert.ok(Math.abs(y + 5.557 * 16 * 360 / 540 - 270) < 0.01, `deer bottom on the horizon (${y})`);
  assert.equal(renderPanel({ sky: 'nope' }, assets).issues.length, 1);
});

test('"on": a figure sits on the prop\'s seat, at its scale; mirrored props mirror the seat', () => {
  const seat = assets.props.props.throne.anchors.seat;
  for (const facing of ['right', 'left']) {
    const r = renderPanel({ props: [{ prop: 'throne', at: 0.5, row: 'mid', facing }], figures: [{ who: 'dasharatha', pose: 'sit-armknee', on: 'throne' }] }, assets);
    assert.deepEqual(r.issues.filter((i) => !/placeholder/.test(i)), []);
    const [, fy, fs] = r.svg.match(/data-panel[\s\S]*?<\/g><g transform="translate\([-\d.]+ ([-\d.]+)\) scale\(([-\d.]+)/) || [];
    const unit = 34, top = 540 * (1 - 0.17) - assets.props.props.throne.size[1] * unit;
    assert.ok(Math.abs(+fy - (top + seat[1] * unit)) < 0.01, `${facing}: seat height`);
    assert.equal(Math.abs(+fs), unit);
  }
  assert.equal(renderPanel({ figures: [{ who: 'rama', pose: 'sit-armknee', on: 'throne' }] }, assets).issues.length, 1);
});

test('two panels on one page never share an id', () => {
  const a = renderPanel({ figures: [{ who: 'rama' }] }, assets, { id: '01.01' }).svg;
  const b = renderPanel({ figures: [{ who: 'rama' }] }, assets, { id: '01.02' }).svg;
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
  const r = renderPanel({ figures: [{ who: 'rama' }, { who: 'sita', view: 'front' }] }, noFace);
  assert.match(r.issues.join('\n'), /rama\): no drawn side face/);
  assert.match(r.issues.join('\n'), /sita\): no drawn front face/);
});
