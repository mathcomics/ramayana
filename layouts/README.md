# Layouts

Reference layouts for planning panels, named `<size>-<shot>.svg`:

- size: `0.75` (the usual panel, 360 × 540), `0.5` (360 × 360), `0.3` (a
  strip, 360 × 216). No full screen (1): too tall.
- shot: how close the camera is.

| Shot | What | Rows (`shot` in a panel) |
|---|---|---|
| `far` | small whole figures, deep rows | the default |
| `wide` | whole figures, bigger, rows close together | from the artist's `0.75-wide.svg` |
| `mid` | close: the front man cut at the thighs, ground below the panel; the panel crops the figures | from the artist's `0.75-mid.svg` |

Each file has no layers: a locked group `page` (the panel rectangle and the
rows' ground lines that fall inside it) and simple men as plain groups
(`man-front`, `man-mid`, `man-back`), each the height of a man in that row.
Add variants as `<size>-<shot>-2.svg` …

`0.75-wide.svg` and `0.75-mid.svg` are the artist's own (the rows in
`src/scene.js` were measured from them). The others are generated
(0.75-far, 0.5-far/-wide/-mid, 0.3-far/-wide/-mid):

    node tools/layout-template.mjs 0.5 wide      # layouts/0.5-wide.svg

A new shot is a new row set in `SHOTS` (`src/scene.js`), measured from a
layout drawn here.

## Scene layouts (`scenes/`)

Whole compositions drawn by the artist: ground, sky, props and men for
scale. Named `<size>-<subject>.svg`; kept as drawn. Each is indexed in
`scenes/README.md` (what it shows, how it's arranged, which scenes it
suits); the props in it are extracted into `data/props/` and the arranging
rules go into `docs/design/composition.md`. A panel built from one names it
in its `layout` field.
