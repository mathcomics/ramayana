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
3. For each kind of scene in the chapter, find its tag in
   `panels/layouts.md` (an opener, a throne, a crowd running, a spy, a
   top view …), then render and follow the **approved reference panels**
   carrying it: `grep -rl '"tags".*"frieze"' panels/`. The rules behind
   them: `composition.md`. Tagged panels are artist-reviewed and locked:
   never rework one without the artist's consent (`panels/CLAUDE.md`).
4. Check the chapter opener (`composition.md`, Chapter openers).
5. A kind of scene with no tag yet: follow `composition.md` alone, and
   offer the panel to the artist for tagging once it is reviewed.

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
  and only if it earns the height. Never lower than 0.6: a 0.4 strip was
  tried for 04.07–04.13 and read too small while scrolling (artist,
  2026-11-12) — a run of fast action is a run of 0.6 strips, figures
  overlapping as they must.
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
- **Negative for the dramatic beat** (artist, 2026-11-15): a
  transformation and the death of a major character get a panel with
  `"mode": "negative"` — black ground, white silhouettes. The silhouette
  hides who is who, so it carries a change of shape (05.19a: the ascetic
  becoming Ravana, between 05.19 and 05.19b). Keep it to one panel per
  beat; the panels either side are in colour.
- **An offering is held out**: the thing offered sits `on` the giver's
  hand (`"on": "sita#hand-right"`) on a `handslow` gesture, and the two
  stand apart (05.18a: fruit, a red `rock-circle` at `scale` 0.15; the
  ascetic's bowl, `half-circle`).
- **Sound travels as a picture**: a cry is the `sound-cry` burst with the
  shouter's face on its `face` anchor (`"on": "sound-cry#face"`), always
  in front view (`"view": "front"`, the artist: the face cries out at
  the reader, not along the tail), repeated across consecutive panels as it crosses the land — from
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
- **A fight at a distance is told across panels, not in one** (artist,
  2026-11-11, 04.08–04.13): an archer and his targets in one panel stand
  far too close. Give each side its own 0.6 strip, the attackers
  running in from one edge and the archers waiting at the other, with
  the arrows crossing the panel edge (they shoot left, the struck fall
  back from the right), then the rout the way they came.
- **Weapons carried at a run are held up**: on `run-pump` a club or
  sword at `angle` 60 in the forward hand is brandished; at 150 it
  lies across the chest like a stick (04.08).
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
  do (a hand-tuned negative `lift`, now `nudge`, broke when the rows changed). And
  figures behind a rising band don't need
  per-figure vertical `nudge`s: full-size on the front row, the band's own slope
  staggers how deep each one sinks (the farther, the deeper). Walkers
  toward the reader (`view: front`) read larger and more alive there than
  small profile walkers (shrinking them all cut them down).

- **A near tree trunk is clipped at both ends** (artist, 2026-11-12):
  `tree-trunk` on `closeup` (or `front` scaled up), so it leaves the
  panel at the top and the bottom — a frame the scene is seen past, not a
  log standing in the clearing. Put it half off the edge (`at` 0 or
  below) so it frames without hiding the figures; two, one mirrored, make
  a window onto something seen through the trees (03.03a). With
  `trees-side` on the `back` row behind and a `foreground` band before
  the walkers it gives a forest in three depths (03.02a).

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
- **Size by `row`, not `scale`** (artist, 2026-11-16): distance and size
  come from the row (a named row or a number); `scale` is for the unusual
  case where the right thing to do is unclear (a giant, a figure in a
  close strip, a prop seen from far off). A panel full of `scale` values
  is a sign the rows are wrong. A prop that always needs the same `scale`
  gets its true size in the drawing instead (`data-height`, as `steps`,
  `hut-top`, `trees-top`).
- **Figures `on` a prop's anchor take the prop's row, not its scale**
  (2026-11-13): a prop's `scale` says *this* rock or ladder is bigger, not
  that it is nearer, so it leaves the people on it alone — resizing a rock
  in the lab no longer resizes its sitters (10.08's Sita was half-size
  because her rock was). For people on a prop seen from a distance, give
  the figures their own `scale` (06.07's monkeys at 0.25 on a rock at 2.5).
  A `face` anchor still takes the prop's size: the head is part of the burst.
- **Carried things go `on` the carrier** (2026-11-13): `"on": "hanuman#hands"`
  (also `#hand-right`, `#hand-left`, `#head`, `#shoulder`), not an `at`/`row`
  lined up by eye — it then follows the pose. List the rock before the
  lifter so his hands are in front of it (13.02, 13.04). A carried prop
  is sized by the carrier's **row**, not the carrier's `scale`: when the
  figure is scaled up in a close strip, scale the prop up with it (10.10:
  Sita at 1.7, the ring at 0.27, not 0.15), or it shrinks to a speck. A
  figure on a prop's `stand` anchor (`"on": "branch#stand"`, 10.08) stands
  where the drawing says, with no `nudge` to tune.
- **Seated figures in a 0.6 strip** stay at `scale` 1.6–1.7 on the
  `front` row: at 2 and above the head leaves the top (10.09a–10.11a).
- **Rocks** (artist, 2026-11-10): build rocky ground from
  `rock-circle`, `rock-square` and `rock-rectangle`, often a big one with
  a smaller one before it (`composition.md`, Kishkindha and rocks).
- **`on` lands a pose's lowest point on the anchor**: on a rock's top
  `seat`, `sit-armknee` stands on its raised foot with the hips hovering,
  and `chair-armrest` hangs its legs in the air (07.09 first tries). To
  sit on a rock, put `chair-armrest` on the ground and draw a
  `rock-circle` (scale ~0.75) behind it at hip height.
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
  **Maricha** = `raxas_m1` (id `maricha`).
  **The ascetic** (Ravana disguised) = `raxas_m2` (id `ascetic`) until
  Ravana's own disguise exists.
- Generic monkeys and rakshasas vary by `cloth` (colour, pattern), not by
  new characters. **A rakshasa's cloth is only ever `red-check`,
  `red-stripe` or `red-diamond`** (artist, 2026-11-14) — never `orange`,
  `yellow` or plain `red`; three red patterns are the rakshasa variety.
- **Kumbhakarna is never a character figure** (artist, 2026-11-14): a
  scaled-up `raxas_*` laid down with `rotate` was tried for chapter 14
  and rejected. He is only ever his hand-drawn parts — `giant-face-side`,
  `giant-face-front`, `giant-feet`, `giant-fist`, `giant-grab`,
  `giant-lie-waist` — each cut off at the frame edge it enters from,
  all at one skin (`body: "#9a7a7a"`, the waist's own). Lying on his
  back, face up: `giant-face-side` `facing: "left"`, `rotate: 90`, the
  neck leaving the left edge.
- **The giant's parts carry their true size; panels never `scale` them**
  (artist, 2026-11-14). Each drawing's `data-height` puts it on one
  giant, with `giant-grab` as the reference (it is the size the locked
  14.05 uses) and the others matched to it by forearm and hand. Place
  them by row (`front` mostly, `closeup` for a close face), with the
  rakshasas and monkeys beside them at their own size too: a man is
  about as tall as the giant's head.

## After writing

- `needs` lists everything missing; `node tools/pose-gaps.mjs` refreshes
  `docs/issues/missing-poses.md`.
- `npm test` (accept intended render changes with `UPDATE_SNAPSHOT=1`
  after looking), commit, push, republish the panel lab.
- If panels were added, moved or renumbered, say so: the manuscript is
  kept in a separate conversation and needs the same change.
