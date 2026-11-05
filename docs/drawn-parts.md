# Drawn parts (experiment, branch `drawn-parts`)

Bodies built from the artist's own outlines instead of rule-based shapes.
The skeleton, poses, faces and the derived front view stay as they are;
only the shapes change. For now all three species use the male parts.

## The parts file

`data/parts/<id>.svg` (100 px = 1 head-unit, ground at y = 0), in the
renderer's frame: the figure faces right and the front-view limbs are its
near side (picture-right). Every part is at rotation 0 (limbs hang straight
down, neck up, feet flat) and parts that share a joint sit on the same
anchor: the four torsos on one pelvis (one layer each; show one at a
time), all hands on the wrist, the front foot on the ankle. The side view
stands to the right on its own pelvis (side foot on `side-ankle`), with a
locked guide layer showing how the shared limbs hang on the side torso
(not read back; limbs are edited in the front layer).
`node tools/export-parts.mjs` writes this file from `data/parts.json`. By
layer and label:

| Layer | Parts |
|---|---|
| `front` | `torso`, `neck`, `upper-arm`, `forearm`, `hand-fist`, `hand-out`, `hand-in`, `hand-point`, `thigh`, `shin`, `foot` |
| `side` | `torso`, `foot` |
| `front-bend`, `side-bend` | `torso`, bent forward |
| `anchors` | circles `shoulder`, `elbow`, `wrist`, `hip`, `knee`, `ankle`, `neck-base`, `neck-top`, `side-ankle`  |
| `guide` | ignored |

The four torsos need the same number of edges in the same order round
the outline (start node and straight-vs-curved don't matter); the two
feet likewise.

`node tools/import-parts.mjs` → `data/parts.json`. A species uses it with
`"parts": "male"` in `data/species/<id>.json`.

## How a figure is built (`src/parts.js`)

- Limbs are placed rigidly on their bones (anchor to anchor); far limbs
  in front view are mirrored. Side view flips the upper arm and shin
  across the bone, so the curve is on the triceps and calf.
- The torso blends four keys: front ↔ side (turn) and straight ↔ bent
  (bend). The bend swings round the waist (polar blend); `spine.chest`
  sets it (the drawn bend ≈ 71°; beyond, or arching back, extrapolates).
  Front view: the bend follows the torso's shortening from the side pose.
- Shoulders, hips and neck are pinned to torso nodes, so they follow the
  turn and bend.
- No loincloth: the lower cloth covers the thighs only; the torso is drawn
  over the legs.
- Not yet: monkey tail, per-species parts.
