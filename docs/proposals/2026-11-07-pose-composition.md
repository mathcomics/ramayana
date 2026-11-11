# Pose composition: bases and gestures

2026-11-07 · status: partly implemented. Bases and gestures are their
own files (`data/bases.json`, `data/gestures.json`), every pose is
composed from them when the data loads (`src/compose.js`, 2026-11-10,
replacing `tools/recompose.mjs`), the lab edits them separately, and the
catalogues are built; documented in `docs/design/pose-picking.md`
(Composition). What follows is still open.

## Open

- **Chest on a reclined base.** A gesture's `chest` is tuned against its
  home base's lean, so on a reclined base (sit) the pitches add and the
  upper body tips too far. A pose has no angles of its own, so it cannot
  be retuned per pose either. Wanted: compose chest relative to the base's lean (or a
  per-base chest offset) so the grid gets it right.
- **Gaps as products.** `tools/pose-gaps.mjs` still reports flat pose
  names; it could report which base × gesture products the scenes ask
  for, and mark a wanted pose whose base and gesture both exist as
  ready to compose.
- **"Arms from… / Legs from…" in the lab.** Take only the upper (or
  lower) half of any gallery pose into the current one, for a draft
  whose half is not yet a named gesture or base.
- **Composition as spec — deferred.** Panels would name any
  `base-gesture` pair, listed or not, and it would be composed on the
  fly. Composition already runs when the data loads; what is deferred is
  dropping the list, which carries the finding fields and keeps
  untested products (kneel-bow) out of panels.
