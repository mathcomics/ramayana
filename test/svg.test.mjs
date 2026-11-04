import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, serialize, label, withoutDisplay } from '../tools/svg.mjs';

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
