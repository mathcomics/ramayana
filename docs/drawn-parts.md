# Drawn parts (experiment, branch `drawn-parts`)

Bodies built from the artist's own outlines instead of rule-based shapes.
The skeleton, poses, faces and the derived front view stay as they are;
only the shapes change. Each species has its own parts file: `male`,
`female` and `monkey` (the last two first drafts made from the male by
`tools/derive-parts.mjs`: the monkey has 12% longer arms; the female an
hourglass front, bust and seat in side view, slimmer and 6% shorter).
The monkey's tail is still generated from `data/species/monkey.json`.

## The parts file

`data/parts/<id>.svg` (100 px = 1 head-unit, ground at y = 0), in the
renderer's frame: the figure faces right; front-view limbs are its near
side (picture-right). `node tools/export-parts.mjs` writes it from
`data/parts.json`; `node tools/import-parts.mjs` reads it back.

- Every part at rotation 0: limbs and hands hang straight down, the neck
  points up, feet are flat.
- Parts that share a joint sit on the same anchor: hands on the wrist, the
  foot on the ankle, each bent torso (red dashed) on its straight one.
- The side view stands to the right with its own parts and `side-…`
  anchors. A side anchor sits at the same height as its front partner;
  one `side-hip` serves both legs.
- A side part is blended with its front partner as the figure turns, so it
  keeps the same number of edges (order and start node are matched on
  import). A missing side limb falls back to the front one.

| Layer | Parts |
|---|---|
| `front` | `torso`, `neck`, `upper-arm`, `forearm`, `hand-fist`, `hand-out`, `hand-in`, `hand-point`, `thigh`, `shin`, `foot` |
| `side` | `torso`, `upper-arm`, `forearm`, `hand-*`, `thigh`, `shin`, `foot` |
| `front-bend`, `side-bend` | `torso`, bent forward |
| `anchors` | `shoulder`, `elbow`, `wrist`, `hip`, `knee`, `ankle`, `neck-base`, `neck-top`, `side-shoulder`, `side-shoulder-far`, `side-elbow`, `side-wrist`, `side-hip`, `side-knee`, `side-ankle`, `side-neck-base` |

The four torsos need the same number of edges in the same order round
the outline (start node and straight-vs-curved don't matter).

## How a figure is built (`src/parts.js`)

- Limbs and hands are placed rigidly on their bones (front shape in front
  view, side shape in side view, blended in between); far limbs in front
  view are mirrored. A hand points along the forearm at wrist 0.
- The torso blends four keys: front ↔ side (turn) and straight ↔ bent
  (bend). The bend swings round the waist (polar blend); `spine.chest`
  sets it (the drawn bend ≈ 71°; beyond, or arching back, extrapolates).
  Front view: the bend follows the torso's shortening from the side pose.
- Shoulders, hips and neck are pinned to torso nodes, so they follow the
  turn and bend.
- Out of the paper: `out` on the shoulder and hip (style bible §6). Side
  view shortens the limb by cos(out); the front view is the projection
  (sideways, down) of the same limb, replacing the old mirroring. A pose
  without `out` shows its forward/back reach foreshortened in front.
- Draw order: the shin always goes behind the thigh. Front view sorts by
  depth: legs under the torso, arms over it, but a part reaching toward
  the viewer comes over and one reaching away goes under; a torso
  leaning back goes behind the legs. A limb seen end-on keeps about its
  own width in length.
- Feet keep their size. Front view: the foot turns until its lowest point
  sits as far below the ankle as in the side view (× cos out); heights are
  shared between the views. The old front-view tilt rule is gone.
- The pointing finger always goes on the side toward the body (the drawn
  point hand is mirrored across the forearm).
- No loincloth: the lower cloth covers the thighs only; the torso is drawn
  over the legs.
- Not yet: a drawn tail.
