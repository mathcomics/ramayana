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
  forest in 05.09 shows the hut again before the deer appears (artist,
  2026-11-07).
- **Height** (`tall`): 1 and 0.6 mostly (artist, 2026-11-07); 1.5 **only when the
  height is used in a particular way** — a fall or flight, looking far up
  or down, sky-to-ground depth, a towering figure. A 1.5 panel whose
  figures sit in the bottom half with empty ground above wants to be 1
  or 0.6. Never taller than 1.5. The manuscript's "full" means at most 1.5,
  and only if it earns the height. Never lower than 0.6: a 0.4 strip was
  tried for 04.11–04.17 and read too small while scrolling (artist,
  2026-11-12) — a run of fast action is a run of 0.6 strips, figures
  overlapping as they must.
- **Depth**: how far away, which sets the size: `front` by default,
  `mid`, `back` or a number between for distance; `closeup` for close (a
  standing figure from about the waist up). Anything in the air stands at
  the depth of the ground under it and is lifted with `nudge`; a top view
  is `"camera": "top"` with numeric depths up the ground (`panels.md`,
  Depth).
- **Backgrounds are light** (artist, 2026-11-08): `off-white` (light
  beige), `light-grey`, even `white`. Green grounds only for top views
  (03.01) and the land strip under a `sky` horizon (05.12's dry-grass);
  `dusty-pink` never. Panels still on dusty-pink or green swap in the
  revisit pass.
- **Poses**: legs first, arms from the verb; head direction (`turn`) and
  mouth are not poses; no silent `step-hang` (pose-picking rules). A missing
  pose goes in `needs` as `pose: <wanted name> (...): <stand-in> for now`.
- **Props**: use the drawn ones (`panels.md`, Props). Placeholders stay
  boxes and get a `needs` entry `prop: ...`.
- **Distance**: something far away goes on the horizon (`sky`, depth
  `horizon`), small, with nothing in between.
- **Seated** on a throne: `on: "throne"` with a sitting pose, never
  standing in front of it.

## Lessons from reviews

- **Establish a new place and its key figure as a sequence, not one
  panel** (artist, 2026-11-07, chapter 05): location from far; the figure
  in their place, far (a king on his throne, front view); the same
  closer (step the depth to `closeup`); the arriving character near the
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
  the shot deer just dies (05.15). A disguise thrown off is different:
  the same figure, revealed (05.25).
- **Negative for the dramatic beat** (artist, 2026-11-15): a
  transformation and the death of a major character get a panel with
  `"mode": "negative"` — black ground, white silhouettes. The silhouette
  hides who is who, so it carries a change of shape (05.23: the ascetic
  becoming Ravana, between 05.22 and 05.24). Keep it to one panel per
  beat; the panels either side are in colour. The deer struck by Rama’s arrow gets
  one too (05.14, before it sinks in 05.15; artist, 2026-11-17).
- **A giant part shown whole is a severed part** (artist, 2026-11-18):
  the giant props (`giant-grab`, `giant-fist`, `giant-feet`) are drawn
  cut off at one end, meant to run off the panel edge. Scaled down so
  the cut end shows inside the frame, the part reads as cut off — a
  dismemberment, in negative (14.21a–c: hand, fist and foot falling,
  the arrow flying on past the cut).
- **An offering is held out**: the thing offered sits `on` the giver's
  hand (`"on": "sita#hand-right"`) on a `handslow` gesture, and the two
  stand apart (05.21: fruit, a red `rock-circle` at `scale` 0.15; the
  ascetic's bowl, `half-circle`).
- **Sound travels as a picture**: a cry is the `sound-cry` burst with the
  shouter's face on its `face` anchor (`"on": "sound-cry#face"`), always
  in front view (`"view": "front"`, the artist: the face cries out at
  the reader, not along the tail), repeated across consecutive panels as it crosses the land — from
  the dying deer (05.15), over the forest (05.16), to the hut (05.17).
  The same device carries any far-off sound; its tail points back the way
  the sound came.
- **A feeling is a picture in a thought bubble** (artist, 2026-11-16):
  `bubble-thought` high beside the thinker's head, its trail of circles
  leading down to it, with the feeling `on` its `inside` anchor —
  `icon-angry` for anger and distress (Kaikeyi, 01.09), `heart` for
  love (Surpanakha, 03.12), `icon-explode` for rage or shock (Ravana,
  11.12). Size the bubble with `scale` so the feeling
  reads at phone size (0.85–1.3 in a close strip).
- **Action panels need action poses** (artist: the abduction was "too low
  action"): two figures standing near each other is a conversation, not a
  struggle. Use the falling, lunging and leaning poses (fallback-flung, lunge,
  leanback-armsback), opposed diagonals, a scale step for menace, mouth 3
  (05.25-05.26).
- **And the reverse — pace comes from the mood, not the errand** (artist,
  2026-11-08, 09.03): a search party *sets off walking*; running and
  leaping poses read as panic (11.25's rout). Walk/pass poses and quiet
  mouths unless something is chasing or burning.
- **Depth is the zoom**: consecutive panels step from `front` to
  `closeup` like a camera move (05.04 → 05.05). In a closeup, the second
  party of a dialogue stands lower and smaller behind for depth (05.06:
  Ravana's throne at a negative depth, below the frame); at the same size the two
  kill the depth.
- **Aim the gazes**: `spine.head` adjust, + looks down, − looks up. A
  kneeling figure looks up at the one standing over them (05.08); seated
  and kneeling figures otherwise stare level through their partner's
  waist.
- **A raised arm hides the face**: a gesture toward the own face (showing
  a wound) reads as hiding it; throw the arms out instead and leave the
  face clear (05.07).
- **Not every character in every panel** (artist, 2026-11-07, golden
  deer): once the geography is set, show only whose beat it is. A pointed-at
  target can stay off-panel (05.10: Sita points past the edge, the deer
  is not shown); more, smaller panels beat one crowded one, as long as
  each panel's transition from the last is clear.
- **Two sides seeing each other across a distance: one side per panel**
  (artist, 2026-11-18, 13.01a–b): watchers on Lanka's ledge pointing out
  to sea and the army arriving would need two scales in one picture;
  the perspective does not work. Use the same place (11.01's ledge) for
  both panels, the watchers in one, the arrivals in the next.
- **A fight at a distance is told across panels, not in one** (artist,
  2026-11-11, 04.12–04.17): an archer and his targets in one panel stand
  far too close. Give each side its own 0.6 strip, the attackers
  running in from one edge and the archers waiting at the other, with
  the arrows crossing the panel edge (they shoot left, the struck fall
  back from the right), then the rout the way they came.
- **Weapons carried at a run are held up**: on `run-pump` a club or
  sword at `angle` 60 in the forward hand is brandished; at 150 it
  lies across the chest like a stick (04.12).
- **0.6 strips for reactions and partial views**: `closeup` in a 0.6
  panel gives waist-up figures that fill the strip (05.11, 05.13); use
  them often.
- **A chase is one distance**: put the chaser at depth `horizon` with the
  chased (05.11), not big in front running parallel to a far-off quarry.
- **No far props in a `closeup` strip**: a prop behind closeup figures
  shows only in part — the Ayodhya throne reduced to its red disc, a
  stray ball. Let the previous panel carry the geography.
- **A lone full-body action in a 0.6 strip wants `front`, not
  `closeup`**: a closeup crops a single walker to a floating chest;
  closeup strips are for waist-up reactions of one or two faces.
- **`closeup` fits standing figures only**: a seated or kneeling figure
  sinks below the crop (10.16 rework). A close seated figure is `front`
  with a `scale` (10.16: 2.2) — the whole seated body fills the strip,
  still grounded.
- **A foreground prop strip stands on `depth: "floor"`** (artist,
  2026-11-08, 03.02): a strip of ground drawn as a prop (after the figures
  in the list) at `front` leaves a 3%-of-panel gap below it; `floor` is
  the panel's bottom edge at front size, flush whatever the depths do (a
  hand-tuned negative `lift`, now `nudge`, broke when the row sizes changed). And
  figures behind a rising band don't need
  per-figure vertical `nudge`s: `on` the band, the band's own slope
  staggers how deep each one sinks (the farther, the deeper). Walkers
  toward the reader (`view: front`) read larger and more alive there than
  small profile walkers (shrinking them all cut them down).

- **A near tree trunk is clipped at both ends** (artist, 2026-11-12):
  `tree-trunk` on `closeup` (or `front` scaled up), so it leaves the
  panel at the top and the bottom — a frame the scene is seen past, not a
  log standing in the clearing. Put it half off the edge (`at` 0 or
  below) so it frames without hiding the figures; two, one mirrored, make
  a window onto something seen through the trees (06.19). With
  `trees-side` at depth `back` behind and a `foreground` band before
  the figures it gives a forest in three depths (06.19).

- **The throne goes at depth `mid`**, behind the people in front: at
  `front` it is as tall as the men and runs off the edge.
- **A figure in the air needs its legs closed and its toes pointed**
  (06.03–06.09): `step-hang` lifted off the ground is a man *walking on
  nothing*, because the base is a stride. Bring the legs together and
  point the feet with `adjust` — `right.leg.hip` 12, `knee` 8, `ankle`
  −45; `left.leg.hip` −2, `knee` 0, `ankle` −45 — and the same figure
  reads as flying.
- **Carrying a figure takes three things** (06.03–06.09): the carried one
  about 1.8 head-units ahead of the carrier at his chest height; the
  carrier's far arm across her (`shoulder` 70, `elbow` 40); and the
  carrier listed **after** her, so his arm draws in front of her body.
  Side by side at the same height they are two people standing, however
  the arms are bent.
- **`arch-overhead` loses both arms in side view**: they are bent back
  behind the head and vanish into the hair. The carried Sita is `view:
  "front"` — the arms read, and the open mouth faces the reader (06.03).
- **Mind what a swung weapon crosses**: a sword cut toward the side the
  carried figure is on goes straight through her (06.06 first try). Use
  the wind-up (blade back over the shoulder, 06.05) or the follow-through
  (arm up and forward, blade clear of everyone, 06.06); the severed wing
  and the falling bird tell the rest.
- **Skin over skin hides a face**: an arm of the same skin colour drawn
  across a face merges with it, and the face reads as distorted (an
  eye and half the mouth gone). In 06.03 Ravana's carrying arm (front
  view, at Sita's head height) lay over her face: lower the arm to cross
  her body below the chin and give the faces room (Sita `at` 0.45 → 0.5).
  Check every face against the limbs drawn after it.
- **Size by `depth`, not `scale`** (artist, 2026-11-16): distance and size
  come from the depth (a name or a number); `scale` is for the unusual
  case where the right thing to do is unclear (a giant, a figure in a
  close strip, a prop seen from far off). A panel full of `scale` values
  is a sign the depths are wrong. A prop that always needs the same `scale`
  gets its true size in the drawing instead (`data-height`, as `steps`,
  `hut-top`, `trees-top`).
- **Figures `on` a prop's anchor take the prop's depth, not its scale**
  (2026-11-13; the language does it): a prop's `scale` says *this* rock or ladder is bigger, not
  that it is nearer, so it leaves the people on it alone — resizing a rock
  in the lab no longer resizes its sitters (10.16's Sita was half-size
  because her rock was). For people on a prop seen from a distance, give
  the figures their own `scale` (06.12's monkeys at 0.25 on a rock at 2.5).
  A `face` anchor still takes the prop's size: the head is part of the burst.
- **Carried things go `on` the carrier** (2026-11-13): `"on": "hanuman#hands"`
  (also `#hand-right`, `#hand-left`, `#head`, `#shoulder`), not an `at`/`depth`
  lined up by eye — it then follows the pose. List the rock before the
  lifter so his hands are in front of it (12.20). A carried prop
  is sized by the carrier's **depth**, not the carrier's `scale`: when the
  figure is scaled up in a close strip, scale the prop up with it, or it
  shrinks to a speck. The ring (drawn to the giant fist's scale, 2026-11-16)
  is placed at `scale` 2 beside the giant hands at 0.62 (09.02a) and in the
  close strips (10.31). A
  figure on a prop's `stand` anchor (`"on": "branch#stand"`, 10.16) stands
  where the drawing says, with no `nudge` to tune.
- **Seated figures in a 0.6 strip** stay at `scale` 1.6–1.7 on the
  at depth `front`: at 2 and above the head leaves the top (10.29–10.33).
- **Whatever stands on something touches it** (artist, 2026-11-17,
  12.19–12.22): the commonest reason a panel of chapters 11–14 failed
  was not the idea but a thing beside, under or behind what it should be
  on. From above, a monkey on a stone has the stone's `at` and a `depth`
  just over the stone's, and the stone is bigger than the monkey
  (`scale` 0.8); a line of stones runs on **off the far edge**, not to
  a stop in mid-water; the surf (`wave-top`) breaks in a **gap between
  two stones**, never under one (12.22). After rendering, check each
  `on` and each "stands on / holds / sits in" of the scene line against
  the picture.
- **A carried rock needs raised arms** (12.20): on a pumping run
  (`run-pump`, `runlow-pumplow`) `#hands` is the middle of the chest
  and the rock hides behind the body. Carriers take the `reachup`
  gesture on any walking or running base, the rock `on` their `#hands`
  and listed before them.
- **Walking away from the reader is a back view**: `view: "front"` with
  `turn: 180` (the monkey carrying a rock out along the stones toward
  Lanka, in a 12.21 since deleted). A line that leads into the picture is walked into the
  picture; and the stones of a receding line touch, each a little
  smaller and higher than the last.
- **A line of receding stones carries a receding line of people**
  (artist, 2026-11-19, 12.26): a figure `on` each stone takes the stone's
  depth, so it shrinks with it; a narrow stance (`step`) keeps the feet
  on the stone's visible top; listed far to near. A new line is one
  entry: `repeat` with `to` (`panels.md`, Props).
- **A head alone is `head-alone`** (2026-11-19): an empty prop with one
  full-size `face` anchor — `{ "prop": "head-alone", "id": "h1", … }`
  then `{ "character": "ravana", "pose": "stand-hang", "on": "h1#face" }`;
  place it with `at`/`depth`/`scale`/`rotate`. A cut-off head flying or
  on the ground, a head growing back, more heads (17.11–17.18). The body
  can't lose its own head: frame it out instead — the figure scaled up
  until the top edge cuts it at the shoulders (17.12: `scale` 2.35,
  pushed down below the bottom edge in a 0.6 strip). A `nudge` does not do it.
- **A body lying dead**: `liefront-armsdown` with the legs straightened
  (`adjust` `right.leg.hip`, `knee`, `left.leg.hip`, `knee` all 0) and
  `rotate` −15 facing right to lie level (17.02); the base alone
  keeps a flier's bent knees.
- **Nobody rides on anybody's shoulders** (artist, 2026-11-17): not
  realistic. A draft of 12.25 had Rama on Hanuman; they all walk over
  the bridge.
- **Runners before a giant part need a ground**: a `foreground` band
  under their feet, over the bottom of the giant (14.12); on the bare
  gradient they float in front of the face.
- **A wall is crowded** (13.03): five defenders along the top in front
  view, different cloths and arms, one with a rock overhead, and rows
  of dark stones down the wall face (`repeat`). Three men and three
  stones read as empty.
- **A talk told by gesture passes the wordless test** (artist,
  2026-11-17, 12.04–12.07): a run of close strips — pleading, the
  pointing arm, the turned back — tells a quarrel and a dismissal. The
  test cuts what *only* words could tell, not every exchange.
- **Rocks** (artist, 2026-11-10): build rocky ground from
  `rock-circle`, `rock-square`, `rock-rectangle` and `rock-triangle` (a
  peak, with `hand`, `stand`, `stand-left`, `stand-right` anchors), often a big one with
  a smaller one before it (`composition.md`, Kishkindha and rocks).
- **`on` lands a pose's lowest point on the anchor**: on a rock's top
  `seat`, `sit-armknee` stands on its raised foot with the hips hovering,
  and `chair-armrest` hangs its legs in the air (07.10 first tries). To
  sit on a rock, put `chair-armrest` on the ground and draw a
  `rock-circle` (scale ~0.75) behind it at hip height.
- **Creatures have their own sizes**: golden deer 4.6 head-units to the
  antler tips; Jatayu 9 wingspan flying, 5 standing, `scale` 0.5 perched in
  a tree, 0.6–0.8 in the air beside a flying figure.
- **Colour clashes**: a gold crown vanishes against the gold throne back;
  check heads against what's behind them.
- **Top views** are `"camera": "top"`, props placed with a numeric
  `depth` (named depths mean little from above): the height on the
  ground is the distance, and nothing shrinks.
- **Read back, then render and look**: `node tools/describe-panel.mjs NN
  --problems` first — every `!` is fixed or knowingly kept (a figure hidden
  in a cloud on purpose), every `?` checked (`panels.md`, Reading a panel
  back): it catches the feet that miss their stone and the covered faces
  the reviews keep finding. Then render (`node tools/render-panels.mjs NN`)
  and look at every panel at phone size: poses must read from the
  silhouette; fix before showing.
- Every committed panel must render without issues other than
  placeholders (`npm test` checks).

## Story and cast directions (from the artist)

- **Surpanakha** stays a rakshasi throughout: no fair form, no
  transformation. Always the `surpanakha` character, cloth `red-check`.
  She first watches the three from behind a tree (04.02).
- **Surpanakha before Ravana** opens the golden deer chapter, after the
  Lanka opener (05.04).
- **Khara** = `raxas_m1` (id `khara`, cloth `red-diamond`).
  **Maricha** = `raxas_m1` (id `maricha`).
  **The ascetic** (Ravana disguised) = `raxas_m2` (id `ascetic`) until
  Ravana's own disguise exists.
- **Bali** = `sugriva` (id `bali`), with no `cloth` override (artist,
  2026-11-16): the brothers look the same in body and cloth. In the
  fights Sugriva alone wears the garland flying back from his neck
  (`"wear": "garland"`), the one mark that tells them apart.
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
  14.14 uses) and the others matched to it by forearm and hand. Place
  them by depth (`front` mostly, `closeup` for a close face), with the
  rakshasas and monkeys beside them at their own size too: a man is
  about as tall as the giant's head. When a part reads too small, its
  drawing grows (`giant-fist`: `data-height` 5 → 7 and a line as thick
  as `giant-grab`'s, artist 2026-11-17, 14.13), not the panel's `scale`.

## After writing

- `needs` lists everything missing; `node tools/pose-gaps.mjs` refreshes
  `docs/issues/missing-poses.md`.
- `npm test` (accept intended render changes with `UPDATE_SNAPSHOT=1`
  after looking), commit, push, republish the panel lab.
- If panels were added, moved or renumbered, say so: the manuscript is
  kept in a separate conversation and needs the same change.
