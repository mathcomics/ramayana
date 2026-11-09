# Working on data: poses, faces, parts, props

You are working on the figure and prop data the renderer draws from.

**Queues:** poses wanted by the story: `docs/issues/missing-poses.md`
(generated; the source is `wanted` in `data/pose-index.json`). Props the
panels need: `docs/issues/missing-props.md` (generated). What looks
wrong: `docs/issues/problem-poses.md`.

- **Poses**: refined in the pose lab (URL in the root CLAUDE.md); saves
  land in its database (collection `poses`) and are merged into
  `poses.json` after review. Names: `<base>-<visible action>` (style
  bible §7, `docs/design/pose-picking.md`). Every pose needs a
  `pose-index.json` entry with known tags — `npm test` enforces it.
- **Faces and parts are the artist's drawings**: never edit their curves
  or colours; only place, rotate, mirror. Import with the tools
  (`import-faces`, `import-parts`, `import-held`); they report
  mismatches for the artist to fix in the drawings.
- **Props**: art in `data/props/<id>.svg`, 100 px = 1 head-unit, size
  from the viewBox, anchors (`seat` for hips, `stand`/`stand-left`/
  `stand-right` for feet, `face` for a head alone) in a group
  `id="anchors"` — an anchor is named after what of the figure lands on
  it, not after where it sits in the drawing. A whole-figure anchor is a
  point (its circle is just a marker); a part anchor is drawn to size,
  the circle's diameter being the head height (100 px = 1 head-unit, so
  `r="50"` is a full-size head). A prop that should
  recolour per use (e.g. `male-top`) names its role colours in its
  `data/props.json` entry: `"recolor": { "body": "#…", "cloth": "#…" }`.
  Held props (sword, club, bow) in `data/props/held/` with a reference
  `line`, imported by `tools/import-held.mjs`.
- After any change: regenerate the relevant sheet (contact, parts, face,
  head-turn, pose catalogue) and **look at it**; `npm test` before every
  commit (`UPDATE_SNAPSHOT=1` only after looking at an intended change);
  republish the pose lab after pose or face changes.
