# Problem poses

Open problems seen in the poses and faces: all 28 poses, side and front,
for Rama (male), Hanuman (monkey) and Sita (female). Contact sheets:
`node tools/contact-sheet.mjs male --who rama`, `monkey --who hanuman`,
`female --who sita`; faces: `node tools/face-sheet.mjs`; turned heads:
`node tools/head-turn-sheet.mjs`. Rules in the code that cause some of
these: `docs/issues/rules-to-migrate.md`.

## To fix in the drawings or the poses

| Poses | Characters | What looks wrong | Where to fix |
|---|---|---|---|
| bend-low, crawl, run-low, crouch-arms-over-head (front) | all | Shoulders and head sit higher than in the side view (the front-bend drawings are taller than the side bends: male deepest 0.70 vs 0.40, female 0.65 vs 0.07 head-units of neck height) | Parts SVG: shorten the front-bend torsos (or lengthen the side bends) where the two views should agree |
| lunge, leap, run, run-arms-back, run-low, stand-fists-up, stand-arms-up-knee-up (front) | all | Legs reaching forward and back have `out` 0, so in front they are foreshortened and overlap; the stride doesn't read | Pose lab: give the legs some hip out (about 10–25°) so they separate |
| sit, kneel, sit-lean-back, run-arms-back (front) | all | A thigh pointing at the viewer shows as a short round blob (end-on) | Pose: a little hip out; or a fuller end-on thigh drawing |
| stand-arm-over-face (front) | all | The arm meant to cover the face sits beside the head | Pose lab: less shoulder out / more elbow so the hand comes across the face |
| stand-hand-on-head (front) | all | The hand is beside the head, not on it | Pose lab: shoulder out and elbow so the hand reaches the top of the head |
| all (side) | Rama, Sita | The neck barely shows; the head sits on the shoulders | Parts SVG: the neck (`neck-base` lower on the torso or a longer neck) or the `head` anchor |
| stand-arms-overhead (side) | all | The head is tipped far back and hidden behind the raised arm | Pose: less head tilt, or the arm a little lower |
| fall-back (front) | all | The raised legs come over the belly | Correct for the pose (legs toward the viewer); change the pose if not wanted |
| (faces) | rakshasa men, sugriva, monkey1, sage1, dasharatha | Keep their own eyes or mouths after the face split, so base edits don't reach them | Face files: delete the character's `eyes` / `mouth-*` layers where the base should be used |
| (turned heads, 30° and 60°) | all | The in-between turns are computed from the two drawings and look less hand-made; Hanuman's muzzle and mouth flatten | Face files: adjust the front / side drawings |
| all (side) | female characters | A small bump on top of the head: the front hair reaches 0.11 head-units higher than the side hair, so the side gets a rounded cap | Face files: match the hair heights in front and side (`import-faces` lists every mismatch) |
| (turned heads) | every character | Front and side drawings disagree on heights: skin top about 0.09 higher in front (all bases), hair masses and buns by 0.03–0.12 | Face files: line up the heights; `node tools/import-faces.mjs` prints each mismatch (`~` lines) |
| (turned heads, 90° and level) | Rama, Sita | A thin sliver of skin under the hairline, or a hair band across the forehead | Matching heights first; else tuning the layer bias (`docs/issues/rules-to-migrate.md`) |
| (turned heads, 60° down 20–40°) | Sita | Small holes in the hair mass | Painter's order of the row slabs (`docs/issues/rules-to-migrate.md`) |
| front poses with the head turned away (`look: right`, side view) | all | The back of the head shows the skin colour where no hair is drawn behind | Face files: hair or a cap drawn to cover the back, if wanted |
| kneel, kneel-bow, kneel-palms-joined (side) | all | The forward foot hovers ~0.35 head-units above the ground (the back shin and foot carry the ground contact); seen from the new `joints.low` measurements | Pose lab: forward leg's hip / knee so the foot lands; the pin-feet toggle will then keep it there |
| sit (side) | all | The stretched left foot's heel hovers ~0.65 above the ground | Pose lab: left knee / ankle so the heel rests |
| two-handed sword poses (front) | all | The other arm is solved to the hilt, so it can cross the chest or bend sharply where the hilt is far to the holding side | Pose lab: the solved arm's "elbow out" (its free swivel, kept since 2026-11-07) moves its elbow; or the holding arm's out / angle so the hilt sits nearer the middle |
| new walk, shoot and sword poses (front) | all | First drafts from reference sheets: legs reaching forward and back have little hip out, so the stride overlaps in front | Pose lab: hip out on the stepping legs |

## From the panel self-review of sections 07–08 (2026-11-07)

Problems seen when the poses are used in panels (renders:
`node tools/render-panels.mjs 07` / `08`), beyond the missing poses the
panels already list in `needs`:

| Where | What looks wrong | Where to fix |
|---|---|---|
| 07.12, 08.04 (sit with nothing underneath) | The lean-back `sit` on bare ground reads as sliding / reclining, not sitting; with `spine.chest` 30–35 (the "hopeless slump") it reads as collapsing forward or lying | A seat (`on:` a prop) where there is one; a `sit-slump` or `sit-knees-up` pose for sitting on the ground |
| 07.04 (carried on shoulders) | The two `sit` riders at lift 5.4 cover the carrier's head completely; their stretched legs read as floating | Carried-rider pose (legs hanging, hands on the carrier); place riders so the carrier's head shows between them; already in wanted: walk-carry-shoulder |
| 07.12 (sit next to stand) | Sugriva's stretched sit legs run through Hanuman's legs: `at` 0.44 and 0.64 are too close for sit's ~2 head-units of leg reach | Panel writing: count a seated figure's reach when spacing `at`; a lint that flags overlapping figure bboxes would catch it |
| 07.12, 08.03, 08.10 (held / poured props) | Placeholder props placed by `at` + `lift` float near, not in, the hands (jar above the pourer, ring off the palm, umbrella with no bearer) | A `held-by` placement (prop at a figure's hand anchor), like `on:` for seats; until then, read the hand position off the render before setting lift |
| 08.05 (ready to leap) | The bent-over pose on the mountain reads as searching the ground, not gathering to jump; the gaze points at the feet, not across the sea | Wanted pose crouch-ready (head up, looking out) |
| Dialogue panels (08.08, 08.10, 08.11) | Figures face each other but no gaze lands: heads stay at the pose's default pitch, so a seated figure looks through a kneeling figure's waist and nobody looks up / down at the one they talk to | Panel writing: adjust `spine.neck` / `spine.head` toward the partner's head; better, a `lookAt` field solved by the renderer |
