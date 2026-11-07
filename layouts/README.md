# Layouts

Templates for sketching panel layouts by hand (Inkscape), one per panel size:

| File | Panel | Size (units) |
|---|---|---|
| `template-1.svg` | full screen | 360 × 720 |
| `template-0.75.svg` | the usual panel | 360 × 540 |
| `template-0.5.svg` | half screen | 360 × 360 |

Each has the page rectangle (layer `page`), the three rows' ground lines
with their scale (`guide`), a man standing in each row for scale
(`figures`: front, mid, back), and an empty `sketch` layer to draw in.
The first three layers are locked. Rows and sizes as in
`docs/design/panels.md`.

Regenerate after a change to the figures or rows:

    node tools/layout-template.mjs 1      # or 0.75, 0.5
