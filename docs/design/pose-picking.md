# Picking poses

How a figure in a panel gets its pose, whoever writes the panel (the artist,
Claude, or later an LLM writing specs). A pose is one base with one
gesture; the angles live in `data/bases.json` and `data/gestures.json`,
the pose list and what is used to find a pose in `data/poses.json`; the
catalogues and the gap report are generated from them.

## The data

**`data/bases.json`**: the distinct lower bodies. Per base a one-line
`desc`, `lean` (`spine.lean`), the `right` and `left` leg and the
`tail`. One-word names set by the artist (stand, step, stepback,
stepwide, stepturn, leanback, leanfront, kneel, lunge …). Base catalogue:
`node tools/base-catalogue.mjs` (each base with the hang gesture;
published page in the root CLAUDE.md).

**`data/gestures.json`**: the distinct upper bodies. Per gesture a
`desc`, `chest`, `neck`, `head`, `mouth` and the `right` and `left`
arm (a held `prop` included), under the same naming rules; a held prop
and its angle keep two gestures apart even where the hands match. Two
optional flags for the composer: `lean` (degrees added to the base's
lean, for a gesture that tips the whole body — the bow: 24) and
`join: true` (joined palms). Gesture catalogue:
`node tools/gesture-catalogue.mjs` (each gesture on the step base).

The grouping was finished by the artist's eye, not a distance measure: a
stance of its own needs a real lean or a different ground contact, not a
slight stride or turn.

**`data/poses.json`**: the pose list, alphabetical, one entry per pose
named `<base>-<gesture>`. A pose has no angles of its own, only what is
used to find it:

| Field | What |
|---|---|
| `desc` | What the body does, as seen. No emotions. |
| `ground` | What touches the ground: `feet`, `one-knee`, `seat`, `front`, `back`, `air`, `feet-hands`. |
| `hold` | Hands that can carry a prop as the pose stands (`right`, `left`). Poses made for a weapon carry it themselves (`arm.prop`: the sword or bow gestures). |
| `use` | Story moments the pose serves (tags). Emotions are allowed here, never in names. |
| `like` | The nearest other poses: where to look when this one is almost right. |

Beside `poses`: `tags` lists the story moments (walk, point, grieve,
shoot …) with the words that call for each in a scene line; `notWords`
lists words that start like a tag word but aren't (Sita, ready);
`wanted` lists poses the scenes need that don't exist yet, in the order
to make them, each with `until`: what to use meanwhile. `_angles`
documents the angle conventions (the same paths a panel's `adjust` uses).

`npm test` checks every pose names a known base and gesture, holds only
those fields, and that every base and gesture is used by some pose.

**The list is what has been reviewed, not what a panel may draw.** A
panel may name any `<base>-<gesture>` pair: a name not in the list is
composed when the panel is drawn (`src/scene.js`, `findPose`), with the
same solves as a listed pose, from the bases and gestures the assets
carry (`poseParts`). An unknown base or gesture is a panel issue naming
the wrong half; the figure falls back to `step-hang`. The list is what
the catalogue shows and the gap report and pose picking search: a pair
used by two panels or more is listed, with its finding fields (the gap
report names them, **list it**).

## Composition

Every pose is exactly its base and its gesture — nothing per pose
(decided 2026-11-10; the per-pose tails and gazes left over from before
were dropped, each base keeping one tail). `src/compose.js` composes it
when the assets load (`tools/lib.mjs` `loadPoses`), so the renderer, the
panels, the tests and the labs all get whole poses: legs, tail and lean
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

**The pose lab** edits the three separately. *Base* drags the legs, lean
and tail (shown with a gesture of choice, never one that tips the body),
*Gesture* the arms, prop, chest, head, mouth and the gesture's own lean
(shown on a base of choice); both show every pose using what is edited,
live, and a new one-word name saves a new base or gesture. *Pose* picks a
base and a gesture, and saves the combination with its finding fields —
or removes it from the list. Saves go to the lab's database (collections
`bases`, `gestures`, `poses`) and are merged by the `commit-pose-lab`
skill. A panel names a pose by its `<base>-<gesture>` name, listed or
not (above).

When a pose is added, or a base or gesture changes so a pose's meaning
changes, its entry in `data/poses.json` changes in the same commit. A
pose made from `wanted` moves from `wanted` to `poses`.

## Tools

    node tools/pose-catalogue.mjs [--who rama]   # out/pose-catalogue.png
    node tools/pose-gaps.mjs [--scenes] [04]     # docs/issues/missing-poses.md

- **Catalogue**: every pose, side and front, with its ground and moments,
  grouped by base; bases with only wanted poses show them. At about phone
  size: what reads in the catalogue reads in a panel.
- **Gaps**: counts the moments in `manuscript/scenes.md` against the poses
  that cover them and the panels' `needs`, and rewrites
  `docs/issues/missing-poses.md`, with the unlisted base-gesture pairs
  the panels use and their panels. With `--scenes` it prints, per scene,
  its moments and the candidate poses: the starting point for writing a
  section's panels.

## Rules

1. **Legs first.** What the scene says the body is doing (standing,
   walking, running, kneeling, sitting, lying, falling, in the air) sets
   the base. A pose with the wrong `ground` is wrong however good the arms
   are.
2. **Arms from the verb.** Within the base, pick by what the arms do
   (points, pleads, strikes, carries). Check `hold` when the figure holds a
   prop.
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
   the pose lab), and a pair used twice is listed in `data/poses.json`.
6. **No silent stand.** If nothing fits, use the nearest pose (`like`, or
   the wanted pose's `until`) and add a `needs` entry naming the missing
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
name everywhere: poses.json, the panels, the labs (decided 2026-11-07;
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
  the pose names in `poses.json`, the panels and the docs in one commit.
  Pose lab saves keep the name they were saved under; a save under an
  old name no longer matches.
- `wanted` entries still carry older descriptive names; a wanted pose is
  named `<base>-<gesture>` when it is actually made.
