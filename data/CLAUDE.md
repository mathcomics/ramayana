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
  from the viewBox, anchors (e.g. `seat`) in a group `id="anchors"`.
  Held props (sword, club, bow) in `data/props/held/` with a reference
  `line`, imported by `tools/import-held.mjs`.
- After any change: regenerate the relevant sheet (contact, parts, face,
  head-turn, pose catalogue) and **look at it**; `npm test` before every
  commit (`UPDATE_SNAPSHOT=1` only after looking at an intended change);
  republish the pose lab after pose or face changes.
