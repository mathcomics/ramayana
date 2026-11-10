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
3. For a scene of a known kind (a far place, a throne, a top view,
   something seen far off, travelling, a crowd in panic) follow the model
   panel in `panels/layouts.md` and its section in `composition.md`.
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
  change **within** a chapter gets the same beat, smaller (1): Lanka →
  forest in 05.08 shows the hut again before the deer appears (artist,
  2026-11-07).
- **Height** (`tall`): 1 and 0.6 mostly (artist, 2026-11-07); 1.5 **only when the
  height is used in a particular way** — a fall or flight, looking far up
  or down, sky-to-ground depth, a towering figure. A 1.5 panel whose
  figures sit in the bottom half with empty ground above wants to be 1
  or 0.6. Never taller than 1.5. The manuscript's "full" means at most 1.5,
  and only if it earns the height.
- **Row**: `front` by default, `mid` and `back` for depth; `closeup` for
  close (a standing figure from about the waist up); a number for
  anything in the air or seen from above (`panels.md`, Rows).
- **Backgrounds are light** (artist, 2026-11-08): `off-white` (light
  beige), `light-grey`, even `white`. Green grounds only for top views
  (03.01) and the land strip under a `sky` horizon (05.11's dry-grass);
  `dusty-pink` never. Panels still on dusty-pink or green swap in the
  revisit pass.
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
  closer (step the rows to `closeup`); the arriving character near the
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
  the shot deer just dies (05.13). A disguise thrown off is different:
  the same figure, revealed (05.20).
- **Sound travels as a picture**: a cry is the `sound-cry` burst with the
  shouter's face on its `face` anchor (`"on": "sound-cry#face"`),
  repeated across consecutive panels as it crosses the land — from
  the dying deer (05.13), over the forest (05.14), to the hut (05.15).
  The same device carries any far-off sound; its tail points back the way
  the sound came.
- **Action panels need action poses** (artist: the abduction was "too low
  action"): two figures standing near each other is a conversation, not a
  struggle. Use the falling, lunging and leaning poses (fallback-flung, lunge,
  leanback-armsback), opposed diagonals, a scale step for menace, mouth 3
  (05.20-05.22).
- **And the reverse — pace comes from the mood, not the errand** (artist,
  2026-11-08, 09.02): a search party *sets off walking*; running and
  leaping poses read as panic (11.08's rout). Walk/pass poses and quiet
  mouths unless something is chasing or burning.
- **Rows are the zoom**: consecutive panels step from `front` to
  `closeup` like a camera move (05.03 → 05.04). In a closeup, the second
  party of a dialogue stands lower and smaller behind for depth (05.05:
  Ravana's throne on a negative numeric row); at the same size the two
  kill the depth.
- **Aim the gazes**: `spine.head` adjust, + looks down, − looks up. A
  kneeling figure looks up at the one standing over them (05.07); seated
  and kneeling figures otherwise stare level through their partner's
  waist.
- **A raised arm hides the face**: a gesture toward the own face (showing
  a wound) reads as hiding it; throw the arms out instead and leave the
  face clear (05.06).
- **Not every character in every panel** (artist, 2026-11-07, golden
  deer): once the geography is set, show only whose beat it is. A pointed-at
  target can stay off-panel (05.09: Sita points past the edge, the deer
  is not shown); more, smaller panels beat one crowded one, as long as
  each panel's transition from the last is clear.
- **0.6 strips for reactions and partial views**: `closeup` in a 0.6
  panel gives waist-up figures that fill the strip (05.10, 05.12); use
  them often.
- **A chase is one distance**: put the chaser on the horizon row with the
  chased (05.10), not big in front running parallel to a far-off quarry.
- **No far props in a `closeup` strip**: a prop behind closeup figures
  shows only in part — the Ayodhya throne reduced to its red disc, a
  stray ball (02.04 rework). Let the previous panel carry the geography.
- **A lone full-body action in a 0.6 strip wants `front`, not
  `closeup`**: a closeup crops a single walker to a floating chest (02.07
  rework); closeup strips are for waist-up reactions of one or two faces.
- **`closeup` fits standing figures only**: a seated or kneeling figure
  sinks below the crop (10.08 rework). A close seated figure is `front`
  with a `scale` (10.08: 2.2) — the whole seated body fills the strip,
  still grounded.
- **A foreground band stands on `row: "floor"`** (artist, 2026-11-08,
  03.02): a foreground strip of ground (after the figures in the list)
  on the front row leaves a 3%-of-panel gap below it; `floor` is the
  panel's bottom edge at the front row's scale, flush whatever the rows
  do (a hand-tuned negative `lift` broke when the rows changed). And
  figures behind a rising band don't need
  per-figure `lift`s: full-size on the front row, the band's own slope
  staggers how deep each one sinks (the farther, the deeper). Walkers
  toward the reader (`view: front`) read larger and more alive there than
  small profile walkers (shrinking them all cut them down).

- **The throne goes in the `mid` row**, a row behind the people in front:
  in the front row it is as tall as the men and runs off the edge.
- **A figure in the air needs its legs closed and its toes pointed**
  (06.02–06.06): `step-hang` lifted off the ground is a man *walking on
  nothing*, because the base is a stride. Bring the legs together and
  point the feet with `adjust` — `right.leg.hip` 12, `knee` 8, `ankle`
  −45; `left.leg.hip` −2, `knee` 0, `ankle` −45 — and the same figure
  reads as flying.
- **Carrying a figure takes three things** (06.02–06.06): the carried one
  about 1.8 head-units ahead of the carrier at his chest height; the
  carrier's far arm across her (`shoulder` 70, `elbow` 40); and the
  carrier listed **after** her, so his arm draws in front of her body.
  Side by side at the same height they are two people standing, however
  the arms are bent.
- **`arch-overhead` loses both arms in side view**: they are bent back
  behind the head and vanish into the hair. The carried Sita is `view:
  "front"` — the arms read, and the open mouth faces the reader (06.02).
- **Mind what a swung weapon crosses**: a sword cut toward the side the
  carried figure is on goes straight through her (06.05 first try). Use
  the wind-up (blade back over the shoulder, 06.04) or the follow-through
  (arm up and forward, blade clear of everyone, 06.05); the severed wing
  and the falling bird tell the rest.
- **Skin over skin hides a face**: an arm of the same skin colour drawn
  across a face merges with it, and the face reads as distorted (an
  eye and half the mouth gone). In 06.02 Ravana's carrying arm (front
  view, at Sita's head height) lay over her face: lower the arm to cross
  her body below the chin and give the faces room (Sita `at` 0.45 → 0.5).
  Check every face against the limbs drawn after it.
- **Figures `on` a prop's anchor take the prop's scale**: three monkeys
  on `ledge#stand-left/#stand/#stand-right` at the ledge's own scale fill
  the panel. Scale the prop up and the figures down (0.45) for people on
  a rock seen from a distance (06.06).
- **Creatures have their own sizes**: golden deer 4.6 head-units to the
  antler tips; Jatayu 9 wingspan flying, 5 standing, `scale` 0.5 perched in
  a tree, 0.6–0.8 in the air beside a flying figure.
- **Colour clashes**: a gold crown vanishes against the gold throne back;
  check heads against what's behind them.
- **Top views** place props with a numeric `row` (named rows mean little
  from above): the height on the ground is the distance.
- **Render and look** at every panel (`node tools/render-panels.mjs NN`),
  at phone size: poses must read from the silhouette; fix before showing.
- Every committed panel must render without issues other than
  placeholders (`npm test` checks).

## Story and cast directions (from the artist)

- **Surpanakha** stays a rakshasi throughout: no fair form, no
  transformation. Always the `surpanakha` character, cloth `red-check`.
  She first watches the three from behind a tree (04.02).
- **Surpanakha before Ravana** opens the golden deer chapter, after the
  Lanka opener (05.03).
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
