# Working on data: poses, faces, parts, props

You are working on the figure and prop data the renderer draws from.

**Queues:** poses wanted by the story: `docs/issues/missing-poses.md`
(generated; the source is `wanted` in `data/poses.json`). Props the
panels need: `docs/issues/missing-props.md` (generated). What looks
wrong: `docs/issues/problem-poses.md`.

- **Poses** are a base (`bases.json`: legs, lean, tail) with a gesture
  (`gestures.json`: arms, chest, head, mouth), named `<base>-<gesture>`
  and listed in `poses.json` with their finding fields only (desc,
  ground, hold, use, like; known tags — `npm test` enforces it). Edit
  angles on the base or gesture, never per pose
  (`docs/design/pose-picking.md`). They are refined in the pose lab (URL
  in the root CLAUDE.md); saves land in its database (collections
  `bases`, `gestures`, `poses`) and are merged after review (the
  `commit-pose-lab` skill; merged saves are then deleted from the lab,
  since a save overrides the repo entry there).
- **Faces and parts are the artist's drawings**: never edit their curves
  or colours; only place, rotate, mirror. Import with the tools
  (`import-faces`, `import-parts`, `import-held`); they report
  mismatches for the artist to fix in the drawings.
- **Props**: art in `data/props/<id>.svg` (any SVG there is a prop, no
  registration), 100 px = 1 head-unit, size from the viewBox, anchors (`seat` for hips, `stand`/`stand-left`/
  `stand-right` for feet, `hand` for a figure hanging by one hand, `face`
  for a head alone) in a group
  `id="anchors"` — an anchor is named after what of the figure lands on
  it, not after where it sits in the drawing. A whole-figure anchor is a
  point (its circle is just a marker); a part anchor is drawn to size,
  the circle's diameter being the head height (100 px = 1 head-unit, so
  `r="50"` is a full-size head). A prop that should
  recolour per use (e.g. `male-top`) names its role colours on its root
  element: `<svg data-recolor-body="#…" data-recolor-cloth="#…" …>`
  (each must be a fill in the drawing — `npm test`). A prop id with no
  drawing is a fixed-size placeholder box; there is no prop registry.
  Held props (sword, club, bow) in `data/props/held/` with a reference
  `line`, imported by `tools/import-held.mjs`.
- After any change: regenerate the relevant sheet (contact, parts, face,
  head-turn, pose catalogue) and **look at it**; `npm test` before every
  commit (`UPDATE_SNAPSHOT=1` only after looking at an intended change);
  republish the pose lab after pose or face changes.
