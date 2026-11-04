import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, serialize, label, withoutDisplay, parseTransform, apply, flatten } from '../tools/svg.mjs';

const near = (a, b, eps = 1e-9) => a.length === b.length && a.every((p, i) => Math.abs(p[0] - b[i][0]) < eps && Math.abs(p[1] - b[i][1]) < eps);

test('parse/serialize keeps the drawing and drops ids and editor markup', () => {
  const t = parse(`<?xml version="1.0"?><!-- c --><svg><sodipodi:namedview/>
    <g id="layer1" inkscape:label="Head" transform="translate(1 2)"><path id="p1" d="M0 0L1 1" fill="#a0b"/></g></svg>`);
  const svg = t.children.find((c) => c.tag === 'svg');
  const g = svg.children.find((c) => c.tag === 'g');
  assert.equal(label(g), 'head');
  assert.equal(serialize(g), '<g transform="translate(1 2)"><path d="M0 0L1 1" fill="#a0b"/></g>');
  assert.equal(serialize(svg.children[0]), '');            // sodipodi:namedview
});

test('serialize escapes stray ampersands and quotes only', () => {
  const [n] = parse(`<text a='say "hi" &amp; R&D'/>`).children;
  assert.equal(serialize(n), '<text a="say &quot;hi&quot; &amp; R&amp;D"/>');
});

test('withoutDisplay drops only the display declaration', () => {
  assert.equal(withoutDisplay('display:none;opacity:0.5'), 'opacity:0.5');
  assert.equal(withoutDisplay(), '');
});

test('transforms compose left to right, like SVG', () => {
  const m = parseTransform('translate(10 0) scale(2)');
  assert.deepEqual(apply(m, [1, 1]), [12, 2]);
  const r = parseTransform('rotate(90 1 1)');
  assert.ok(near([apply(r, [2, 1])], [[1, 2]]));
  assert.deepEqual(apply(parseTransform('matrix(1 0 0 1 3 4)'), [0, 0]), [3, 4]);
  assert.deepEqual(apply(parseTransform(undefined), [5, 6]), [5, 6]);
});

test('flatten: lines, relative commands, H/V, implicit repeats', () => {
  assert.ok(near(flatten('M0 0 L1 0 1 1 H0 V0 Z'), [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]));
  assert.ok(near(flatten('m1 1 l1 0 h1 v1'), [[1, 1], [2, 1], [3, 1], [3, 2]]));
  assert.ok(near(flatten('M0,0 2,0'), [[0, 0], [2, 0]]));       // implicit lineto after M
  assert.ok(near(flatten('M-.5-1e-1 L.5 .25'), [[-0.5, -0.1], [0.5, 0.25]]));
});

test('flatten: curves end on their end point', () => {
  const c = flatten('M0 0 C0 1 1 1 1 0 S2 -1 2 0', 4);
  assert.equal(c.length, 1 + 4 + 4);
  assert.ok(near([c[4], c[8]], [[1, 0], [2, 0]]));
  assert.ok(near([c[6]], [[1.5, -0.75]]));                    // S mirrors the last control point
  const q = flatten('M0 0 Q1 2 2 0 T4 0', 2);
  assert.ok(near([q[1], q[2], q[4]], [[1, 1], [2, 0], [4, 0]]));
});
