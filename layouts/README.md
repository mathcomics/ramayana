# Layouts

Reference layouts for planning panels, named `<size>-<shot>.svg`:

- size: `0.75` (the usual panel, 360 × 540), `0.5` (half screen, 360 × 360),
  `1` (full screen, 360 × 720, rarely).
- shot: how close the camera is.

| Shot | What | Rows (`shot` in a panel) |
|---|---|---|
| `far` | small whole figures, deep rows | the default |
| `wide` | whole figures, bigger, rows close together | from the artist's `0.75-wide.svg` |
| `mid` | close: the front man cut at the thighs, ground below the panel; the panel crops the figures | from the artist's `0.75-mid.svg` |

Each file has one locked layer, `page` (the panel rectangle and the rows'
ground lines that fall inside it), and simple men as plain groups
(`man-front`, `man-mid`, `man-back`), each the height of a man in that row.
Add variants as `<size>-<shot>-2.svg` …

`0.75-wide.svg` and `0.75-mid.svg` are the artist's own (the rows in
`src/scene.js` were measured from them). The others are generated:

    node tools/layout-template.mjs 0.5 wide      # layouts/0.5-wide.svg

A new shot is a new row set in `SHOTS` (`src/scene.js`), measured from a
layout drawn here.
