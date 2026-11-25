# Composition

How things are arranged in a panel. The model panel for each kind of
scene is in `panels/layouts.md`; a composition the artist approves adds
what it teaches here. Depth and panel heights: `docs/design/panels.md`.

## Chapter openers

Each chapter starts with a location panel: the place, empty or nearly, no
action. The same opener can return when the story comes back to a place.

| Chapter | Opener | Status |
|---|---|---|
| 1 Intro | the palace of Ayodhya on the horizon, sky above (01.01) | done |
| 2 The throne | the throne of Ayodhya, empty, in its hall (02.01) | done |
| 3 The forest | the forest hut from above (03.01) | done |
| 4 Surpanakha | the forest hut from above again (04.01), before she comes | done |
| 5 The golden deer | Lanka on its island across the sea (05.01); then Surpanakha before Ravana (05.04) | done |
| 6 Jatayu | Jatayu alone on his bluff, the cry coming over the forest (06.01) | done |
| 7 Sugriva | Kishkindha on the horizon, sky above (07.01, the drawn `palace-kishkindha`) | done |
| 8 Bali | Kishkindha's gates, near (08.01) | done |
| 9 The leap | Kishkindha on the horizon again (09.01, as 07.01) | done |
| 10 The ring | night: Lanka's wall (10.01) | done |
| 12 The bridge | Lanka across the sea, as 05.01 (12.01) | done |
| 13 The war begins | — | to choose (before Lanka's walls?) |
| 14 Kumbhakarna | Lanka across the sea, as 05.01 (14.01) | draft |
| 15 The mountain of herbs | Lanka across the sea by night (15.01) | draft |
| 16 Indrajit | the shrine, the fire burning alone at the top of its steps (16.02a) | draft |

## Sky and distance

- An outdoor panel can have a band of sky: panel field `sky` (a colour
  name from `data/grounds.json`, e.g. `blue-sky`) above the horizon. The
  horizon sits a little above a third of the way up (`horizon`, default
  0.37 of the panel height above the bottom edge). (05.10, 05.12)
- Something far away stands on the horizon and is small: `depth: "horizon"`
  (16 px per head-unit in a 1.5 panel; `scale` brings it nearer).
- Distance needs nothing in between: the horizon and the size do the work.
  An empty ground with a small figure at its edge reads as "far away" and
  "getting away". (05.12)
- A big figure close in front, cut by the panel's edge, with the subject
  small and far: the reader looks with the figure. (05.10)

- A place far away is a small prop on the horizon with nothing else: the
  sea and the sky are the panel (05.01: `lanka-island` at depth
  `horizon` is as drawn in a 1 panel, with `palace-lanka` stood small
  on its `stand` anchor — `"on": "lanka-island#stand"`, scale 0.5).

## Throne and hall

- The throne stands in the middle with its steps; the king sits on it, not
  in front of it (figure `on: "<throne>"`, pose `chair-armrest`, which
  works in front view and in profile — the throne drawings read front-on
  too: 05.04–05.05). Courtiers stand at different depths on
  either side: one small (further back), one bigger (nearer).
- The throne stands behind the people talking in front of it (`depth:
  "mid"`), so it reads as the room's centre, not as one of them.
- Watch the colours: a gold crown disappears against the gold throne back;
  check heads against what's behind them. Three thrones:
  `throne-ayodhya` (gold-backed, Dasharatha's), `throne-lanka` (dark seat
  and steps under the red disc, its centre dark, Ravana's) and
  `throne-kishkindha` (gold stupa dome echoing the `palace-kishkindha` palace —
  Sugriva's coronation, 08.19 and 09.03). The names do not match what the
  drawings' own comments claim: the assignment above is the artist's and
  deliberate — don't swap them.

## Top view

- The establishing view of a place: no horizon, no sky, the ground fills
  the panel. The main building in the middle, small; clumps of trees in
  opposite corners frame it, leaving the other two corners open.
  (03.01)
- Top-view props are drawn obliquely (roof and one wall, tree canopy above
  its trunk); the panel is `"camera": "top"` and they are placed with a
  numeric `depth`, the height up the ground (the named depths mean little
  from above).
- People from above: `male-top` (the artist's standing man — head,
  shoulders, arms, feet), `male-top-back` (the same man seen from
  behind, facing away) and `female-top` (the woman, her hair showing).
  One drawing serves everyone: recolour an
  instance with `character` (a character id) or `body` / `cloth`
  (docs/design/panels.md, Recolouring). Held things (bow, begging bowl)
  will be separate top-view props placed beside it — not drawn yet.

## Kishkindha and rocks

- `palace-kishkindha`: the monkey city's domed palaces on their green hill,
  a zigzag stair up to the great door. A figure stands on the stair
  (its lower flight) with `on`: `"palace-kishkindha#stand"`.
  A figure on an anchor takes the prop's depth, not its scale: a big
  mountain (prop `scale` 4) leaves the figure on it at its depth's size,
  so a figure on a big prop seen from far off gets its own `scale` below 1
  (or the prop a larger depth and a larger `scale`).
- **Rocks** (artist, 2026-11-10): rocky scenes use the plain
  rocks `rock-circle` (round boulder), `rock-square` (squat block) and
  `rock-rectangle` (long and low), often **one big with a smaller one
  in front of it** (07.05, 07.10). `stand` / `seat` anchors on the top
  (`stand-left`, `stand-right` towards the ends where drawn). Scale and
  mirror them to the scene.
  - Figures up on a rock watching those below: a big rock (`rock-square`
    at `depth: "mid"`, `scale` ~4) with the watchers on its anchors at a
    small `scale` (0.2), the walkers large in front (07.03).
  - Sitting on a rock like a seat: `chair-armrest` standing **on the
    ground** (`at`, no `on`), with a `rock-circle` at `scale` 0.75 drawn
    before it so its top meets the hips (07.10, 07.11). The rock's
    `seat` anchor is on its top and a chair pose's feet land on an anchor
    (as on a throne's step), so `on` would hang the legs in the air.

## Jatayu

- Four drawn poses (`vulture-fly`, `-swoop`, `-fall`, `-stand`), black
  silhouettes, plus `vulture-wing` — **the wing Ravana cuts off**, not a
  bird: a lone wing, placed well clear of the falling bird so the two do
  not merge into one mass (06.06). The flying ones share a scale (9
  head-units wingspan soaring); standing he is 5 head-units, perched in a
  tree about half that (`scale` 0.5). In the air beside a flying figure
  use `scale` 0.6–0.8. All four birds mirror cleanly with `facing:
  "left"`, so Jatayu can come at his enemy either way.
  Lying (06.25) is not drawn yet (`vulture-lie` placeholder).
- Standing on a rock: `vulture-stand` on a `rock-circle`'s `seat`
  anchor (03.08).

## Props and anchors

- Props face right as drawn; `facing: "left"` mirrors them.
- A prop drawing can carry named points in a group `id="anchors"` (circles):
  `seat` is where a seated figure's hips rest; `stand`, `stand-left`,
  `stand-right` are where a standing figure's feet rest (`on`:
  `"<prop>"` means the seat, `"<prop>#<anchor>"` names another). They
  are not drawn.
- A prop whose drawing names `data-recolor-*` roles takes a character's colours (`character`) or
  explicit `body` / `cloth` per instance (docs/design/panels.md).
