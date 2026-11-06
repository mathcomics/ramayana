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
| lunge, leap, run, run-arms-back, run-low, stand-guard, stand-arms-up-knee-up (front) | all | Legs reaching forward and back have `out` 0, so in front they are foreshortened and overlap; the stride doesn't read | Pose lab: give the legs some hip out (about 10–25°) so they separate |
| sit, kneel, sit-lean-back, run-arms-back (front) | all | A thigh pointing at the viewer shows as a short round blob (end-on) | Pose: a little hip out; or a fuller end-on thigh drawing |
| stand-arm-over-face (front) | all | The arm meant to cover the face sits beside the head | Pose lab: less shoulder out / more elbow so the hand comes across the face |
| stand-hand-on-head (front) | all | The hand is beside the head, not on it | Pose lab: shoulder out and elbow so the hand reaches the top of the head |
| all (side) | Rama, Sita | The neck barely shows; the head sits on the shoulders | Parts SVG: the neck (`neck-base` lower on the torso or a longer neck) or the `head` anchor |
| stand-throw (side) | all | The head is tipped far back and hidden behind the raised arm | Pose: less head tilt, or the arm a little lower |
| fall-back (front) | all | The raised legs come over the belly | Correct for the pose (legs toward the viewer); change the pose if not wanted |
| (faces) | rakshasa men, sugriva, monkey1, sage1, dasharatha | Keep their own eyes or mouths after the face split, so base edits don't reach them | Face files: delete the character's `eyes` / `mouth-*` layers where the base should be used |
| (turned heads, 30° and 60°) | all | The in-between turns are computed from the two drawings and look less hand-made; Hanuman's muzzle and mouth flatten | Face files: adjust the front / side drawings |
| all (side) | female characters | A small bump on top of the head: the front hair reaches 0.11 head-units higher than the side hair, so the side gets a rounded cap | Face files: match the hair heights in front and side (`import-faces` lists every mismatch) |
| (turned heads) | every character | Front and side drawings disagree on heights: skin top about 0.09 higher in front (all bases), hair masses and buns by 0.03–0.12 | Face files: line up the heights; `node tools/import-faces.mjs` prints each mismatch (`~` lines) |
| (turned heads, 90° and level) | Rama, Sita | A thin sliver of skin under the hairline, or a hair band across the forehead | Matching heights first; else tuning the layer bias (`docs/issues/rules-to-migrate.md`) |
| (turned heads, 60° down 20–40°) | Sita | Small holes in the hair mass | Painter's order of the row slabs (`docs/issues/rules-to-migrate.md`) |
| front poses with the head turned away (`look: right`, side view) | all | The back of the head shows the skin colour where no hair is drawn behind | Face files: hair or a cap drawn to cover the back, if wanted |
| stand-shoot-bow, stand-shoot-bow-raise (side) | all | The drawing hand sits over the face; the string crosses the face | Pose lab: the near elbow a little lower / further back so the hand rests at the cheek |
| stand-sword-overhead, stand-sword-shoulder, stand-sword-guard | all | The far hand is placed near the hilt by hand and doesn't quite meet it | Pose lab: far arm angles; or a two-handed grip setting (`docs/issues/rules-to-migrate.md`) |
| new walk, shoot and sword poses (front) | all | First drafts from reference sheets: legs reaching forward and back have little hip out, so the stride overlaps in front | Pose lab: hip out on the stepping legs |
