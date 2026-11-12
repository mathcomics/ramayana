# Drawn parts

How figures are built from the artist's own body-part drawings. What is
still decided by a rule, and what blocks each: `docs/issues/rules-to-migrate.md`.

Two parts files: `male` and `female`. The monkey
uses the male parts plus a tail (generated from `data/species/monkey.json`).
A character can have a body scale (`scale` in `data/characters.json`,
default 1): torso, legs, feet and tail scale, head, neck, arms and hands
keep their size (monkey1 is 0.8).

## The parts file

`data/parts/<id>.svg` (100 px = 1 head-unit, ground at y = 0), in the
renderer's frame: the figure faces right; front-view limbs are drawn with
the near side (the character's right) on picture-right, and the finished
front view is flipped so the right side is on picture-left (the head keeps
its drawing unflipped and turns to match). `node tools/import-parts.mjs` reads it into
`data/parts.json`; `node tools/export-parts.mjs` writes it back from there,
**overwriting the file**: the artist's Inkscape layers and layout are
replaced by the imported shapes, so export only to restructure a file,
never as a check.

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
| `anchors` | `shoulder`, `elbow`, `wrist`, `hip`, `knee`, `ankle`, `neck-base`, `neck-top`, `side-shoulder`, `side-shoulder-far`, `side-elbow`, `side-wrist`, `side-hip`, `side-knee`, `side-ankle`, `side-neck-base`; tips `toe`, `side-toe` (the front foot points its toes at the viewer); head centre `head`, `side-head` |

**Hands are shared**: `data/parts/hands.svg` holds every hand
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
torso drawn with 7 edges gets the lower waist nodes added on import. The bend goes through the keys (straight → each bend), swinging
round the waist between two keys; it never goes past the drawings (an arch
back keeps the straight torso, a deeper bend keeps the deepest one). Hips hang on the hip edge only, so a folding waist doesn't
move the legs.

## How a figure is built (`src/parts.js`)

- Limbs and hands are placed rigidly on their bones. Which drawing shows
  depends on where the part itself points: in the
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
  Front view: the front drawings as drawn, picked
  by how far the upper body tips toward or away from the viewer,
  |lean + chest| folded at 90°: the keys at their bend angles, the
  deepest reached at 90° (pointing at the viewer); past 90° the drawing
  turns over about the pelvis. Shape, heights and joints are the front
  drawings' own, so in bent poses front and side heights can differ;
  adjust the front-bend drawings if they should match.
  The importer lists torso nodes and anchors whose heights differ between
  the front and side drawings (> 3 px); the two shoulder corners may
  differ as long as their middle matches.
- Shoulders, hips and neck are pinned to torso nodes, so they follow the
  turn and bend.
- Out of the paper: `out` on the shoulder and hip (style bible §6). Side
  view shortens the limb by cos(out); the front view is the projection
  (sideways, down) of the same limb. A pose
  without `out` shows its forward/back reach foreshortened in front.
- The top of the thigh (above the hip) folds into the body the more the
  thigh turns away from it: shortened by cos(angle between them), flat at
  90° and beyond, so it stays inside the buttocks when the body leans.
  Side view only: in front the thigh keeps its round top. Upper
  arms are placed as drawn.
- A limb seen end-on is its end drawing.
- Draw order by depth: each limb (and the head and tail) gets a depth
  toward the viewer from the 3D pose (front view: forward; side view:
  sideways) and is drawn far to near, as a unit (shin behind thigh); it
  goes over the torso when it is in front of the torso at that height
  (arms: of its middle less half its depth; legs: of its near surface). 
- Feet keep their size and stay flat whatever the leg's `out`. Each foot
  blends its front (toes at the viewer), side and sole drawings by where
  it points: `leg.toe` turns the toes about the vertical (+ out), the
  ankle lifts them; the camera's share along the toes, the side and the
  sole weights the three, each turned in the picture to match. Toes
  pointing the other way use the side drawing mirrored.
- Neck and head in 3D: the neck leans with lean + chest + neck and is seen
  by projection (shorter toward the viewer). It is drawn 1.5 × the drawn
  neck's length (`NECK_STRETCH`), and always behind the head: just before
  the torso when the head is in front of it, else just before the head. The head's centre sits where
  the `head` / `side-head` anchors put it from the neck top (front x,
  side depth); the head tilts with lean + chest + neck + head and turns
  by `spine.turn` (`headMatrix`), and is drawn as the nearest of the
  face's drawn views (`docs/design/faces.md`).
- The pointing finger always goes on the side toward the body (the drawn
  point hand is mirrored across the forearm).
- No loincloth: the lower cloth covers the thighs only; the torso is drawn
  over the legs.
- The tail is generated, not drawn.
- Held props (`arm.prop`: `kind` sword, club or bow, `angle`, `out`,
  `draw`, `grip`):
  - Files: `data/props/held/sword.svg`, `club.svg`, `bow.svg`. Each has
    a layer `base` (everyone's version) and optional layers named by a
    character id (that character's own version). A layer holds the
    drawing plus, not drawn, a path `line` (sword, club: straight, grip →
    tip; bow: the curve, top tip → bottom tip) and, for the bow, a circle
    `grip`. Drawn at size (100 px = 1 head-unit): the line's length is the
    weapon's length. `node tools/import-held.mjs` → `data/held.json`: each
    version in its line's frame (origin at the grip, +x along the line
    toward the tip / top, +y the belly side; head-units), with the line's
    points and ends. Layers that aren't `base` or a character id are
    skipped with a warning.
  - A figure uses its character's version (`who`, from `characterLook`),
    else `base`.
  - In a figure: the line starts at the grip (the middle of the hand)
    and points along the hand's side-view angle + `angle`, with the arm's
    `out` + `out`; each view is its projection (lengths shorten, widths
    stay). The drawing is laid along it by one affine transform and drawn
    with its arm, at the hand's depth. A bow's belly faces away from the
    hip; in the front view it is seen nearly edge-on (its width × 0.15).
    The string (tip to tip, or through the other hand's grip when
    `draw`) and the arrow are generated.
  - `grip: both` (sword, club): the other arm is solved in 3D so its fist
    closes on the hilt 0.42 below the holding hand's grip, along the
    line; its own arm angles are ignored. Its `out` is set by the
    sideways reach, the rest is a two-bone reach in the arm's plane.
  - Props don't move the figure: it is centred on its body.
