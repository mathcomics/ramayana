# Layouts (retired 2026-11-08)

The `layouts/` folder — hand-sketching templates and the artist's scene
compositions — is deleted; **approved reference panels (`tags`) carry
composition now** (`grep -rl '"tags"' panels/`, see `panels/CLAUDE.md`).
The artist's original SVGs stay in git history (last present at commit
`e710bec`). This page keeps what the folder taught and where each of its
roles lives today.

## Where the roles went

| The folder held | Lives now in |
|---|---|
| Reference compositions to follow | tagged panels (`tags` field; `docs/design/panel-writing.md`, step on tags) |
| Arranging rules from the artist's scene layouts | `docs/design/composition.md` |
| Row geometry of the shots | `SHOTS` in `src/scene.js`; the tables in `docs/design/panels.md` |
| Prop drawings inside the scenes | extracted to `data/props/` (throne, deer, hut-top, lanka-island …) |
| The panel `layout` field naming the layout followed | retired; removed from the panels (the mapping is below) |

## Shots: provenance and how to add one

The three row sets (`far`, `wide`, `mid`) were measured from the artist's
own layout drawings `0.75-wide.svg` and `0.75-mid.svg` (360 × 540; a
locked `page` group with the panel rectangle and ground lines, simple men
`man-front` / `man-mid` / `man-back` drawn at each row's height). The
generated size/shot variants added nothing beyond scaling, which the
renderer does itself — that's why the templates could go
(`tools/layout-template.mjs` deleted with them).

**A new shot** is still made the same way: draw a 360 × 540 page with
ground lines and a man per row, measure each row's head-unit (man height
÷ 7.5) and its ground line's height above the bottom edge as a share of
the panel, and add the row set to `SHOTS` in `src/scene.js`. The drawing
itself need not be kept once measured.

## The artist's scene layouts → the panels that embody them

Each composition's rules are in `docs/design/composition.md`; the drawn
props are in `data/props/`. To follow one now, open the model panel.

| Was | What it showed | Model panel(s) | Suits |
|---|---|---|---|
| `0.5-forest` | the forest home from above: top view, no horizon, ground `sage`, hut in the middle, a clump of trees top-left and the same clump bottom-right | 03.01 (= 04.01) | any "the hut in the forest" establishing panel; top views |
| `0.5-lanka-throne` | a king on his throne with courtiers: hall ground, throne with steps in the middle, king seated `on` it, one courtier further back left, one nearer (1.2×) right | 05.02–05.03; 02.01–02.03 | any court: Ravana's (ch 11–13), Ayodhya's, Sugriva's |
| `0.5-deer` | someone watches a creature far off: sky above a 0.37 horizon, a big figure in front cut by the bottom edge (1.5×), the subject small on the horizon | 05.08 | any "sees something in the distance" |
| `0.5-deer-running` | a creature flees into the distance: same sky and horizon, otherwise empty, a small leaping deer on the horizon at the right edge | 05.10 (tagged `chase`, `far`) | any chase or escape |
| `0.5-lanka` | Lanka from far off: no figures, `mist` sky over `sea`, the island small on the horizon a little right of centre, `palace-lanka` on its `stand` anchor | 05.01 | chapter 12's opener; any arrival at Lanka |

Panels that carried a `layout` field (removed with the folder): 02.01,
02.02, 05.02 (lanka-throne); 03.01, 04.01, 05.07, 05.17 (forest); 05.01,
07.09 (lanka — a far place small on the horizon); 05.08 (deer); 05.10
(deer-running).

Not a layout: the artist's Jatayu pose sheet is a props source,
`data/props/sheets/jatayu.svg` → the four `vulture-*` props.
