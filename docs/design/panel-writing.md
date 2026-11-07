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
- **Size**: 0.5 and 0.3 mostly (artist, 2026-11-07); 0.75 **only when the
  height is used in a particular way** — a fall or flight, looking far up
  or down, sky-to-ground depth, a towering figure. A 0.75 panel whose
  figures sit in the bottom half with empty ground above wants to be 0.5
  or 0.3. Never 1 (too tall). The manuscript's "full" means at most 0.75,
  and only if it earns the height.
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

- **Establish a new place and its key figure as a sequence, not one
  panel** (artist, 2026-11-07, chapter 05): location from far; the figure
  in their place, far (a king on his throne, front view); the same
  closer (step the shot far → mid); the arriving character near the
  viewer, waist up, facing them; then the exchange in 2–3 more panels
  (gesture, reaction, decision). The old single panel crammed arrival,
  complaint and rage into one image.
- **The wordless test** (artist, 2026-11-07): a scene that cannot be
  understood without words — an order, a refusal, a bargain — is cut, not
  approximated. The Ravana-orders-Maricha scene was dropped for this; the
  golden deer simply appears. Ask of every scene: does the action alone
  tell it?
- **Shots are the zoom**: consecutive panels step far → wide → mid like a
  camera move (05.02 → 05.03). In a mid shot, the second party of a
  dialogue goes in the `back` row for depth (05.04); `mid` row is nearly
  as big as `front` and kills the depth.
- **Aim the gazes**: `spine.head` adjust, + looks down, − looks up. A
  kneeling figure looks up at the one standing over them (05.06); seated
  and kneeling figures otherwise stare level through their partner's
  waist.
- **A raised arm hides the face**: a gesture toward the own face (showing
  a wound) reads as hiding it; throw the arms out instead and leave the
  face clear (05.05).

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
