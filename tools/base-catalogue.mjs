// Every base (distinct lower body) from data/bases.json, drawn as a full
// figure with the hang gesture on it (side + front), alphabetically; each
// cell names the poses that use it (docs/design/pose-picking.md). A base =
// both legs + spine.lean + tail, named by the artist (one word, with a desc).
//
//   node tools/base-catalogue.mjs [--who rama] [--zoom 2]
//     -> out/base-catalogue.{svg,png,html}   (shared code: tools/catalogue.mjs)
import { catalogue } from './catalogue.mjs';

catalogue('base');
