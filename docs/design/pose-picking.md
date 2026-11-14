# Picking poses

How a figure in a panel gets its pose, whoever writes the panel (the artist,
Claude, or later an LLM writing specs). A pose is one base with one
gesture, and any pair is a pose: there is no list of poses. The angles
and what is used to find a pose live on the two halves, in
`data/bases.json` and `data/gestures.json`; the story moments and the
wanted poses in `data/poses.json`; the catalogues and the gap report are
generated from them.

## The data

**`data/bases.json`**: the distinct lower bodies. Per base a one-line
`desc`, its finding fields `ground` and `use` (below), `lean`
(`spine.lean`), the `right` and `left` leg and the `tail`. One-word names set by the artist (stand, step, stepback,
stepwide, stepturn, leanback, leanfront, kneel, lunge …). Base catalogue:
`node tools/base-catalogue.mjs` (each base with the hang gesture;
published page in the root CLAUDE.md).

**`data/gestures.json`**: the distinct upper bodies. Per gesture a
`desc`, its finding fields `hold` and `use` (below), `chest`, `neck`,
`head`, `mouth` and the `right` and `left`
arm (a held `prop` included), under the same naming rules; a held prop
and its angle keep two gestures apart even where the hands match. Two
optional flags for the composer: `lean` (degrees added to the base's
lean, for a gesture that tips the whole body — the bow: 24) and
`join: true` (joined palms). Gesture catalogue:
`node tools/gesture-catalogue.mjs` (each gesture on the step base).

The grouping was finished by the artist's eye, not a distance measure: a
stance of its own needs a real lean or a different ground contact, not a
slight stride or turn.

**Finding fields**, on the half they describe:

| Field | On | What |
|---|---|---|
| `desc` | both | What the body does, as seen. No emotions. A pose's description is its base's and its gesture's. |
| `ground` | base | What touches the ground: `feet`, `one-knee`, `seat`, `front`, `back`, `air`, `feet-hands`. |
| `hold` | gesture | Hands free to carry a prop (`right`, `left`). Gestures made for a weapon carry it themselves (`arm.prop`: the sword or bow gestures). |
| `use` | both | Story moments (tags) the half serves. A base carries the moments of the legs (stand, walk, run, leap, fly, fall, die, kneel, sit, ride, lie, sneak), a gesture those of the arms (point, threaten, strike, shoot, plead, grieve, fear …). A pose serves both lists. Emotions are allowed here, never in names. |

**`data/poses.json`**: `tags` lists the story moments with the words
that call for each in a scene line; `notWords` lists words that start
like a tag word but aren't (Sita, ready); `wanted` lists poses the
scenes need that don't exist yet, in the order to make them, each with
`until`: what to use meanwhile. `_angles` documents the angle
conventions (the same paths a panel's `adjust` uses).

`npm test` checks the halves' fields and tags, and that a wanted pose
doesn't exist yet.

**Any pair is a pose.** A panel names any `<base>-<gesture>`; it is
composed when the panel is drawn (`src/scene.js`, `findPose`) from the
bases and gestures the assets carry (`poseParts`). An unknown base or
gesture is a panel issue naming the wrong half; the figure falls back to
`step-hang`. The pose list (with per-pose finding fields and a "list it"
rule for pairs used twice) was dropped on 2026-11-14: its fields
belonged to the halves, and a third of the list was used by no panel.
Where a list of poses is shown (the pose catalogue, the pose lab's
gallery), it is the pairs the panels use, plus one example for each base
and gesture no panel uses yet (`tools/lib.mjs` `shownPairs`); the tests,
the render snapshot and the contact sheet draw one example per base
(`<base>-hang`) and per gesture (`step-<gesture>`).

## Composition

Every pose is exactly its base and its gesture — nothing per pose
(decided 2026-11-10; the per-pose tails and gazes left over from before
were dropped, each base keeping one tail). `src/compose.js` composes it
when a panel or a tool asks for it (`src/scene.js` `findPose`,
`tools/lib.mjs` `loadPoses`), so the renderer, the panels, the tests and
the labs all get whole poses: legs, tail and lean
from the base; arms, chest, neck, head and mouth from the gesture. A
gesture's `lean` is added with the base's planted feet held by a
two-bone leg solve (a foot counts as planted below 0.4 head-units, so a
hovering foot like kneel's forward one keeps its place). `join` re-runs
the hand solves per base: the far hand laid on the near one in the side
view, kept on the midline in the front view. Solves run on the male
proportions, so a pose is the same for every species. `spine.turn` is 0:
where a figure looks is the panel's (rule 3).

So retuning a base or a gesture changes every pose that uses it; look at
the catalogues and the panels that use them, and accept the render
snapshot after looking.

**The pose lab** edits bases and gestures. *Base* drags the legs, lean
and tail (shown with a gesture of choice, never one that tips the body)
and sets its ground and moments; *Gesture* the arms, prop, chest, head,
mouth and the gesture's own lean (shown on a base of choice) and sets
its free hands and moments. Both show the panels' poses using what is
edited, live, and a new one-word name saves a new base or gesture.
*Pose* only looks: it picks a base and a gesture and shows the pair, what
it is for and the panels using it; nothing is saved there. Saves go to
the lab's database (collections `bases`, `gestures`) and are merged by
the `commit-pose-lab` skill.

When a base or gesture changes so what it is for changes, its `use`,
`ground` or `hold` changes in the same commit. A wanted pose, once its
base and gesture exist, leaves `wanted`.

## Tools

    node tools/pose-catalogue.mjs [--who rama]   # out/pose-catalogue.png
    node tools/pose-gaps.mjs [--scenes] [04]     # docs/issues/missing-poses.md

- **Catalogue**: the poses the panels use (with how many panels) and one
  for each unused base and gesture, side and front, with ground and
  moments, grouped by base; bases with only wanted poses show them. At
  about phone size: what reads in the catalogue reads in a panel. The
  base and gesture catalogues show each half with its finding fields and
  the panels' poses using it.
- **Gaps**: counts the moments in `manuscript/scenes.md` against the
  bases and gestures that carry them and the panels' `needs`, and
  rewrites `docs/issues/missing-poses.md`. With `--scenes` it prints, per
  scene, its moments and the candidate bases and gestures: the starting
  point for writing a section's panels.

## Rules

1. **Legs first.** What the scene says the body is doing (standing,
   walking, running, kneeling, sitting, lying, falling, in the air) sets
   the base. A pose with the wrong `ground` is wrong however good the arms
   are.
2. **Arms from the verb.** Within the base, pick by what the arms do
   (points, pleads, strikes, carries): the gesture. Check the gesture's
   `hold` when the figure holds a prop.
3. **The head and mouth are not the pose.** Where the figure looks
   (`spine.turn`), how its head tilts and how wide its mouth is are
   set per figure in the panel. "Looks back", "shouts", "turns to Rama"
   never need a new pose.
4. **Emotion through the body, not the name.** Use the `use` tags:
   | Moment | First choice | Also |
   |---|---|---|
   | grief | step-holdhead | sit, kneel-bow |
   | fear | stepturn-armface | crouch-cross, stepback-armsout |
   | shock | stepback-armsout | sitback-propback, fallback-flung |
   | anger, threat | step-point (mouth 3) | leanfront-fists, step-akimbo |
   | pride, mockery | step-akimbo | leanback-armsback |
   | joy, victory | kneeup-armsup | leapup-reachup |
   | respect, pleading | kneel | step-palms, kneel-palms |
5. **Pair before adjusting; adjust a little, then make a gesture.** A
   different upper body on the same legs is another gesture on that base:
   name the pair (`stepwide-unicorn`) rather than rebuilding the arms with
   `adjust`. `adjust` is for one-off changes of two or three joints. A
   gesture adjusted the same way twice becomes a gesture of its own (in
   the pose lab).
6. **No silent stand.** If nothing fits, use the nearest pose (the
   catalogue, or the wanted pose's `until`) and add a `needs` entry naming the missing
   pose. `step-hang` is only right when the figure really just stands.
7. **Vary the main figure, repeat the crowd.** The figure the panel is
   about gets the most telling pose; panels next to each other avoid giving
   it the same one. Background crowds may repeat a pose (mirrored by
   `facing`, varied by `cloth`).
8. **Read the silhouette.** At phone size a pose must read from its
   outline: check the panel render. Arms crossing the body vanish; arms
   away from the body read. If the moment doesn't read, pick a bigger
   gesture or the front view.
9. **Front view on purpose.** Side view is the default. Use `view: front`
   for confronting the reader, crouching or flexing (style bible §6), and
   check the front render: some poses don't project well yet
   (`docs/issues/problem-poses.md`).

## Names

**Every pose is named `<base>-<gesture>`** — the composite name, its one
name everywhere: the panels, the labs, the docs (decided 2026-11-07;
no friendly-name layer, no mapping). `step-hang` is standing
at ease, `step-bowdraw` the full draw, `lunge-longpoint` the sword
level at the opponent, `kneel-bow` the kneeling bow. The name is the pose's only link to
its base and gesture.

- **Base and gesture names** are single words (the test checks); the
  base says what carries the body, the gesture what the upper body does.
  New one-word names follow the artist's style: plain (`step`, `swing`,
  `palms`), or an image for a stance (`roof`, `ox`, `fool` from the
  fencing guards). The two-handed sword gestures are the longsword
  guards, named after them; each `desc` gives the guard it comes from
  (Ochs, Pflug, vom Tag …).
- **Never** an emotion or intent (`guard`, `throw`, `stagger`,
  `strike`), the head's direction or the mouth: those come from the
  scene, `turn` and `mouth`.
- A rename of a base or gesture changes `bases.json` or `gestures.json`,
  the pose names in the panels and the docs in one commit.
  Pose lab saves keep the name they were saved under; a save under an
  old name no longer matches.
- `wanted` entries still carry older descriptive names; a wanted pose is
  named `<base>-<gesture>` when it is actually made.
