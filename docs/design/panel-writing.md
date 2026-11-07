# Writing a section's panels

The checklist for turning a section of `manuscript/scenes.md` into
`panels/<NN-section>/`, with every direction and review the artist has
given so far. Read it before writing panels; add to it whenever the artist
corrects a panel or a review finds a mistake (the lesson, not the story of
it). The language itself: `panels.md`; arranging: `composition.md`; poses:
`pose-picking.md`.

## Before writing

1. Read the section in `manuscript/scenes.md` and the cast in
   `data/characters.json` (who is who: below).
2. `node tools/pose-gaps.mjs --scenes NN`: candidate poses per scene.
3. Look in `layouts/scenes/README.md` for a layout of the same kind
   (a far place, a throne, a top view, something seen far off) and follow
   it; name it in the panel's `layout` field.
4. Check the chapter opener (`composition.md`, Chapter openers).

## Panel by panel

- **Open the chapter with a location panel**: the place, empty or nearly,
  no action. Reuse an earlier opener when the story returns to a place
  (the forest hut 03.01 → 04.01; Lanka 05.01 → chapter 10).
- **Size**: 0.75 mostly, 0.5 often, 0.3 for a strip. Never 1 (too tall).
  The manuscript's "full" means 0.75.
- **Shot**: `far` by default; `wide` for bigger whole figures, `mid` for
  close (front row cut at the thighs). Layout templates:
  `layouts/<size>-<shot>.svg`.
- **Poses**: legs first, arms from the verb; head direction (`turn`) and
  mouth are not poses; no silent `stand` (pose-picking rules). A missing
  pose goes in `needs` as `pose: <wanted name> (...): <stand-in> for now`.
- **Props**: use the drawn ones (`panels.md`, Props). Placeholders stay
  boxes and get a `needs` entry `prop: ...`.
- **Distance**: something far away goes on the horizon (`sky`, row
  `horizon`), small, with nothing in between.
- **Seated** on a throne: `on: "throne"` with a sitting pose, never
  standing in front of it.

## Lessons from reviews

- **The throne goes in the `mid` row**, a row behind the people in front:
  in the front row it is as tall as the men and runs off the edge.
- **`zoom` scales figures only**: a prop next to zoomed figures needs its
  own `scale` (the golden deer at `zoom` 0.75 needed `scale` 0.7), or it
  dwarfs them.
- **Creatures have their own sizes**: golden deer 4.6 head-units to the
  antler tips; Jatayu 9 wingspan flying, 5 standing, `scale` 0.5 perched in
  a tree, 0.6–0.7 in the air beside the chariot.
- **Colour clashes**: a gold crown vanishes against the gold throne back;
  check heads against what's behind them.
- **Top views** place props with `lift` (rows mean little from above).
- **Render and look** at every panel (`node tools/render-panels.mjs NN`),
  at phone size: poses must read from the silhouette; fix before showing.
- Every committed panel must render without issues other than
  placeholders (`npm test` checks).

## Story and cast directions (from the artist)

- **Surpanakha** stays a rakshasi throughout: no fair form, no
  transformation. Always the `surpanakha` character, cloth `red-check`.
  She first watches the three from behind a tree (04.02).
- **Surpanakha before Ravana** opens the golden deer chapter, after the
  Lanka opener (05.02).
- **Khara** = `raxas_m1` (id `khara`, cloth `red-diamond`).
  **Maricha** = `raxas_m1` (id `maricha`, cloth `white`).
  **The ascetic** (Ravana disguised) = `sage1` (id `ascetic`) until
  Ravana's own disguise exists.
- Generic monkeys and rakshasas vary by `cloth` (colour, pattern), not by
  new characters.

## After writing

- `needs` lists everything missing; `node tools/pose-gaps.mjs` refreshes
  `docs/issues/missing-poses.md`.
- `npm test` (accept intended render changes with `UPDATE_SNAPSHOT=1`
  after looking), commit, push, republish the panel lab.
- If panels were added, moved or renumbered, say so: the manuscript is
  kept in a separate conversation and needs the same change.
