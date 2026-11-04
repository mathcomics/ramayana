import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dir, add, sub, mul, lerp, rot, quad, circlePts, pathD, bbox } from '../src/geom.js';

const near = (a, b, eps = 1e-9) => a.every((v, i) => Math.abs(v - b[i]) < eps);

test('angle convention: 0 = down, 90 = forward, 180 = up, -90 = back', () => {
  assert.ok(near(dir(0), [0, 1]));
  assert.ok(near(dir(90), [1, 0]));
  assert.ok(near(dir(180), [0, -1]));
  assert.ok(near(dir(-90), [-1, 0]));
});

test('vector helpers', () => {
  assert.deepEqual(add([1, 2], [3, 4]), [4, 6]);
  assert.deepEqual(sub([1, 2], [3, 4]), [-2, -2]);
  assert.deepEqual(mul([1, -2], 3), [3, -6]);
  assert.deepEqual(lerp([0, 0], [10, 20], 0.25), [2.5, 5]);
  assert.ok(near(rot([1, 0], 90), [0, 1]));        // clockwise in a y-down frame
});

test('quad excludes its start and ends on its end point', () => {
  const q = quad([0, 0], [5, 10], [10, 0], 4);
  assert.equal(q.length, 4);
  assert.deepEqual(q.at(-1), [10, 0]);
  assert.ok(near(quad([0, 0], [5, 10], [10, 0], 2)[0], [5, 5]));   // midpoint of the bezier
});

test('circle stays inside its bounds', () => {
  const c = bbox([circlePts([1, 1], 2, 40)]);
  assert.ok(c.x0 >= -1 - 1e-9 && c.x1 <= 3 + 1e-9);
});

test('pathD rounds to 3 decimals and closes by default', () => {
  assert.equal(pathD([[0, 0], [1.23456, 2]]), 'M0 0L1.235 2Z');
  assert.equal(pathD([[0, 0], [1, 1]], false), 'M0 0L1 1');
  assert.equal(pathD([]), '');
});

test('bbox spans every list', () => {
  assert.deepEqual(bbox([[[0, 1]], [[-2, 5], [3, -1]]]), { x0: -2, y0: -1, x1: 3, y1: 5 });
});
