// Every gesture (distinct upper body) from data/gestures.json, drawn as a
// full figure on the step base (side + front), alphabetically; each cell
// names the poses that use it (docs/design/pose-picking.md). A gesture =
// both arms (held prop included) + spine.chest/neck/head + mouth, named by
// the artist (one word, with a desc).
//
//   node tools/gesture-catalogue.mjs [--who rama] [--zoom 2]
//     -> out/gesture-catalogue.{svg,png,html}   (shared code: tools/catalogue.mjs)
import { catalogue } from './catalogue.mjs';

catalogue('gesture');
