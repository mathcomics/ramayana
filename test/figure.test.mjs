import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePose, solve, frontOf, buildShapes, renderFigure, parseCloth, characterLook, anatomy } from '../src/figure.js';
import { SPECIES, POSES, CAST, FACES, allFinite, stableIds } from './helpers.mjs';

const stand = POSES.find((p) => p.name === 'stand');

test('normalizePose fills defaults and rejects bad values', () => {
  const p = normalizePose({ mouth: 7, view: 'top', near: { arm: { hand: 'claw', shoulder: 'x' } } });
  assert.equal(p.name, 'untitled');
  assert.equal(p.view, 'side');
  assert.equal(p.headView, 'side');
  assert.equal(p.mouth, 2);
  assert.equal(p.near.arm.hand, 'fist');
  assert.equal(p.near.arm.shoulder, 0);
  assert.deepEqual(p.spine, { lean: 0, chest: 0, neck: 0, head: 0 });
  assert.equal(normalizePose({ view: 'front' }).headView, 'front');
  assert.equal(normalizePose({ near: { arm: { hand: 'point' } } }).near.arm.hand, 'point');
});

test('every species × pose × view builds finite shapes, feet on y = 0, centred', () => {
  for (const [sp, S] of Object.entries(SPECIES)) for (const p of POSES) for (const view of ['side', 'front']) {
    const { shapes, bbox } = buildShapes(S, p, undefined, view);
    const at = `${sp} ${p.name} ${view}`;
    assert.ok(allFinite(shapes), `${at}: non-finite point`);
    assert.ok(Math.abs(bbox.y1) < 1e-9, `${at}: lowest point not on the ground`);
    assert.ok(Math.abs(bbox.x0 + bbox.x1) < 1e-9, `${at}: not centred`);
  }
});

test('rendering is deterministic', () => {
  const r = () => stableIds(renderFigure(SPECIES.monkey, POSES[3], { scale: 20 }).svg);
  assert.equal(r(), r());
});

test('facing left mirrors facing right', () => {
  const R = renderFigure(SPECIES.male, stand, { facing: 1, scale: 10 });
  const L = renderFigure(SPECIES.male, stand, { facing: -1, scale: 10 });
  assert.match(L.svg, /scale\(-10 10\)/);
  assert.equal(stableIds(R.svg).replace('scale(10 10)', ''), stableIds(L.svg).replace('scale(-10 10)', ''));
});

test('front view: upright torso, front head, shortened spine (never below 35 %)', () => {
  const S = SPECIES.male;
  for (const p of POSES) {
    const f = frontOf(S, p);
    assert.equal(f.pose.view, 'front');
    assert.equal(f.pose.headView, 'front');
    assert.deepEqual(f.pose.spine, { lean: 0, chest: 0, neck: 0, head: 0 });
    const k = f.species.spine.upper / S.spine.upper;
    assert.ok(k >= 0.35 - 1e-9 && k <= 1 + 1e-9, `${p.name}: torso factor ${k}`);
  }
  const flat = { spine: { lean: 90 } };                         // torso horizontal
  assert.ok(Math.abs(frontOf(S, flat).species.spine.upper / S.spine.upper - 0.35) < 1e-9, 'lying torso clamps to 35 %');
  // a pose that is already front stays as it is
  const already = frontOf(S, { view: 'front' });
  assert.equal(already.species, S);
});

test('front view: limbs point to their own side (near = picture-right)', () => {
  const sk = solve(...Object.values(frontOf(SPECIES.male, stand)));
  assert.ok(sk.limbs.near.hp[0] > sk.limbs.far.hp[0]);
  assert.ok(sk.limbs.near.A[0] >= sk.limbs.far.A[0]);
});

test('ankle sets the foot from the ground: a flat foot stays flat however the knee bends', () => {
  for (const knee of [0, 40, 90]) {
    const sk = solve(SPECIES.male, { near: { leg: { hip: 30, knee, ankle: 0 } } });
    assert.equal(sk.limbs.near.tf, 90);
  }
});

test('point hand: a longer single finger and shorter grouped fingers than out', () => {
  const hand = (h) => anatomy(SPECIES.male, { near: { arm: { shoulder: 90, elbow: 0, hand: h } } }).hand.map((s) => s.pts);
  const reach = (pts) => Math.max(...pts.map((p) => p[0]));   // arm points forward (+x)
  const len = (pts) => Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
  const [outPalm, outThumb] = hand('out'), [ptPalm, ptFinger] = hand('point');
  assert.ok(reach(ptPalm) < reach(outPalm));
  assert.ok(len(ptFinger) > len(outThumb) * 1.5);
});

test('monkeys have a tail, men and women do not', () => {
  assert.ok(anatomy(SPECIES.monkey, stand).tail);
  assert.equal(anatomy(SPECIES.male, stand).tail, undefined);
  assert.equal(anatomy(SPECIES.female, stand).tail, undefined);
});

test('outfit: dhoti and full top use the cloth colour', () => {
  const role = (outfit) => buildShapes(SPECIES.male, stand, outfit).shapes.filter((s) => s.role === 'cloth').length;
  const briefs = role({ bottom: 'briefs', top: 'bare' });
  assert.equal(briefs, 1);                                    // the loincloth only
  assert.ok(role({ bottom: 'dhoti', top: 'bare' }) > briefs);
  assert.ok(role({ bottom: 'briefs', top: 'full' }) > briefs);
});

test('the guide head is a plain rectangle, size × (size · width)', () => {
  for (const S of Object.values(SPECIES)) {
    const [h] = anatomy(S, { view: 'front', headView: 'front' }).head;
    const xs = h.pts.map((p) => p[0]), ys = h.pts.map((p) => p[1]);
    assert.equal(h.pts.length, 4);
    assert.ok(Math.abs(Math.max(...ys) - Math.min(...ys) - S.head.size) < 1e-9);
    assert.ok(Math.abs(Math.max(...xs) - Math.min(...xs) - S.head.size * S.head.width) < 1e-9);
  }
});

test('cloth names: colour plus optional pattern', () => {
  const pal = CAST.palette.cloth;
  assert.deepEqual(parseCloth('red', pal), { color: pal.red, pattern: null });
  assert.deepEqual(parseCloth('red-check', pal), { color: pal.red, pattern: 'check' });
  assert.deepEqual(parseCloth('yellow-stripe', pal), { color: pal.yellow, pattern: 'stripe' });
  assert.equal(parseCloth('red-tartan', pal).pattern, null);
  assert.equal(parseCloth('mauve', pal).color, undefined);
});

test('a patterned top draws its pattern; a bare top does not', () => {
  const ravana = CAST.characters.find((c) => c.id === 'ravana');
  const L = characterLook(ravana, CAST.palette, FACES);
  const svg = renderFigure(SPECIES.male, stand, { ...L, scale: 20 }).svg;
  assert.match(svg, /<pattern /);
  const rama = characterLook(CAST.characters.find((c) => c.id === 'rama'), CAST.palette, FACES);
  assert.doesNotMatch(renderFigure(SPECIES.male, stand, { ...rama }).svg, /<pattern /);
});

test('a drawn face replaces the generated head', () => {
  const rama = characterLook(CAST.characters.find((c) => c.id === 'rama'), CAST.palette, FACES);
  const withFace = renderFigure(SPECIES.male, stand, { ...rama }).svg;
  const without = renderFigure(SPECIES.male, stand, { ...rama, face: null }).svg;
  assert.ok(withFace.includes(FACES.faces.rama.side.head));
  assert.ok(!without.includes(FACES.faces.rama.side.head));
});
