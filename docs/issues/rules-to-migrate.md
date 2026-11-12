# Rules to migrate

The aim is a figure built only from the artist's drawings and projection.
This list is what is still decided by a rule in the code (`src/parts.js`,
`src/figure.js`, `src/headturn.js`, `tools/bake-views.mjs`) and what has
to exist before each rule can go. How things work now: `docs/design/`.
Problems seen in the poses: `docs/issues/problem-poses.md`.

## Remaining steps

Larger pieces of work that several rows below wait for:

- **Any view angle**: the camera turned anywhere between front and side
  (not only 0° or 90°); each part already blends its drawings by
  direction, so this is mostly the camera and the torso blend.
- **Back view**: the body seen from behind (arms and legs behind the torso,
  the back of the torso). The head already turns to show its back.

## To be replaced

| Rule | Affected part | Blocker before it can be removed |
|---|---|---|
| Body hair (`hair-body`) is pinned to the upper body and doesn't hang with gravity (upside down it stays on the back) | hair-body | A hang setting per character, or a drawn hanging version, if it looks wrong |
| A foot blends its front, side and sole drawings by (c·toes)², (c·side)², (c·sole)², each turned in the picture to match (side drawing and sole by where the toes point, front drawing by where the sole faces); toes pointing the other way use the side drawing mirrored (re-matched node for node). The leg's `out` doesn't turn the foot (a foot stays flat) | feet | None: a decision; a foot turned with the leg would need a toe-turn link to `out` |
| `look` (front / left / right) is kept as a shortcut for `spine.turn` 0 / 90 / −90° (poses without `turn`) | head | None: old poses; the pose lab saves `turn` |
| The neck is stretched to 1.5 × its drawn length | neck | A longer drawn neck in the parts files (then the factor goes back to 1) |
| A head is the nearest of its drawn views (front, three-quarter, side, back, down 40°, top; mirrored for the other side), rotated in the picture by its tilt: no in-between angles (`src/headturn.js`, `headView`) | head | None: a decision (`docs/proposals/2026-11-12-head-rendering-survey.md`) |
| The views beyond front and side were generated from those two by the slice model (`tools/bake-views.mjs`); eyes and mouths not clipped to the face | head | Redraw each by hand (`docs/issues/missing-views.md`) |
| Turned head: front cards lie in the face plane on the head volume's front surface at their centre; side cards in the side plane at the eyes' distance from the middle; ears are front cards at the volume's middle depth | head | None: placement rules; a drawn depth per piece if one sits wrong |
| Turned head: front and side elements are paired by kind and height overlap (IoU > 0.4); only the largest skin element becomes the head volume; small paired elements (< 0.03 head-units²) stay cards | head | Naming the pairs in the face files, if the guess goes wrong |
| Turned head: a volume row is a full ellipse spanning the drawing's leftmost to rightmost point at that height (gaps and concave bits are filled, e.g. two locks become one mass) | head, hair | Separate elements per lock / mass in both drawings |
| Turned head: where the front drawing reaches higher or lower than the side drawing, the missing side rows get a depth of the row width × the volume's usual depth-to-width ratio (a rounded cap; shows as a bump on side heads) | head, hair | Front and side drawings with matching heights (the importer lists the mismatches) |
| A head's `back` layer (of the view drawn) goes behind the whole body | hair | None: needed so long hair stays behind the shoulders |
| Turned head: row ellipses seen nearly edge-on are left out, and the clip for eyes / mouths uses only the outline and well-open ellipses (rsvg loses coverage where many thin shapes overlap in a clip path) | head | None: a rendering workaround |
| Head centre from the neck top: front x from the `head` anchor, depth from `side-head`, height the average of the two (they differ only where the drawings disagree) | head | None: matching anchor heights in the parts files |
| The neck is one drawing (front) seen in both views, shortened by projection; it doesn't turn with the head | neck | A side neck drawing, and an end-on one, if a pose shows the difference |
| The point hand is mirrored across the forearm so the finger is toward the body | hands | A point hand drawn with the finger on the inside (the wrist turn, `arm.twist`, now exists but only blends front / side / end) |
| A part's turn between its front and side drawings uses \|c·side\| and \|c·front\| (no sign): a limb seen from its inner side or from behind shows the outer / front drawing, mirrored only by the view's far-limb rule | upper arm, forearm, thigh, shin, hands | Back / inner drawings, if a pose shows the difference (any view angle needs this too) |
| Toward end-on, a part blends to its end drawing linearly in 1 − (length seen); the end drawing sits on the upper joint | arms, legs, hands | None: tuning, if the end blob comes in too early or late |
| Side view: the top of the thigh (above the hip) folds into the body, shortened by cos(angle between thigh and body), flat at 90° and beyond; not in the front view | thigh | Bent-hip thigh drawings; the end-on thigh doesn't cover a thigh turned against a leaning body |
| The bow string and arrow are generated (a thin band from the tips, through the drawing hand) | props | String and arrow drawings in `bow.svg` |
| A bow's belly faces away from the hip, and in the front view the bow's width is × 0.15 (nearly edge-on) | props | A front bow drawing, or the bow's plane from the hand's twist |
| A two-handed grip puts the other fist 0.42 below the holding hand along the line, as a fist, wrist straight along the hilt | arms, props | Grip points on the weapon drawing (`grip-2`) |
| One set of hands for every body, scaled uniformly to the body's guide hand | hands | None: a body that needs different hands would need its own hand file |

## Draw order (by depth)

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
| Front-view heights (shoulders, neck, head) are the front drawings' own, so in bent poses they need not match the side view | torso, arms, head (front view) | None: a decision; the artist adjusts the front-bend drawings where they should match |
| Side view: the torso shape stays between the drawings: an arch back (chest < 0) keeps the straight torso, a bend past the deepest drawn one keeps that one; the chest angle still turns the arms, neck and head | torso (side view) | An arch-back torso drawing, to let the shape arch |

## Style choices

| Rule | Affected part | Blocker before it can be removed |
|---|---|---|
| Side view: the far shoulder has its own anchor, set slightly back | arms (side view) | None: a convention for a slight three-quarter look |
| A character's `back` layer is drawn behind the whole body; long hair on the back is drawn in `hair-body` instead | head: hair back | None: draw hair in `hair-body` or `under` instead if it shows between the legs |
| The base face's `skin` layer is painted in the character's body colour (everything else in the face files as drawn) | faces | None: a decision |
| The tail's shape is generated (length, taper, lift, curl) in its own plane, turned by `tail.turn` (default 35°); each view is a projection | tail (monkey) | A drawn tail part with its own anchors |
