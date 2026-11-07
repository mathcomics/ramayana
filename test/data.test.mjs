// Integrity of the data files: everything a name refers to exists.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCloth } from '../src/figure.js';
import { root, SPECIES, POSES, CAST, FACES } from './helpers.mjs';

// A pose name starts with a style bible §7 base word, or — for a pose
// composed in the lab (named <base>-<gesture>) — with its base's name
// from the pose index.
const INDEX = JSON.parse(readFileSync(join(root, 'data/pose-index.json'), 'utf8'));
const BASES = ['stand', 'walk', 'run', 'leap', 'crouch', 'bend', 'crawl', 'kneel', 'lunge', 'sit', 'lie', 'fall', ...Object.keys(INDEX.bases)];

test('only three species', () => {
  assert.deepEqual(Object.keys(SPECIES).sort(), ['female', 'male', 'monkey']);
});

test('species heads are only a size guide (faces are drawn)', () => {
  for (const [id, S] of Object.entries(SPECIES)) {
    assert.deepEqual(Object.keys(S.head).sort(), ['size', 'width'], `${id}: head keeps only size and width`);
    assert.equal(S.mouth, undefined, `${id}: mouths are drawn in the face files`);
  }
});

test('poses: unique, alphabetical, <base>-<action> names, side view only', () => {
  const names = POSES.map((p) => p.name);
  assert.equal(new Set(names).size, names.length, 'duplicate pose name');
  assert.deepEqual(names, [...names].sort(), 'poses.json is not alphabetical');
  for (const p of POSES) {
    assert.ok(BASES.includes(p.name.split('-')[0]), `${p.name}: base not in style bible §7`);
    assert.notEqual(p.view, 'front', `${p.name}: poses are side view only`);
  }
  assert.ok(names.includes('stand'), 'the fallback pose "stand" is missing');
});

test('pose index: every pose and only those, known tags and neighbours', () => {
  const index = JSON.parse(readFileSync(join(root, 'data/pose-index.json'), 'utf8'));
  const names = POSES.map((p) => p.name);
  assert.deepEqual(Object.keys(index.poses).sort(), [...names].sort(), 'pose-index.json must list exactly the poses in poses.json');
  const GROUND = ['feet', 'one-knee', 'seat', 'front', 'back', 'air', 'feet-hands'];
  for (const [name, e] of Object.entries(index.poses)) {
    assert.ok(e.desc, `${name}: desc`);
    assert.ok(GROUND.includes(e.ground), `${name}: ground ${e.ground}`);
    for (const h of e.hold) assert.ok(['right', 'left'].includes(h), `${name}: hold ${h}`);
    assert.ok(e.use.length, `${name}: no use tags`);
    for (const t of e.use) assert.ok(index.tags[t], `${name}: unknown tag ${t}`);
    for (const l of e.like) assert.ok(names.includes(l) && l !== name, `${name}: like ${l}`);
  }
  for (const [name, w] of Object.entries(index.wanted)) {
    assert.ok(!names.includes(name), `wanted ${name} already exists: move it to poses`);
    assert.ok(BASES.includes(name.split('-')[0]), `wanted ${name}: base`);
    for (const t of w.use) assert.ok(index.tags[t], `wanted ${name}: unknown tag ${t}`);
  }
  // bases and gestures: single-word names, a desc each, and every pose
  // in exactly one of each
  for (const key of ['bases', 'gestures']) {
    const claimed = Object.entries(index[key]).flatMap(([b, e]) => {
      assert.match(b, /^[a-z]+$/, `${key} ${b}: one word`);
      assert.ok(e.desc, `${key} ${b}: desc`);
      return e.poses;
    });
    assert.deepEqual([...claimed].sort(), [...names].sort(), `every pose must belong to exactly one of ${key}`);
  }
});

test('characters: known species, hex body, known outfit and cloth', () => {
  const ids = CAST.characters.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate character id');
  for (const c of CAST.characters) {
    assert.ok(SPECIES[c.species], `${c.id}: species ${c.species}`);
    assert.match(c.body, /^#[0-9a-f]{3}([0-9a-f]{3})?$/i, `${c.id}: body colour`);
    assert.ok(['briefs', 'dhoti'].includes(c.bottom), `${c.id}: bottom ${c.bottom}`);
    assert.ok(['bare', 'full'].includes(c.top), `${c.id}: top ${c.top}`);
    const cl = parseCloth(c.cloth, CAST.palette.cloth);
    assert.ok(cl.color, `${c.id}: cloth ${c.cloth}`);
    if (cl.pattern) assert.equal(c.top, 'full', `${c.id}: a pattern needs a full top`);
  }
  assert.ok(!CAST.characters.some((c) => c.species === 'monkey' && /female/.test(c.id)), 'no female monkeys');
});

test('faces: every face belongs to a character; every character has both views', () => {
  const ids = new Set(CAST.characters.map((c) => c.id));
  for (const id of Object.keys(FACES.faces)) assert.ok(ids.has(id), `face for unknown character ${id}`);
  for (const id of ids) for (const view of ['front', 'side']) {
    assert.ok(FACES.faces[id]?.[view]?.head, `${id}: no ${view} face`);
    assert.ok(existsSync(join(root, `data/faces/${id}.svg`)), `${id}.svg missing`);
  }
});
