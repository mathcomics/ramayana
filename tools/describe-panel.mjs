// A panel as text: where everything was drawn and what touches what, so a
// panel can be checked without looking at the picture
// (docs/design/panels.md, Reading a panel back).
//
//   node tools/describe-panel.mjs 12.26          one panel
//   node tools/describe-panel.mjs 12             a chapter (its folder number)
//   node tools/describe-panel.mjs 12 --problems  only the lines marked ! or ?
//   node tools/describe-panel.mjs --props        every prop: size, anchors, recolour roles
//   node tools/describe-panel.mjs --poses        every base and gesture: what it is, how wide, how high
//
// Lines: one per entry (drawn order), then its notes. "!" is a mistake the
// artist has failed panels for (a face covered or cut, a figure "on" a prop
// whose feet miss it); "?" is worth a look (in the air with nothing under
// it, small for where it stands); "·" is information.
import { loadAssets, loadSections, json } from './lib.mjs';
import { describePanel, describeProps, describePoses } from './describe-lib.mjs';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const want = args.filter((a) => !a.startsWith('--'));
const assets = loadAssets();
const data = { bases: json('data/bases.json').bases, gestures: json('data/gestures.json').gestures };

if (flags.has('--props')) { console.log(describeProps(assets).join('\n')); process.exit(0); }
if (flags.has('--poses')) { console.log(describePoses(assets, data).join('\n')); process.exit(0); }
if (!want.length) { console.log('usage: node tools/describe-panel.mjs <id | chapter number> … [--problems] | --props | --poses'); process.exit(1); }

const pick = (sec, id) => want.some((w) => (/^\d+$/.test(w) ? sec.name.startsWith(`${w.padStart(2, '0')}-`) : id === w || id.startsWith(w)));
let shown = 0;
for (const sec of loadSections()) for (const { id, def } of sec.panels) {
  if (!pick(sec, id)) continue;
  const lines = describePanel(id, def, assets, data);
  if (flags.has('--problems')) {
    const bad = lines.filter((l) => /^\s*[!?] /.test(l));
    if (bad.length) console.log([lines[0], ...bad].join('\n') + '\n');
  } else console.log(lines.join('\n') + '\n');
  shown++;
}
if (!shown) console.log(`no panel matches ${want.join(' ')}`);
