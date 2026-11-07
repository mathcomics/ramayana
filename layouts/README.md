# Layouts

Templates for sketching panel layouts by hand (Inkscape), one per panel size:

| File | Panel | Size (units) |
|---|---|---|
| `template-1.svg` | full screen | 360 × 720 |
| `template-0.75.svg` | the usual panel | 360 × 540 |
| `template-0.5.svg` | half screen | 360 × 360 |

Each has one layer, `page` (locked): the panel rectangle and the three
rows' ground lines. On top, three simple men as plain groups (not
layers), `man-front`, `man-mid` and `man-back`, each the height a man has
in that row, to move, copy or scale while sketching. Rows and sizes as in
`docs/design/panels.md`. Save sketched layouts here under their own
names.

Regenerate after a change to the figures or rows:

    node tools/layout-template.mjs 1      # or 0.75, 0.5
