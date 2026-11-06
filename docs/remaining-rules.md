# Remaining rules (drawn-parts renderer)

The aim is a figure built only from the artist's drawn parts and projection.
Lengths, joints, torso bending, the front torso (the front drawings,
2026-11-06), body scale, the draw order (by depth), the tail's views and
the faces (base face + character parts, 2026-11-06) already work that way.
This list is what is still decided by a rule in `src/parts.js` /
`src/figure.js` / `tools/import-faces.mjs`, and what has to exist before
each rule can go. Updated 2026-11-06. Problems seen in the poses
themselves: `docs/problem-poses.md`.

## Steps

The tables below refer to these steps (written down 2026-11-06; the
numbers were used before the list existed):

1. Out of the paper: `out` on the shoulder and hip, front view as a
   projection. Done.
2. Draw order by depth. Done 2026-11-05.
3. Feet by toe direction: the `toe` / `side-toe` anchors give each foot's
   heel-to-toe line; a toe-turn pose setting; replaces the front-view foot
   turn.
4. Head turn and tilt: the head turned in 3D from its front and side
   drawings (prototype `tools/proto/head-turn/`; renderer
   `src/headturn.js`, turn data from `tools/face-turn.mjs` in
   `data/faces.json`; sheet `node tools/head-turn-sheet.mjs`; pose lab
   Face tab). Matching front / side elements become volumes (an ellipse
   per height row, front width × side depth), the rest flat cards on the
   surface. Used by the figures since 2026-11-06: tilt = lean + chest +
   neck + head, turn from `look`. Replaced the face switch, the face flip,
   the up / down faces and the need for a back-of-head drawing. Still to
   do: a head-turn angle in the pose, the `head` / `side-head` anchors
   (see the tables).
5. Wrist turn and end-on parts: a wrist-turn pose setting; the `end`
   layers (limbs, sole, hands) imported and blended with front / side by
   each part's own 3D direction; replaces the view-picked shapes, the
   0.8 × width end-on patch and the front hand ignoring the wrist. Done
   2026-11-06 (`dpLook` / `dpShape` in `src/parts.js`, `arm.twist`); the
   thigh fold and the mirrored point hand stay (see the table).
6. Any view angle: the same blend with a camera turned between front
   and side (not only 0° or 90°).

## To be replaced

| Rule | Affected part | Blocker before it can be removed |
|---|---|---|
| Body hair (`hair-body`) is pinned to the upper body and doesn't hang with gravity (upside down it stays on the back) | hair-body | A hang setting per character, or a drawn hanging version, if it looks wrong |
| Front view: the foot is not turned; it blends from the front drawing (toes at the viewer) toward the sole by sin² of the ankle angle; the leg's `out` doesn't turn the foot | feet | Toe direction from the `toe` / `side-toe` anchors and a toe-turn pose setting (step 3) |
| `look` (front / left / right) is a head turn of 0 / 90 / −90°: no in-between turn in poses yet | head | A head-turn pose setting (the renderer takes any angle) |
| Turned head: eyes, mouths, ears and marks are flat cards that switch from their front to their side drawing at a 45° turn (no in-between) | head | Front and side drawings of each piece with matching node counts, then blend like the limbs |
| Turned head: front cards lie in the face plane on the head volume's front surface at their centre; side cards in the side plane at the eyes' distance from the middle; ears are front cards at the volume's middle depth | head | None: placement rules; a drawn depth per piece if one sits wrong |
| Turned head: volumes are drawn as one slab per height row, sorted by the row centre's depth (a painter's order), with a layer bias: `under` −0.15, `back` −0.3 (times how much the face points at the viewer; reversed for the back of the head), `over` +0.15, blended toward the side drawing's layer near the side view. Close surfaces can interleave (stripes, small holes, a hair band crossing the face at some angles) | head | Per-pixel depth (true hidden-surface removal), or tuning the bias |
| Turned head: front and side elements are paired by kind and height overlap (IoU > 0.4); only the largest skin element becomes the head volume; small paired elements (< 0.03 head-units²) stay cards | head | Naming the pairs in the face files, if the guess goes wrong |
| Turned head: a volume row is a full ellipse spanning the drawing's leftmost to rightmost point at that height (gaps and concave bits are filled, e.g. two locks become one mass) | head, hair | Separate elements per lock / mass in both drawings |
| Turned head: where the front drawing reaches higher or lower than the side drawing, the missing side rows get a depth of the row width × the volume's usual depth-to-width ratio (a rounded cap; shows as a bump on side heads) | head, hair | Front and side drawings with matching heights (the importer lists the mismatches) |
| Turned head: a `back` part (as drawn in the view the camera is nearer: the front layer under a 45° turn, else the side layer) goes behind the whole body; everything else is drawn with the head | hair | None: needed so front locks stay behind the shoulders |
| Turned head: row ellipses seen nearly edge-on are left out, and the clip for eyes / mouths uses only the outline and well-open ellipses (rsvg loses coverage where many thin shapes overlap in a clip path) | head | None: a rendering workaround |
| Head centre fixed 0.21 head-units above the neck top | head | Use the `head` / `side-head` anchors (stored, not read yet) |
| Front-view neck: points straight up or down, keeps at least half its length | neck | A neck turned in 3D with the head; the minimum length is otherwise a style choice |
| The point hand is mirrored across the forearm so the finger is toward the body | hands | A point hand drawn with the finger on the inside (the wrist turn, `arm.twist`, now exists but only blends front / side / end) |
| A part's turn between its front and side drawings uses \|c·side\| and \|c·front\| (no sign): a limb seen from its inner side or from behind shows the outer / front drawing, mirrored only by the view's far-limb rule | upper arm, forearm, thigh, shin, hands | Back / inner drawings, if a pose shows the difference (step 6 needs this too) |
| Toward end-on, a part blends to its end drawing linearly in 1 − (length seen); the end drawing sits on the upper joint | arms, legs, hands | None: tuning, if the end blob comes in too early or late |
| Side view: the top of the thigh (above the hip) folds into the body, shortened by cos(angle between thigh and body), flat at 90° and beyond; not in the front view | thigh | Bent-hip thigh drawings; the end-on thigh (step 5) doesn't cover a thigh turned against a leaning body |
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
