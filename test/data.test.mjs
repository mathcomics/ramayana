// Integrity of the data files: everything a name refers to exists.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseColor } from '../src/figure.js';
import { HEAD_VIEWS } from '../src/headturn.js';
import { splitPoseName } from '../src/compose.js';
import { root, SPECIES, POSES, CAST, FACES } from './helpers.mjs';

// A pose name starts with a style bible §7 base word, or — for a pose
// composed in the lab (named <base>-<gesture>) — with its base's name.
const D = { ...JSON.parse(readFileSync(join(root, 'data/poses.json'), 'utf8')),
  bases: JSON.parse(readFileSync(join(root, 'data/bases.json'), 'utf8')).bases,
  gestures: JSON.parse(readFileSync(join(root, 'data/gestures.json'), 'utf8')).gestures };
const BASES = ['stand', 'walk', 'run', 'leap', 'crouch', 'bend', 'crawl', 'kneel', 'lunge', 'sit', 'lie', 'fall', ...Object.keys(D.bases)];

test('only three species', () => {
  assert.deepEqual(Object.keys(SPECIES).sort(), ['female', 'male', 'monkey']);
});

test('species heads are only a size guide (faces are drawn)', () => {
  for (const [id, S] of Object.entries(SPECIES)) {
    assert.deepEqual(Object.keys(S.head).sort(), ['size', 'width'], `${id}: head keeps only size and width`);
    assert.equal(S.mouth, undefined, `${id}: mouths are drawn in the face files`);
  }
});

test('poses: unique, alphabetical, named <base>-<gesture> of a known base and gesture', () => {
  const names = Object.keys(D.poses);
  assert.deepEqual(names, [...names].sort(), 'poses.json is not alphabetical');
  for (const n of names) {
    const i = n.indexOf('-');
    assert.ok(i > 0, `${n}: a pose is named <base>-<gesture>`);
    assert.ok(D.bases[n.slice(0, i)], `${n}: no base ${n.slice(0, i)}`);
    assert.ok(D.gestures[n.slice(i + 1)], `${n}: no gesture ${n.slice(i + 1)}`);
  }
  assert.deepEqual(POSES.map((p) => p.name), names, 'composed poses follow poses.json');
  for (const p of POSES) assert.notEqual(p.view, 'front', `${p.name}: poses are side view only`);
  assert.ok(names.includes('step-hang'), 'the fallback pose "step-hang" is missing');
});

test('poses: finding fields, known tags and neighbours; wanted', () => {
  const names = Object.keys(D.poses);
  const GROUND = ['feet', 'one-knee', 'seat', 'front', 'back', 'air', 'feet-hands'];
  for (const [name, e] of Object.entries(D.poses)) {
    assert.deepEqual(Object.keys(e).filter((k) => !['desc', 'ground', 'hold', 'use', 'like'].includes(k)), [],
      `${name}: a pose holds only finding fields (its angles come from its base and gesture)`);
    assert.ok(e.desc, `${name}: desc`);
    assert.ok(GROUND.includes(e.ground), `${name}: ground ${e.ground}`);
    for (const h of e.hold) assert.ok(['right', 'left'].includes(h), `${name}: hold ${h}`);
    assert.ok(e.use.length, `${name}: no use tags`);
    for (const t of e.use) assert.ok(D.tags[t], `${name}: unknown tag ${t}`);
    for (const l of e.like) assert.ok(names.includes(l) && l !== name, `${name}: like ${l}`);
  }
  for (const [name, w] of Object.entries(D.wanted)) {
    assert.ok(!names.includes(name), `wanted ${name} already exists: move it to poses`);
    assert.ok(BASES.includes(splitPoseName(name)[0]), `wanted ${name}: base`);
    for (const t of w.use) assert.ok(D.tags[t], `wanted ${name}: unknown tag ${t}`);
  }
});

test('bases and gestures: one-word names, a desc, the half they own, each used', () => {
  const used = (k, i) => Object.keys(D.poses).some((n) => splitPoseName(n)[i] === k);
  for (const [b, e] of Object.entries(D.bases)) {
    assert.match(b, /^[a-z]+$/, `base ${b}: one word`);
    assert.ok(e.desc, `base ${b}: desc`);
    assert.deepEqual(Object.keys(e).sort(), ['desc', 'lean', 'left', 'right', 'tail'], `base ${b}: desc, lean, right, left, tail`);
    assert.ok(used(b, 0), `base ${b}: no pose uses it`);
  }
  for (const [g, e] of Object.entries(D.gestures)) {
    assert.match(g, /^[a-z]+$/, `gesture ${g}: one word`);
    assert.ok(e.desc, `gesture ${g}: desc`);
    for (const k of Object.keys(e)) assert.ok(['desc', 'lean', 'join', 'chest', 'neck', 'head', 'mouth', 'right', 'left'].includes(k), `gesture ${g}: unknown field ${k}`);
    assert.ok(used(g, 1), `gesture ${g}: no pose uses it`);
  }
});

test('colors: hex values; names that are not hex and do not end in a pattern', () => {
  for (const [n, v] of Object.entries(CAST.colors)) {
    assert.match(v, /^#[0-9a-f]{6}$/i, `colors.${n}`);
    assert.match(n, /^[a-z]+(-[a-z]+)*$/, `colors.${n}: lowercase words joined by -`);
    assert.ok(!/-(check|diamond|stripe)$/.test(n), `colors.${n}: ends in a pattern name`);
  }
});

test('characters: known species, a named body colour, known outfit and cloth', () => {
  const ids = CAST.characters.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate character id');
  for (const c of CAST.characters) {
    assert.ok(SPECIES[c.species], `${c.id}: species ${c.species}`);
    assert.ok(CAST.colors[c.body], `${c.id}: body "${c.body}" is not a name in colors`);
    assert.ok(['briefs', 'dhoti'].includes(c.bottom), `${c.id}: bottom ${c.bottom}`);
    assert.ok(['bare', 'full'].includes(c.top), `${c.id}: top ${c.top}`);
    const cl = parseColor(c.cloth, CAST.colors);
    assert.ok(cl.color, `${c.id}: cloth ${c.cloth}`);
    if (cl.pattern) assert.equal(c.top, 'full', `${c.id}: a pattern needs a full top`);
  }
  assert.ok(!CAST.characters.some((c) => c.species === 'monkey' && /female/.test(c.id)), 'no female monkeys');
});

test('faces: every face belongs to a character; front and side drawn (sideOnly: the side only); only known views', () => {
  const ids = new Set(CAST.characters.map((c) => c.id));
  const known = HEAD_VIEWS.map(([v]) => v);
  for (const id of Object.keys(FACES.faces)) assert.ok(ids.has(id), `face for unknown character ${id}`);
  for (const [id, F] of Object.entries(FACES.faces)) for (const v of Object.keys(F)) assert.ok(known.includes(v), `${id}: unknown view ${v}`);
  for (const c of CAST.characters.filter((c) => c.sideOnly))
    assert.deepEqual(Object.keys(FACES.faces[c.id] || {}), ['side'], `${c.id}: sideOnly, but has other views`);
  for (const { id, sideOnly } of CAST.characters) for (const view of sideOnly ? ['side'] : ['front', 'side']) {
    assert.ok(FACES.faces[id]?.[view]?.head, `${id}: no ${view} face`);
    assert.ok(existsSync(join(root, `data/faces/${id}.svg`)), `${id}.svg missing`);
  }
});

test('props: recolouring roles on a drawing name colours it uses', async () => {
  const { loadProps } = await import('../tools/lib.mjs');
  const { props } = loadProps();
  assert.ok(Object.values(props).filter((d) => d.recolor).length >= 8, 'the top-view figures and giant parts recolour');
  for (const [id, def] of Object.entries(props)) for (const [role, c] of Object.entries(def.recolor ?? {})) {
    assert.match(c, /^#[0-9a-f]{6}$/i, `${id}: data-recolor-${role}`);
    assert.ok(def.svg.toLowerCase().includes(`fill:${c.toLowerCase()}`), `${id}: data-recolor-${role}="${c}" is not a fill in the drawing`);
  }
});

test('props: data-height sets the real height; anchors scale with the drawing', async () => {
  const { loadProps } = await import('../tools/lib.mjs');
  const { props } = loadProps();
  let n = 0;
  for (const id of Object.keys(props)) {
    const text = readFileSync(join(root, `data/props/${id}.svg`), 'utf8');
    const h = text.match(/<svg\b[^>]*\bdata-height="([^"]+)"/)?.[1];
    if (h == null) continue;
    n++;
    const def = props[id];
    assert.ok(Math.abs(def.size[1] - Number(h)) < 1e-9, `${id}: height ${def.size[1]} != data-height ${h}`);
    for (const [a, [x, y]] of Object.entries(def.anchors ?? {}))
      assert.ok(x >= -0.5 && x <= def.size[0] + 0.5 && y >= -0.5 && y <= def.size[1] + 0.5, `${id}#${a}: outside the scaled drawing`);
  }
  assert.ok(n >= 4, 'ladder, trees-side, hut-side, deer-stand carry data-height');
});

// The renderer reads data/faces.json, not the drawings: a face drawing
// committed without re-running the import never reaches the site.
test('data/faces.json is up to date with data/faces/*.svg', () => {
  const r = spawnSync(process.execPath, [join(root, 'tools/import-faces.mjs'), '--check'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr.split('\n').filter((l) => /out of date/.test(l)).join('\n') || r.stderr);
});
