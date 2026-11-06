# Remaining rules (drawn-parts renderer)

The aim is a figure built only from the artist's drawn parts and projection.
Lengths, joints, torso bending, the front torso (the front drawings,
2026-11-06), body scale, the draw order (by depth), the tail's views and
the faces (base face + character parts, 2026-11-06) already work that way.
This list is what is still decided by a rule in `src/parts.js` /
`src/figure.js` / `tools/import-faces.mjs`, and what has to exist before
each rule can go. Updated 2026-11-06. Problems seen in the poses
themselves: `docs/problem-poses.md`.

## To be replaced

| Rule | Affected part | Blocker before it can be removed |
|---|---|---|
| Body hair (`hair-body`) is pinned to the upper body and doesn't hang with gravity (upside down it stays on the back) | hair-body | A hang setting per character, or a drawn hanging version, if it looks wrong |
| Front view: the foot is turned until its lowest point sits as far below the ankle as in the side view | feet (front view) | Toe direction from the `toe` / `side-toe` anchors (step 3), plus a toe-turn pose setting |
| `look` (front / left / right, relative to the body) picks a face drawing: a 90° switch, no in-between turn; side view looking right (away from the viewer) shows the side face | head | Head turn as an angle, a back-of-head layer and a three-quarter face (step 4) |
| The face flips 180° when the head is upside down | head | Head turn and tilt (step 4) and a back-of-head layer in the face files |
| Front view: a head raised / lowered 25° or more (lean + chest + neck + head, folded past level) switches to the base's `front-up` / `front-down` face: a switch, no in-between | head (front view) | The artist drawing the up / down versions (empty so far, so the level face shows); more versions or a blend if the switch shows |
| In up / down, the character's parts (and eyes / mouths the version lacks) are moved and stretched vertically so the base's `top` and `chin` anchors land on the version's | hair, crown, marks | The character's own `front-up` / `front-down` layers where the stretch looks wrong |
| Head centre fixed 0.21 head-units above the neck top | head | Use the `head` / `side-head` anchors (stored, not read yet) (step 4) |
| Front-view neck: points straight up or down, keeps at least half its length | neck | Head turn and tilt (step 4); the minimum length is otherwise a style choice |
| Front view: the hand follows the forearm, the wrist angle is ignored | hands (front view) | Wrist turn pose setting and the end-on hands (step 5) |
| The point hand is mirrored across the forearm so the finger is toward the body | hands | Wrist turn (step 5), or a point hand drawn with the finger on the inside |
| A limb's shape is picked by the view (front shape in front view, side shape in side view), not by where the limb points | upper arm, forearm, thigh, shin, hands | Blend front / side / end-on shapes by the limb's own direction (step 5; any view angle is step 6) |
| A limb seen end-on keeps about its own width in length (0.8 × width); the extra length goes back over its upper joint, so it still ends at its lower joint | arms, legs | End-on limb drawings blended by the limb's direction (step 5) |
| Side view: the top of the thigh (above the hip) folds into the body, shortened by cos(angle between thigh and body), flat at 90° and beyond; not in the front view; upper arms are placed as drawn | thigh | End-on / bent-hip thigh drawings (step 5); until then the fold keeps thigh tops inside the buttocks (bend-low) without folding the near thigh (kneel) |
| End-on hands (layer `end` of `data/parts/hands.svg`) stored but not used | hands | Step 5 |
| One set of hands for every body, scaled uniformly to the body's guide hand | hands | None: a body that needs different hands would need its own hand file |

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
| Front torso = the front drawings picked by \|lean + chest\| folded at 90° (each drawing at its bend angle, the deepest at 90°; turned over past 90°); a torso tipped away from the viewer uses the same drawings | torso (front view) | A back-bend front drawing, if tipping away should look different |
| Front-view heights (shoulders, neck, head) are the front drawings' own, so in bent poses they need not match the side view | torso, arms, head (front view) | None: a decision (2026-11-06); the artist adjusts the front-bend drawings where they should match |
| Side view: the torso shape stays between the drawings: an arch back (chest < 0) keeps the straight torso, a bend past the deepest drawn one keeps that one; the chest angle still turns the arms, neck and head | torso (side view) | An arch-back torso drawing, to let the shape arch |

## Style choices

| Rule | Affected part | Blocker before it can be removed |
|---|---|---|
| Side view: the far shoulder has its own anchor, set slightly back | arms (side view) | None: a convention for a slight three-quarter look |
| A character's `back` layer is drawn behind the whole body; only a small part of the female front locks uses it now (long hair is in `hair-body`, done for sita and her five copies 2026-11-06) | head: hair back | None: draw hair in `hair-body` or `under` instead if it shows between the legs |
| The base face's `skin` layer is painted in the character's body colour (everything else in the face files as drawn) | faces | None: a decision (2026-11-06) |
| The tail's shape is generated (length, taper, lift, curl) in its own plane, turned by `tail.turn` (default 35°); each view is a projection | tail (monkey) | A drawn tail part with its own anchors |
