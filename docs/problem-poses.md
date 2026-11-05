# Problem poses (self-review, 2026-11-05)

All 28 poses, side and front, for Rama (male), Hanuman (monkey) and Sita
(female), drawn-parts renderer after depth sorting. Contact sheets:
`node tools/contact-sheet.mjs male --who rama`, `monkey --who hanuman`,
`female --who sita`.

## Fixed in code during the review

| Problem | Fix |
|---|---|
| Monkey tail in the front view was the side-view curl stuck out to one side from a fixed root | The tail now curls in its own plane, turned by a new pose setting `tail.turn` (default 35°, toward the far side); each view is a projection of it. Side view sees cos(turn) of its reach, front view sin(turn). Pose lab has a "tail turn" slider. |

## Better fixed in the drawings or the poses

| Poses | Characters | What looks wrong | Where to fix |
|---|---|---|---|
| bend-low, crawl, crouch-arms-over-head, fall-back, run-low, leap-dive (front) | Sita | Her back hair layer is behind the whole body, so it shows through the gap between the legs or below the body | Face SVGs: the hair-back layers (hanging-forward / back-of-head versions) |
| fall-headlong, leap-dive (front) | all | The head is below the body, so the face is drawn upside down | Face SVGs: a back-of-head layer (then step 4, head turn, picks it) |
| bend-low, crawl (front) | all | The upper body points at the viewer, so the torso is a short band hidden behind the face; the face seems to sit on the thighs | Pose: less lean or a raised head (spine.head); or decide on a minimum front torso height (see remaining-rules) |
| lunge, leap, run, run-arms-back, run-low, stand-guard, stand-arms-up-knee-up (front) | all | Legs reaching forward and back have `out` 0, so in front they are foreshortened and overlap; the stride doesn't read | Pose lab: give the legs some hip out (about 10–25°) so they separate |
| sit, kneel, sit-lean-back, run-arms-back (front) | all | A thigh pointing at the viewer shows as a short blob (end-on) | Pose: a little hip out if the blob reads badly; otherwise correct |
| stand-arm-over-face (front) | all | The arm meant to cover the face sits beside the head | Pose lab: less shoulder out / more elbow so the hand comes across the face |
| stand-hand-on-head (front) | all | The hand is beside the head, not on it | Pose lab: shoulder out and elbow so the hand reaches the top of the head |
| lie-front (front) | all | The torso shows almost its full height: the chest bend (−45°) arches back past the drawn torsos and is extrapolated | Parts SVG: an arch-back torso; or pose: a smaller back arch |
| all (side) | Rama, Sita | The neck barely shows; the head sits on the shoulders | Parts SVG: the neck (`neck-base` lower on the torso or a longer neck) or the `head` anchor |
| stand-throw (side) | all | The head is tipped far back and hidden behind the raised arm | Pose: less head tilt, or the arm a little lower |
| fall-back (front) | all | The raised legs come over the belly | Correct for the pose (legs toward the viewer); change the pose if not wanted |
