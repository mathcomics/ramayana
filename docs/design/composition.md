# Composition

How things are arranged in a panel, learned from the artist's scene
layouts (`layouts/scenes/`, indexed in its README). Each new layout adds
what it teaches here. Rows, shots and sizes: `docs/design/panels.md`.

## Sky and distance

- An outdoor panel can have a band of sky: panel field `sky` (a colour
  name from `data/grounds.json`, e.g. `sky`) above the horizon. The
  horizon sits a little above a third of the way up (`horizon`, default
  0.37 of the panel height above the bottom edge). (0.5-deer,
  0.5-deer-running)
- Something far away stands on the horizon and is small: `row: "horizon"`
  (16 px per head-unit in a 0.75 panel; `scale` brings it nearer).
- Distance needs nothing in between: the horizon and the size do the work.
  An empty ground with a small figure at its edge reads as "far away" and
  "getting away". (0.5-deer-running)
- A big figure close in front, cut by the panel's edge, with the subject
  small and far: the reader looks with the figure. (0.5-deer)

## Throne and hall

- The throne stands in the middle with its steps; the king sits on it, not
  in front of it (figure `on: "throne"`, pose `sit` until a throne pose
  exists). Courtiers stand at different depths on either side: one small
  (further back), one bigger (nearer). (0.5-lanka-throne)
- The throne sits a row behind the people talking in front of it (`row:
  "mid"`), so it reads as the room's centre, not as one of them.
- Watch the colours: a gold crown disappears against the gold throne back.

## Top view

- The establishing view of a place: no horizon, no sky, the ground fills
  the panel. The main building in the middle, small; clumps of trees in
  opposite corners frame it, leaving the other two corners open.
  (0.5-forest)
- Top-view props are drawn obliquely (roof and one wall, tree canopy above
  its trunk); place them with `lift` (the rows mean little from above).

## Props and anchors

- Props face right as drawn; `facing: "left"` mirrors them.
- A prop drawing can carry named points in a group `id="anchors"` (circles):
  `seat` is where a seated figure's hips rest. They are not drawn.
