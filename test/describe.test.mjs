// The panel read-back (tools/describe-lib.mjs): it describes every panel,
// and its checks catch what they are for, on small made-up panels.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadAssets, loadSections } from '../tools/lib.mjs';
import { describePanel } from '../tools/describe-lib.mjs';
import { json } from './helpers.mjs';

const assets = loadAssets();
const data = { bases: json('data/bases.json').bases, gestures: json('data/gestures.json').gestures };
const say = (def) => describePanel('t', { tall: 1, ground: 'sand', ...def }, assets, data);
const has = (lines, re) => lines.some((l) => re.test(l));

test('every panel can be read back', () => {
  for (const sec of loadSections()) for (const { id, def } of sec.panels) {
    const lines = describePanel(id, def, assets, data);
    assert.ok(lines[0].startsWith(id), id);
  }
});

test('a figure on a stand anchor touches it; nudged off it, it is flagged', () => {
  const rock = { prop: 'rock-square', at: 0.5, depth: 'mid' };
  const fig = { character: 'rama', pose: 'step-hang', facing: 'right', on: 'rock-square#stand' };
  assert.ok(!has(say({ figures: [rock, fig] }), /no foot touches/));
  assert.ok(has(say({ figures: [rock, { ...fig, nudge: 4 }] }), /^\s+! "on" rock-square#stand, but no foot touches it/));
  // lifted on purpose (a leap): worth a look, not a mistake
  assert.ok(has(say({ figures: [rock, { ...fig, nudge: [0, 2] }] }), /^\s+\? "on" rock-square#stand.*lifted by nudge/));
});

test('a face behind something drawn after it is flagged', () => {
  const fig = { character: 'rama', pose: 'step-hang', facing: 'right', at: 0.5 };
  assert.ok(!has(say({ figures: [fig] }), /covered/));
  const lines = say({ figures: [fig, { prop: 'rock-square', at: 0.5, scale: 2, nudge: [0, 1.5] }] });
  assert.ok(has(lines, /! the face is \d+% covered by rock-square/), lines.join('\n'));
});

test('a figure high in a panel with nothing under it is in the air', () => {
  const lines = say({ figures: [{ character: 'rama', pose: 'step-hang', facing: 'right', at: 0.5, depth: 'mid', nudge: [0, 4] }] });
  assert.ok(has(lines, /\? in the air/), lines.join('\n'));
  assert.ok(!has(say({ figures: [{ character: 'rama', pose: 'step-hang', facing: 'right', at: 0.5, depth: 'mid' }] }), /in the air|small for/));
});

test('a duplicate id is flagged', () => {
  const f = { character: 'monkey1', pose: 'step-hang', id: 'm' };
  assert.ok(has(say({ figures: [{ ...f, at: 0.3 }, { ...f, at: 0.7 }] }), /! id "m" is used by 2 entries/));
});

test('the bottom edge cut is named by the body', () => {
  const lines = say({ tall: 0.6, figures: [{ character: 'rama', pose: 'step-hang', facing: 'right', at: 0.5, depth: 'closeup' }] });
  assert.ok(has(lines, /cut by the bottom edge: shows down to/), lines.join('\n'));
});
