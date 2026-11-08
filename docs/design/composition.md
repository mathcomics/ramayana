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
| 2 The throne | the throne of Ayodhya, empty, in its hall (02.01) | done |
| 3 The forest | the forest hut from above (03.01) | done |
| 4 Surpanakha | the forest hut from above again (04.01), before she comes | done |
| 5 The golden deer | Lanka on its island across the sea (05.01, `0.5-lanka`); then Surpanakha before Ravana (05.02) | done |
| 6 Jatayu | — | to choose |
| 7 Sugriva and Bali | Kishkindha on the horizon, sky above (07.01, the drawn `kishkindha`) | done |
| 8 Hanuman finds Sita | the same hills again (08.01) | done |
| 10 The bridge | Lanka across the sea, as 05.01 | when chapter 10 is made |
| 11 The war begins | — | to choose (before Lanka's walls?) |

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
  The redrawn `throne-ayodhya` (2026-11-08) is dark with a dark centre in
  its red sun disc for exactly this: the king's gold crown reads against
  it. Three thrones now: `throne-ayodhya`, `throne-lanka` (Ravana's,
  gold-backed) and `throne-kishkindha` (gold stupa dome echoing the
  `kishkindha` palace — Sugriva's coronation; ends `throne-lanka`'s
  stand-in use there when the chapter is revisited).

## Top view

- The establishing view of a place: no horizon, no sky, the ground fills
  the panel. The main building in the middle, small; clumps of trees in
  opposite corners frame it, leaving the other two corners open.
  (0.5-forest)
- Top-view props are drawn obliquely (roof and one wall, tree canopy above
  its trunk); place them with `lift` (the rows mean little from above).
- People from above: `male-top` (the artist's standing man — head,
  shoulders, arms, feet), `male-top-back` (the same man seen from
  behind, facing away) and `female-top` (the woman, her hair showing).
  One drawing serves everyone: recolour an
  instance with `who` (a character id) or `body` / `cloth`
  (docs/design/panels.md, Recolouring). Held things (bow, begging bowl)
  will be separate top-view props placed beside it — not drawn yet.

## Kishkindha and rocks

- `kishkindha`: the monkey city's domed palace on its dark hill, with the
  flat-topped Rishyamukha mountain in front — where the exiles watch Sita
  carried over (08.05) and later meet Rama. Figures stand on the plateau
  with `on`: `"kishkindha#stand"` (also `#stand-left`, `#stand-right`).
  A figure on an anchor takes the prop's scale: for small figures on a
  big mountain, scale the prop up and give the figure a `scale` below 1.
- `ledge`: a flat-topped rock for any rocky scene (stand anchors as
  above; `seat` near its right edge for sitting). Mirror (`facing`) and
  `scale` it for variety when it repeats.

## Jatayu

- Four drawn poses (`vulture-fly`, `-swoop`, `-fall`, `-stand`), black
  silhouettes. The flying ones share a scale (9 head-units wingspan
  soaring); standing he is 5 head-units, perched in a tree about half
  that (`scale` 0.5). In the air beside the chariot use `scale` 0.6–0.7.
  Lying (06.10, 06.11) is not drawn yet (`vulture-lie` placeholder).

## Props and anchors

- Props face right as drawn; `facing: "left"` mirrors them.
- A prop drawing can carry named points in a group `id="anchors"` (circles):
  `seat` is where a seated figure's hips rest; `stand`, `stand-left`,
  `stand-right` are where a standing figure's feet rest (`on`:
  `"<prop>"` means the seat, `"<prop>#<anchor>"` names another). They
  are not drawn.
- A prop registered with `recolor` takes a character's colours (`who`) or
  explicit `body` / `cloth` per instance (docs/design/panels.md).
