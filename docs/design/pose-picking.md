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
| `hold` | Hands that can carry a prop as the pose stands (`near`, `far`). Poses made for a weapon carry it themselves (`arm.prop`: the sword or bow poses). |
| `use` | Story moments the pose serves (tags). Emotions are allowed here, never in names. |
| `like` | The nearest other poses: where to look when this one is almost right. |

`tags` lists the story moments (walk, point, grieve, shoot …) with the
words that call for each in a scene line. `notWords` lists words that start
like a tag word but aren't (Sita, ready). `wanted` lists poses the scenes
need that don't exist yet, in the order to make them, each with `until`:
what to use meanwhile.

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
   (`look`, `spine.turn`), how its head tilts and how wide its mouth is are
   set per figure in the panel. "Looks back", "shouts", "turns to Rama"
   never need a new pose.
4. **Emotion through the body, not the name.** Use the `use` tags:
   | Moment | First choice | Also |
   |---|---|---|
   | grief | stand-hand-on-head | sit, kneel-bow (wanted) |
   | fear | stand-arm-over-face | crouch-arms-over-head, stand-stagger-back |
   | shock | stand-stagger-back | sit-lean-back, fall-back |
   | anger, threat | stand-point (mouth 3) | stand-guard, stand-hands-on-hips |
   | pride, mockery | stand-hands-on-hips | stand-lean-back |
   | joy, victory | stand-arms-up-knee-up | leap-reach |
   | respect, pleading | kneel | stand-palms-joined (wanted) |
5. **Adjust a little, then make a pose.** `adjust` is for one-off changes
   of two or three joints. A gesture adjusted the same way twice becomes a
   pose (in the pose lab), with an index entry.
6. **No silent stand.** If nothing fits, use the nearest pose (`like`, or
   the wanted pose's `until`) and add a `needs` entry naming the missing
   pose. `stand` is only right when the figure really just stands.
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

Names stay as in style bible §7: `<base>-<what the body does>`, from the
fixed base list, arms before legs, nothing about emotion, head or mouth.
Additions:

- One arm: `arm` / `hand`; both: `arms` / `hands`.
- A suffix for a variant of the same action: `-low` (crouched), `-back`
  (weight or body back).
- A prop names a pose only when the body's shape is made for it
  (`stand-shoot-bow`, `walk-carry-shoulder`); the panel still places the
  prop.
- Renaming a pose orphans its pose lab saves (saved by name), so names
  change only when the artist asks, together with the panels that use them.
