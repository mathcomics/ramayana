# Picking poses

How a figure in a panel gets its pose, whoever writes the panel (the artist,
Claude, or later an LLM writing specs). The angles live in
`data/poses.json`; finding a pose uses `data/pose-index.json`; the
catalogue and the gap report are generated from both.

## The pose index

`data/pose-index.json` has one entry per pose (a test keeps it in step with
`poses.json`):

| Field | What |
|---|---|
| `desc` | What the body does, as seen. No emotions. |
| `ground` | What touches the ground: `feet`, `one-knee`, `seat`, `front`, `back`, `air`, `feet-hands`. |
| `hold` | Hands that can carry a prop as the pose stands (`right`, `left`). Poses made for a weapon carry it themselves (`arm.prop`: the sword or bow poses). |
| `use` | Story moments the pose serves (tags). Emotions are allowed here, never in names. |
| `like` | The nearest other poses: where to look when this one is almost right. |

`tags` lists the story moments (walk, point, grieve, shoot …) with the
words that call for each in a scene line. `notWords` lists words that start
like a tag word but aren't (Sita, ready). `wanted` lists poses the scenes
need that don't exist yet, in the order to make them, each with `until`:
what to use meanwhile.

`bases` names the distinct lower bodies (legs + `spine.lean` + tail):
one-word names set by the artist (stand, step, stepback, stepwide,
stepturn, leanback, leanfront, kneel, lunge …), each with a one-line
`desc` and the poses that carry it; the first listed is drawn in the
base catalogue (`node tools/base-catalogue.mjs`, published page in the
root CLAUDE.md). Every pose belongs to exactly one base (`npm test`
checks). `gestures` names the distinct upper bodies (arms incl. `prop`,
`spine.chest`, neck, head, mouth) in the same shape and under the same
rules, drawn on the step base in the gesture catalogue
(`node tools/gesture-catalogue.mjs`); a held prop and its angle keep two
gestures apart even where the hands match. A gesture may carry two
flags for the composer: `lean` (degrees added to the base's lean, for a
gesture that tips the whole body — the bow: 24) and `join: true`
(joined palms). The grouping was finished by the artist's eye, not a
distance measure: a stance of its own needs a real lean or a different
ground contact, not a slight stride or turn.

## Composition

Every pose is a base × a gesture, and is exactly what the grid derives —
there is no per-pose tuning of legs, lean, arms or chest. Composing takes
legs, tail and lean from the base's reference pose (the first listed),
arms, chest, neck, head and mouth from the gesture's; a gesture's `lean`
is added with the base's planted feet held by a two-bone leg solve
(a foot counts as planted below 0.4 head-units, so a hovering foot like
kneel's forward one keeps its place). `join` re-runs the hand solves per
base: the far hand laid on the near one in the side view, kept on the
midline in the front view. `spine.turn` belongs to neither half (rule 3).
Shared code: `tools/compose-lib.mjs`; the pose lab carries the same logic
inline.

    node tools/recompose.mjs <pose ...> | --base kneel | --gesture palms | --all [--dry]

re-derives poses from their coordinates and writes `data/poses.json`;
`--dry` prints the drift report (what a stored pose differs from the
grid). What stays a pose's own through a recompose: neck and head (gaze,
rule 3), mouth, tail and turn. So retuning a base's or gesture's
reference pose and recomposing its family propagates the change; then
look at the sheets and run `npm test`.

A new pose starts in the pose lab: the Base and Gesture pickers compose
a draft named `<base>-<gesture>`, read at phone size (rule 8) before it
is saved as a whole pose. Poses stay whole in `data/poses.json`; panels
name them, never a base and gesture pair.

When a pose is added, renamed or retuned so its meaning changes, its index
entry changes in the same commit. A pose made from `wanted` moves from
`wanted` to `poses`.

## Tools

    node tools/pose-catalogue.mjs [--who rama]   # out/pose-catalogue.png
    node tools/pose-gaps.mjs [--scenes] [04]     # docs/issues/missing-poses.md

- **Catalogue**: every pose, side and front, with its ground and moments,
  grouped by base; bases with only wanted poses show them. At about phone
  size: what reads in the catalogue reads in a panel.
- **Gaps**: counts the moments in `manuscript/scenes.md` against the poses
  that cover them and the panels' `needs`, and rewrites
  `docs/issues/missing-poses.md`. With `--scenes` it prints, per scene,
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
5. **Adjust a little, then make a pose.** `adjust` is for one-off changes
   of two or three joints. A gesture adjusted the same way twice becomes a
   pose (in the pose lab), with an index entry.
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
name everywhere: poses.json, the index, the panels, the labs (decided
2026-11-07; no friendly-name layer, no mapping). `step-hang` is standing
at ease, `step-bowdraw` the full draw, `lunge-sworddown` the lunging
cut, `kneel-bow` the kneeling bow. `npm test` checks the name equals the
pose's base and gesture in the index.

- **Base and gesture names** are single words (the test checks); the
  base says what carries the body, the gesture what the upper body does.
  New one-word names follow the artist's style: plain (`step`, `swing`,
  `palms`), or an image for a stance (`roof`, `ox`, `fool` from the
  fencing guards).
- **Never** an emotion or intent (`guard`, `throw`, `stagger`,
  `strike`), the head's direction or the mouth: those come from the
  scene, `turn` and `mouth`.
- A rename changes the poses, the index, the panels and the docs in one
  commit. Pose lab saves keep the name they were saved under; a save
  under an old name no longer matches a pose.
- `wanted` entries still carry older descriptive names; a wanted pose is
  named `<base>-<gesture>` when it is actually made.
