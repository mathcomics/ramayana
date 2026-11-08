# Writing a section's panels

The checklist for turning a chapter brief of `manuscript/scenes.md` into
`panels/<NN-section>/`, with every direction and review the artist has
given so far. Read it before writing panels; add to it whenever the artist
corrects a panel or a review finds a mistake (the lesson, not the story of
it). The language itself: `panels.md`; arranging: `composition.md`; poses:
`pose-picking.md`; the storytelling principles behind these rules:
`sequential-grammar.md`.

## Before writing

1. Read the chapter's brief in `manuscript/scenes.md` — the beats, the
   "Must show" / "Not shown" notes **and the continuity-and-motifs list
   at the top** (returning places, travelling objects, mirrors) — and
   the cast in `data/characters.json` (who is who: below).
2. `node tools/pose-gaps.mjs --scenes NN`: candidate poses per beat.
3. Look in `layouts/scenes/README.md` for a layout of the same kind
   (a far place, a throne, a top view, something seen far off) and follow
   it; name it in the panel's `layout` field.
4. Check the chapter opener (`composition.md`, Chapter openers).
5. Look for **approved reference panels** whose `tags` cover the
   chapter's kinds of scene, and follow their composition:
   `grep -rl '"tags"' panels/` lists them all,
   `grep -rl '"tags".*panic' panels/` narrows to one tag (so far:
   `panic`, `crowd`, `flee`, `giant`, `chase`, `far`). Tagged panels are
   artist-reviewed and locked: never rework one without the artist's
   consent (`panels/CLAUDE.md`).

## Panel by panel

- **Open the chapter with a location panel**: the place, empty or nearly,
  no action. Reuse an earlier opener when the story returns to a place
  (the forest hut 03.01 → 04.01; Lanka 05.01 → chapter 10). A scene
  change **within** a chapter gets the same beat, smaller (0.5): Lanka →
  forest in 05.07 shows the hut again before the deer appears (artist,
  2026-11-07).
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
  mouth are not poses; no silent `step-hang` (pose-picking rules). A missing
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
- **Transformations fail the wordless test too** (artist, 2026-11-07): a
  creature becoming someone else reads as a new character, so it is cut —
  the shot deer just dies (05.12). A disguise thrown off is different:
  the same figure, revealed (05.19).
- **Sound travels as a picture**: a cry is a bubble with the shouter's
  face, repeated across consecutive panels as it crosses the land — from
  the dying deer (05.12), over the forest (05.13), to the hut (05.14).
  The same device can carry any far-off sound.
- **Action panels need action poses** (artist: the abduction was "too low
  action"): two figures standing near each other is a conversation, not a
  struggle. Use the falling, lunging and leaning poses (fallback-flung, lunge,
  leanback-armsback), opposed diagonals, a scale step for menace, mouth 3
  (05.19-05.21).
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
- **Not every character in every panel** (artist, 2026-11-07, golden
  deer): once the geography is set, show only whose beat it is. A pointed-at
  target can stay off-panel (05.08: Sita points past the edge, the deer
  is not shown); more, smaller panels beat one crowded one, as long as
  each panel's transition from the last is clear.
- **0.3 strips for reactions and partial views**: a `mid` shot in a 0.3
  panel gives chest-up figures that fill the strip (05.08, 05.10); use
  them often.
- **A chase is one distance**: put the chaser on the horizon row with the
  chased (05.09), not big in front running parallel to a far-off quarry.
- **No far props in a `mid`-shot strip**: a back-row prop's ground is far
  below a mid shot's bottom edge, so only its top shows — the Ayodhya
  throne reduced to its red disc, a stray ball (02.04 rework). Let the
  previous panel carry the geography.
- **A lone full-body action in a 0.3 strip wants `wide`, not `mid`**:
  `mid` crops a single walker to a floating chest (02.07 rework); `mid`
  strips are for chest-up reactions of one or two faces.
- **A foreground band stands on `row: "floor"`** (artist, 2026-11-08,
  03.02): a foreground strip of ground (after the figures in the list)
  on the front row leaves a 3%-of-panel gap below it; `floor` is the
  panel's bottom edge at the front row's scale, flush under any shot
  (a hand-tuned negative `lift` broke when the shot changed). And
  figures behind a rising band don't need
  per-figure `lift`s: full-size on the front row, the band's own slope
  staggers how deep each one sinks (the farther, the deeper). Walkers
  toward the reader (`view: front`) read larger and more alive there than
  small profile walkers (`zoom` cut them down; it went too).

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
