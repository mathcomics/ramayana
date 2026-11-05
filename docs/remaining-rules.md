# Remaining rules (drawn-parts renderer)

Branch `drawn-parts`. The aim is a figure built only from the artist's drawn
parts and projection. Lengths, heights, joints, torso bending and body scale
already work that way. This list is what is still decided by a rule in
`src/parts.js`, and what has to exist before each rule can go.
Updated 2026-11-05.

## To be replaced

| Rule | Affected part | Blocker before it can be removed |
|---|---|---|
| Front view: a limb part reaching toward the viewer (reach > 0.5) is drawn over the torso, one reaching away (< −0.5) under it | arms, legs (front view) | Depth sorting (step 2): each part gets a depth toward the viewer from the side pose, parts drawn back to front |
| Front view: a torso leaning back (lean + chest/2 < 0) goes behind all the legs | torso, legs (front view) | Depth sorting (step 2) |
| Side view: fixed draw order (far arm, far leg, tail, near leg, torso, head, near arm) | all parts (side view) | Depth sorting (step 2) for out-of-paper limbs (`out`) and a far arm crossing in front |
| The drawn back hair layer is always behind the whole body (shows between the legs when the head is low) | head: hair back | Depth sorting (step 2), and the artist's review of the hair-back layers (a hanging-forward or back-of-head drawing) |
| Front view: the foot is turned until its lowest point sits as far below the ankle as in the side view | feet (front view) | Toe direction from the `toe` / `side-toe` anchors (step 3), plus a toe-turn pose setting |
| `headView` switch (front / side face) per pose; the front view always shows the front face | head | Head turn and tilt pose settings (step 4) |
| The face flips 180° when the head is upside down | head | Head turn and tilt (step 4) and a back-of-head layer in the face files |
| Head centre fixed 0.21 head-units above the neck top | head | Use the `head` / `side-head` anchors (stored, not read yet) (step 4) |
| Front-view neck: points straight up or down, keeps at least half its length | neck | Head turn and tilt (step 4); the minimum length is otherwise a style choice |
| Front view: the hand follows the forearm, the wrist angle is ignored | hands (front view) | Wrist turn pose setting and the end-on hands (step 5) |
| The point hand is mirrored across the forearm so the finger is toward the body | hands | Wrist turn (step 5), or a point hand drawn with the finger on the inside |
| A limb's shape is picked by the view (front shape in front view, side shape in side view), not by where the limb points | upper arm, forearm, thigh, shin, hands | Blend front / side / end-on shapes by the limb's own direction (step 5; any view angle is step 6) |
| End-on hands (layer `end`) stored but not used | hands | Step 5 |

## Approximations (stay unless changed)

| Rule | Affected part | Blocker before it can be removed |
|---|---|---|
| Front torso width follows the front-bend drawings in proportion to (lean + chest) | torso (front view) | A decision on what the front-bend drawings mean (width only, or also height); the artist's torso-width review |
| A torso tipped toward the viewer is spread evenly top to bottom by its thickness | torso (front view) | A true outline of the tipped body (slices as ellipses), only if the even spread looks wrong |
| Bends below straight (arch back) and past the last drawn bend are extrapolated | torso | An arch-back torso drawing (and a deeper bend if needed) |
| A limb's top end (shoulder cap, top of the thigh) turns with the body within 0.12 head-units of the joint | upper arm, thigh | None needed; the band can be tuned or drawn per part |

## Style choices

| Rule | Affected part | Blocker before it can be removed |
|---|---|---|
| A limb seen end-on keeps about its own width in length (0.8 × width) | arms, legs | None: remove if strict projection is preferred |
| Side view: the far shoulder has its own anchor, set slightly back | arms (side view) | None: a convention for a slight three-quarter look |
| The tail is generated (length, taper, lift, curl); its front-view root is fixed behind the pelvis | tail (monkey) | A drawn tail part with its own anchors |
