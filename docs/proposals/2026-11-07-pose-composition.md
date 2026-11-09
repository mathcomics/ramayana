# Pose composition: bases and gestures

2026-11-07 · status: partly implemented. Bases, gestures, the lab's
pickers, `tools/recompose.mjs` and the catalogues are built and
documented in `docs/design/pose-picking.md` (Composition). What follows
is still open.

## Open

- **Chest on a reclined base.** A gesture's `chest` is tuned against its
  home base's lean, so on a reclined base (sit) the pitches add and the
  upper body tips too far. Today the artist retunes by eye, but a
  recompose resets chest to the gesture's, so that tuning does not
  survive. Wanted: compose chest relative to the base's lean (or a
  per-base chest offset) so the grid gets it right.
- **Gaps as products.** `tools/pose-gaps.mjs` still reports flat pose
  names; it could report which base × gesture products the scenes ask
  for, and mark a wanted pose whose base and gesture both exist as
  ready to compose.
- **"Arms from… / Legs from…" in the lab.** Take only the upper (or
  lower) half of any gallery pose into the current one, for a draft
  whose half is not yet a named gesture or base.
- **A command-line combine.** `node tools/combine-pose.mjs <base>
  <gesture>` writing a new pose and its index entry, for batch drafts
  outside the lab (recompose only re-derives poses that exist).
- **Composition as spec — deferred.** Panels would name
  `pose: "kneel + palms"` and the renderer would compose at render time.
  Deferred on purpose: it moves the solvers into the render path, and
  products are not free (kneel-bow). Revisit only if most composed
  drafts ship untouched.
