# Remaining rules (drawn-parts renderer)

The aim is a figure built only from the artist's drawn parts and projection.
Lengths, heights, joints, torso bending, body scale, the draw order (by
depth) and the tail's views already work that way. This list is what is
still decided by a rule in `src/parts.js`, and what has to exist before each
rule can go. Updated 2026-11-05, after depth sorting (step 2). Problems seen
in the poses themselves: `docs/problem-poses.md`.

## To be replaced

| Rule | Affected part | Blocker before it can be removed |
|---|---|---|
| The face's `back` layer (hair behind the head) is always behind the whole body (shows between the legs when the head is low) | head: hair back | The artist moving long hair into the new `hair-body` layer (moves with the upper body, behind the torso); what stays in `back` is small |
| Body hair (`hair-body`) is pinned to the upper body and doesn't hang with gravity (upside down it stays on the back) | hair-body | A hang setting per character, or a drawn hanging version, if it looks wrong |
| Front view: the foot is turned until its lowest point sits as far below the ankle as in the side view | feet (front view) | Toe direction from the `toe` / `side-toe` anchors (step 3), plus a toe-turn pose setting |
| `headView` switch (front / side face) per pose; the front view always shows the front face | head | Head turn and tilt pose settings (step 4) |
| The face flips 180° when the head is upside down | head | Head turn and tilt (step 4) and a back-of-head layer in the face files |
| Head centre fixed 0.21 head-units above the neck top | head | Use the `head` / `side-head` anchors (stored, not read yet) (step 4) |
| Front-view neck: points straight up or down, keeps at least half its length | neck | Head turn and tilt (step 4); the minimum length is otherwise a style choice |
| Front view: the hand follows the forearm, the wrist angle is ignored | hands (front view) | Wrist turn pose setting and the end-on hands (step 5) |
| The point hand is mirrored across the forearm so the finger is toward the body | hands | Wrist turn (step 5), or a point hand drawn with the finger on the inside |
| A limb's shape is picked by the view (front shape in front view, side shape in side view), not by where the limb points | upper arm, forearm, thigh, shin, hands | Blend front / side / end-on shapes by the limb's own direction (step 5; any view angle is step 6) |
| End-on hands (layer `end`) stored but not used | hands | Step 5 |

## Draw order (by depth, step 2 done 2026-11-05)

Each limb, the head and the tail get a depth toward the viewer from the 3D
pose and are drawn far to near; a limb goes over the torso when it is in
front of the torso there. Its thresholds:

| Rule | Affected part | Blocker before it can be removed |
|---|---|---|
| An arm part is over the torso when in front of the torso's middle less half its depth there; a leg part when in front of the torso's near surface; the head unless behind the far surface | arms, legs, head | None: tuning of how much of the torso's depth counts |
| A limb is drawn as one unit, as near as its nearest part; its parts keep a fixed order (upper arm, forearm, hand; shin, foot, thigh) | arms, legs | Per-part sorting, if a limb crossing itself ever looks wrong |
| Side view: the torso counts as wide as the shoulders (arms) or hips (legs), at every height | torso (side view) | The front torso's width at the part's height, if needed |
| The tail is drawn behind the torso (its depth only orders it among the limbs) | tail | None: a tail in front of the body would need its own depth test |
| Body hair is not depth sorted: just behind the torso in the front view, just over it in the side view (under the head and the near arm) | hair-body | A depth for the hair (its drawing in 3D), if a pose needs hair in front of the shoulder |

## Approximations (stay unless changed)

| Rule | Affected part | Blocker before it can be removed |
|---|---|---|
| Front torso width follows the front-bend drawings in proportion to (lean + chest) | torso (front view) | A decision on what the front-bend drawings mean (width only, or also height); the artist's torso-width review |
| A torso tipped toward the viewer is spread evenly top to bottom by its thickness | torso (front view) | A true outline of the tipped body (slices as ellipses), only if the even spread looks wrong |
| The torso shape stays between the drawings: an arch back (chest < 0) keeps the straight torso, a bend past the deepest drawn one keeps that one; the chest angle still turns the arms, neck and head | torso | An arch-back torso drawing, to let the shape arch |
| The deepest front-bend drawing is the thinnest the front torso gets: a shorter projection is stretched about the pelvis (joints with it) to its height | torso (front view) | None: a decision (2026-11-06) |
| A limb's top end (shoulder cap, top of the thigh) turns with the body within 0.12 head-units of the joint | upper arm, thigh | None needed; the band can be tuned or drawn per part |

## Style choices

| Rule | Affected part | Blocker before it can be removed |
|---|---|---|
| A limb seen end-on keeps about its own width in length (0.8 × width) | arms, legs | None: remove if strict projection is preferred |
| Side view: the far shoulder has its own anchor, set slightly back | arms (side view) | None: a convention for a slight three-quarter look |
| The tail's shape is generated (length, taper, lift, curl) in its own plane, turned by `tail.turn` (default 35°); each view is a projection | tail (monkey) | A drawn tail part with its own anchors |
