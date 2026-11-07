# Composition

How things are arranged in a panel, learned from the artist's scene
layouts (`layouts/scenes/`, indexed in its README). Each new layout adds
what it teaches here. Rows, shots and sizes: `docs/design/panels.md`.

## Chapter openers

Each chapter starts with a location panel: the place, empty or nearly, no
action. The same opener can return when the story comes back to a place.

| Chapter | Opener | Status |
|---|---|---|
| 1 Intro | the palace of Ayodhya on the horizon, sky above (01.01) | done |
| 2 The throne | — | to choose (the throne hall?) |
| 3 The forest | the forest hut from above (03.01) | done |
| 4 Surpanakha | the forest hut from above again (04.01), before she comes | done |
| 5 The golden deer | Lanka on its island across the sea (05.01, `0.5-lanka`); then Surpanakha before Ravana (05.02) | done |
| 6 Jatayu | — | to choose |
| 7 Sugriva and Bali | the rocky hills of Rishyamukha / Kishkindha on the horizon, sky above (07.01; `hills` placeholder) | done |
| 8 Hanuman finds Sita | the same hills again (08.01) | done |
| 10 The war begins | Lanka across the sea, as 05.01 | when chapter 10 is made |

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

- A place far away is a small prop on the horizon with nothing else: the
  sea and the sky are the panel (0.5-lanka; `lanka-island` on row
  `horizon` is as drawn in a 0.5 panel).

## Throne and hall

- The throne stands in the middle with its steps; the king sits on it, not
  in front of it (figure `on: "throne"`, pose `sit-chair` — the artist's
  lab save, merged 2026-11-07; it works front view and in profile, and the
  throne drawing reads front-on too: 05.02–05.03). Courtiers stand at
  different depths on either side: one small (further back), one bigger
  (nearer). (0.5-lanka-throne)
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

## Jatayu

- Four drawn poses (`vulture-fly`, `-swoop`, `-fall`, `-stand`), black
  silhouettes. The flying ones share a scale (9 head-units wingspan
  soaring); standing he is 5 head-units, perched in a tree about half
  that (`scale` 0.5). In the air beside the chariot use `scale` 0.6–0.7.
  Lying (06.10, 06.11) is not drawn yet (`vulture-lie` placeholder).

## Props and anchors

- Props face right as drawn; `facing: "left"` mirrors them.
- A prop drawing can carry named points in a group `id="anchors"` (circles):
  `seat` is where a seated figure's hips rest. They are not drawn.
