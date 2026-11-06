# Drawn parts (experiment, branch `drawn-parts`)

What is still rule-based, and what blocks each rule: `docs/remaining-rules.md`.

Bodies built from the artist's own outlines instead of rule-based shapes.
The skeleton, poses, faces and the derived front view stay as they are;
only the shapes change. Two parts files: `male` and `female`. The monkey
uses the male parts plus a tail (generated from `data/species/monkey.json`).
A character can have a body scale (`scale` in `data/characters.json`,
default 1): torso, legs, feet and tail scale, head, neck, arms and hands
keep their size (monkey1 is 0.8).

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
| `front` | `torso`, `neck`, `upper-arm`, `forearm`, `hand` (size guide, the "in" hand), `thigh`, `shin`, `foot` |
| `side` | `torso`, `upper-arm`, `forearm`, `hand`, `thigh`, `shin`, `foot` |
| `end` | `upper-arm`, `forearm`, `thigh`, `shin` seen end-on (pointing at the viewer), each on one anchor `end-shoulder`, `end-elbow`, `end-hip`, `end-knee`; `foot` with its sole toward the viewer (heel left, toes right as in the side view) on `end-ankle`, tip `end-toe`. Same edge counts as the front / side partners (limbs 4, feet 7) |
| `front-bend`, `side-bend` | `torso`, bent forward |
| `anchors` | `shoulder`, `elbow`, `wrist`, `hip`, `knee`, `ankle`, `neck-base`, `neck-top`, `side-shoulder`, `side-shoulder-far`, `side-elbow`, `side-wrist`, `side-hip`, `side-knee`, `side-ankle`, `side-neck-base`; tips `toe`, `side-toe` (the front foot points its toes at the viewer, 2026-11-06); head centre `head`, `side-head` (tips and head stored, not used by the renderer yet) |

**Hands are shared** (2026-11-06): `data/parts/hands.svg` holds every hand
shape at male size: layers `front`, `side`, `end` (seen end-on, pointing at
the viewer; not used by the renderer yet), labels `hand-fist`, `hand-out`,
`hand-in`, `hand-point`, each on its own wrist anchor (`wrist-<hand>`,
`side-wrist-<hand>`, `end-wrist-<hand>`), plus the fist's tips `hand-tip`,
`side-hand-tip`. Each body gets them scaled to the height of its own guide
`hand` (female 0.88). `node tools/export-parts.mjs hands` writes the file
from `data/parts.json`.

Torsos have 9 edges in the same order round the outline (start node and
straight-vs-curved don't matter): near top, neck, far top, far waist
(upper), far waist (lower), far hip, near hip, near waist (lower), near
waist (upper); in the side view near = front. Each bend layer holds one or
more bent torsos (`torso`, `torso-2`, …); they are ordered by how far they
bend (side: measured angle; front: height) and paired in that order. A
torso drawn with the old 7 edges gets the lower waist nodes added on
import. The bend goes through the keys (straight → each bend), swinging
round the waist between two keys; it never goes past the drawings (an arch
back keeps the straight torso, a deeper bend keeps the deepest one). Hips hang on the hip edge only, so a folding waist doesn't
move the legs.

## How a figure is built (`src/parts.js`)

- Limbs and hands are placed rigidly on their bones. Which drawing shows
  depends on where the part itself points (step 5, 2026-11-06): in the
  part's own frame the camera direction gives an end-on share (pointing at
  or away from the viewer) and a turn between the front and side drawings;
  the hand also turns about its axis by `arm.twist` (wrist turn). Its
  length shows as f (the projected length); toward end-on it blends into
  its end drawing, which sits on the upper joint (`dpLook`, `dpShape`).
  Far limbs in front view are mirrored. A hand points along the forearm
  at wrist 0.
- The torso blends four keys: front ↔ side (turn) and straight ↔ bent
  (bend). The bend swings round the waist (polar blend); `spine.chest`
  sets it in the side view (between straight and the deepest drawn bend).
  Front view (decided 2026-11-06): the front drawings as drawn, picked
  by how far the upper body tips toward or away from the viewer,
  |lean + chest| folded at 90°: the keys at their bend angles, the
  deepest reached at 90° (pointing at the viewer); past 90° the drawing
  turns over about the pelvis. Shape, heights and joints are the front
  drawings' own, so in bent poses front and side heights can differ;
  adjust the front-bend drawings if they should match. The neck shows its up-down part; the face turns over when the
  head is upside down.
  The importer lists torso nodes and anchors whose heights differ between
  the front and side drawings (> 3 px); the two shoulder corners may
  differ as long as their middle matches.
- Shoulders, hips and neck are pinned to torso nodes, so they follow the
  turn and bend.
- Out of the paper: `out` on the shoulder and hip (style bible §6). Side
  view shortens the limb by cos(out); the front view is the projection
  (sideways, down) of the same limb, replacing the old mirroring. A pose
  without `out` shows its forward/back reach foreshortened in front.
- The top of the thigh (above the hip) folds into the body the more the
  thigh turns away from it: shortened by cos(angle between them), flat at
  90° and beyond, so it stays inside the buttocks when the body leans.
  (Turning it with the body, as before 2026-11-06, folded the near thigh
  in kneel.) Side view only: in front the thigh keeps its round top. Upper
  arms are placed as drawn.
- A limb seen end-on is its end drawing (no minimum length rule since step 5).
- Draw order by depth: each limb (and the head and tail) gets a depth
  toward the viewer from the 3D pose (front view: forward; side view:
  sideways) and is drawn far to near, as a unit (shin behind thigh); it
  goes over the torso when it is in front of the torso at that height
  (arms: of its middle less half its depth; legs: of its near surface). 
- Feet keep their size. Side view: the side drawing turned by the ankle.
  Front view: not turned; the front drawing (toes at the viewer) blends
  toward the sole by sin² of the ankle (toes up, or the sole turned
  toes-down for a negative ankle).
- The pointing finger always goes on the side toward the body (the drawn
  point hand is mirrored across the forearm).
- No loincloth: the lower cloth covers the thighs only; the torso is drawn
  over the legs.
- Not yet: a drawn tail.
