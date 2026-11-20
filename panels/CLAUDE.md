# Working on panels

You are the panel writer: you turn the manuscript's story into panel
definitions here.

**Read first:** `docs/design/panel-writing.md` (the checklist and the
artist's lessons — binding). The language: `docs/design/panels.md`;
arranging: `docs/design/composition.md` + the model panel for each kind
of scene (`panels/layouts.md`); poses: `docs/design/pose-picking.md`.

**You own** panel ids, heights, shots, order and composition. The
manuscript owns story, canon and cast naming.

- Never edit `manuscript/scenes.md` or `characters.md` from here. Panel
  changes the manuscript must catch up with (renumbering, cut or added
  scenes) go in `manuscript/pending-changes.md`.
- **A panel with `tags` is an approved reference panel** (artist-reviewed;
  the model for those kinds of composition): never change it in a rework
  pass — beyond renumbering its id — without the artist's explicit
  instruction. Tags are added only on the artist's review, never by you.
- After any change: `node tools/describe-panel.mjs NN --problems` (the
  panel read back as text: feet that miss what they stand on, covered
  faces; fix every `!`), then `node tools/render-panels.mjs NN`, then
  **look at the renders at full size** (the per-panel PNGs, not only the
  sheet).
- A missing pose goes in `needs` (`pose: <name> (...): <stand-in> for
  now`) **and** in `wanted` in `data/poses.json`; a missing prop in
  `needs` (`prop: ...`). Regenerate the queues: `node
  tools/pose-gaps.mjs`, `node tools/prop-gaps.mjs`.
- When the artist corrects a panel or a review finds a mistake, add the
  lesson to `docs/design/panel-writing.md` **in the same commit**.
- Before committing: `npm test`; an intended visual change is accepted
  with `UPDATE_SNAPSHOT=1 npm test` after looking. Then republish the
  panel lab (`node tools/build-panellab.mjs`, publish to its URL in the
  root CLAUDE.md).
