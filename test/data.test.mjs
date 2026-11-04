// Integrity of the data files: everything a name refers to exists.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseCloth } from '../src/figure.js';
import { root, SPECIES, POSES, CAST, FACES } from './helpers.mjs';

const BASES = ['stand', 'walk', 'run', 'leap', 'crouch', 'bend', 'crawl', 'kneel', 'lunge', 'sit', 'lie', 'fall'];

test('only three species', () => {
  assert.deepEqual(Object.keys(SPECIES).sort(), ['female', 'male', 'monkey']);
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
    assert.ok(existsSync(join(root, `data/faces/${id}-${view}.svg`)), `${id}-${view}.svg missing`);
  }
});
