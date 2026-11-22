// Flip panels left to right: the picture mirrored, every figure and prop
// turned to face the other way.
//
//   node tools/flip-panel.mjs 17.07 18.07 [--dry]
//
// Per entry: `at` (a number) becomes 1 − at, a slot (left, center-left …)
// its mirror, a relation left-of ↔ right-of (before / behind follow the
// facing by themselves); `facing` right ↔ left (left out it is right, so
// it becomes "left"); a nudge's across part and `rotate` change sign; a
// foreground's [left, right] heights swap. What stays: the character's own
// right and left (hands, adjust, held props: mirroring by facing keeps
// them), the head `turn` (from the body's own front), `on` anchors (a
// mirrored prop carries its anchors with it), depth, scale, view.
// A repeat keeps its count and gap; its seeded copies may land in
// mirrored order. Afterwards: render, look, accept the snapshot.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './lib.mjs';

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const ids = args.filter((a) => !a.startsWith('--'));
if (!ids.length) { console.error('usage: node tools/flip-panel.mjs <id> [<id> …] [--dry]'); process.exit(1); }

const SLOT = { left: 'right', right: 'left', 'center-left': 'center-right', 'center-right': 'center-left', center: 'center' };
const REL = { 'left-of': 'right-of', 'right-of': 'left-of' };
const r4 = (v) => Math.round(v * 1e4) / 1e4;

export function flipEntry(e) {
  if (e.foreground != null) {
    if (Array.isArray(e.foreground)) e.foreground = [e.foreground[1], e.foreground[0]];
    return e;
  }
  if (typeof e.at === 'number') e.at = r4(1 - e.at);
  else if (typeof e.at === 'string' && SLOT[e.at]) e.at = SLOT[e.at];
  else if (e.at && typeof e.at === 'object') {
    for (const [a, b] of Object.entries(REL)) if (a in e.at && !(b in e.at)) { e.at[b] = e.at[a]; delete e.at[a]; break; }
  }
  if (e.facing === 'left') e.facing = 'right';
  else if (e.character || e.who || e.prop) {
    if ('facing' in e) e.facing = 'left';
    else {                                    // put facing after the name, as the panels write it
      const out = {};
      for (const [k, v] of Object.entries(e)) {
        out[k] = v;
        if (k === 'pose' || (k === 'prop' && !('pose' in e))) out.facing = 'left';
      }
      if (!('facing' in out)) out.facing = 'left';
      for (const k of Object.keys(e)) delete e[k];
      Object.assign(e, out);
    }
  }
  if (typeof e.nudge === 'number') e.nudge = r4(-e.nudge) || 0;
  else if (Array.isArray(e.nudge)) e.nudge = [r4(-e.nudge[0]) || 0, e.nudge[1]];
  if (typeof e.rotate === 'number') e.rotate = r4(-e.rotate) || 0;
  return e;
}

const write = (f, o) => writeFileSync(f, JSON.stringify(o, null, 2)
  .replace(/"tags": \[\s*([^\]]*?)\s*\]/, (m, a) => `"tags": [${a.split(/,\s*/).join(', ')}]`) + '\n');

const dirs = readdirSync(join(root, 'panels'));
for (const id of ids) {
  const dir = dirs.find((d) => d.startsWith(id.split('.')[0] + '-'));
  const f = dir && join(root, 'panels', dir, id + '.json');
  let p;
  try { p = JSON.parse(readFileSync(f, 'utf8')); } catch { console.error(`${id}: no panel`); process.exitCode = 1; continue; }
  p.figures = (p.figures || []).map(flipEntry);
  if (dry) console.log(JSON.stringify(p, null, 2));
  else { write(f, p); console.log(`${id}: flipped${p.tags ? ' (a locked reference panel: flip it only on the artist\'s word)' : ''}`); }
}
