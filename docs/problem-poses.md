# Problem poses (self-review, updated 2026-11-06)

All 28 poses, side and front, for Rama (male), Hanuman (monkey) and Sita
(female). First review 2026-11-05 (after depth sorting); updated
2026-11-06 after the front-torso, limb and face changes. Contact sheets:
`node tools/contact-sheet.mjs male --who rama`, `monkey --who hanuman`,
`female --who sita`; faces: `node tools/face-sheet.mjs`.

## Fixed in code

| Problem | Fix |
|---|---|
| Monkey tail in the front view was the side-view curl stuck out to one side from a fixed root | The tail curls in its own plane, turned by `tail.turn` (default 35°, toward the far side); each view is a projection of it. Pose lab: "tail turn" slider. (2026-11-05) |
| bend-low, crawl (front): the upper body pointing at the viewer projected to a thin band hidden behind the face; the face seemed to sit on the thighs | The front torso is now the artist's front drawings, picked by how far the upper body tips toward the viewer, so it keeps the deepest drawing's height. (2026-11-06) |
| lie-front (front): the arched-back torso showed almost its full height (extrapolated) | Same change: no extrapolation; the drawing is picked by \|lean + chest\|. (2026-11-06) |
| kneel (side and front): the near thigh folded at the hip; in front it stuck out past the knee with a flat cut end | The thigh top folds into the body by cos of the angle (side view only); an end-on limb ends at its lower joint. (2026-11-06) |
| bend-low, crawl, crouch-arms-over-head, fall-back, run-low, leap-dive (front): Sita's long locks in `back` showed between the legs | The artist moved the locks to `hair-body`; kaikeyi, raxas_f1, queen1, queen2 and surpanakha (plain copies) now copy sita's file. (2026-11-06) |
| Face sheet: front figures drawn in side view; monkey1's close-ups off-centre | The sheet passes the view and the body scale. (2026-11-06) |
| bend-low, crawl, run-low, crouch-arms-over-head (front): the head lowered toward the viewer showed the level face | The head is turned in 3D from the two face drawings (step 4): a lowered head shows its top. (2026-11-06) |
| fall-headlong, leap-dive (front): the head below the body showed the face upside down | Same: the head shows its top and back. (2026-11-06) |
| crouch-arms-over-head (side, Sita): stray thin lines beside the head | Rows of the turned head now join across the head's own up axis, without strokes. (2026-11-06) |
| stand and most front poses (PNG only): eyes and mouths faint and striped at small head tilts | Simpler clip outline for eyes and mouths (an rsvg problem; browsers were fine). (2026-11-06) |

## Better fixed in the drawings or the poses

| Poses | Characters | What looks wrong | Where to fix |
|---|---|---|---|
| bend-low, crawl, run-low, crouch-arms-over-head (front) | all | Shoulders and head sit higher than in the side view (the front-bend drawings are taller than the side bends: male deepest 0.70 vs 0.40, female 0.65 vs 0.07 head-units of neck height) | Parts SVG: shorten the front-bend torsos (or lengthen the side bends) where the two views should agree |
| lunge, leap, run, run-arms-back, run-low, stand-guard, stand-arms-up-knee-up (front) | all | Legs reaching forward and back have `out` 0, so in front they are foreshortened and overlap; the stride doesn't read | Pose lab: give the legs some hip out (about 10–25°) so they separate |
| sit, kneel, sit-lean-back, run-arms-back (front) | all | A thigh pointing at the viewer shows as a short round blob (end-on) | Pose: a little hip out; or end-on thigh drawings (step 5) |
| stand-arm-over-face (front) | all | The arm meant to cover the face sits beside the head | Pose lab: less shoulder out / more elbow so the hand comes across the face |
| stand-hand-on-head (front) | all | The hand is beside the head, not on it | Pose lab: shoulder out and elbow so the hand reaches the top of the head |
| all (side) | Rama, Sita | The neck barely shows; the head sits on the shoulders | Parts SVG: the neck (`neck-base` lower on the torso or a longer neck) or the `head` anchor |
| stand-throw (side) | all | The head is tipped far back and hidden behind the raised arm | Pose: less head tilt, or the arm a little lower |
| fall-back (front) | all | The raised legs come over the belly | Correct for the pose (legs toward the viewer); change the pose if not wanted |
| (faces) | rakshasa men, sugriva, monkey1, sage1, dasharatha | Keep their own eyes or mouths after the face split, so base edits don't reach them | Face files: delete the character's `eyes` / `mouth-*` layers where the base should be used |
| (turned heads, 30° and 60°) | all | The in-between turns are computed from the two drawings and look less hand-made; Hanuman's muzzle and mouth flatten | Face files: adjust the front / side drawings (accepted 2026-11-06 as better than the old switch) |
| all (side) | female characters | A small bump on top of the head: the front hair reaches 0.11 head-units higher than the side hair, so the side gets a rounded cap | Face files: match the hair heights in front and side (`import-faces` lists every mismatch) |
| (turned heads) | every character | Front and side drawings disagree on heights: skin top about 0.09 higher in front (all bases), hair masses and buns by 0.03–0.12 | Face files: line up the heights; `node tools/import-faces.mjs` prints each mismatch (`~` lines) |
| (turned heads, 90° and level) | Rama, Sita | A thin sliver of skin under the hairline, or a hair band across the forehead | Matching heights first; else tuning the layer bias (`docs/remaining-rules.md`) |
| (turned heads, 60° down 20–40°) | Sita | Small holes in the hair mass | Painter's order of the row slabs (`docs/remaining-rules.md`) |
| front poses with the head turned away (`look: right`, side view) | all | The back of the head shows the skin colour where no hair is drawn behind | Face files: hair or a cap drawn to cover the back, if wanted |
