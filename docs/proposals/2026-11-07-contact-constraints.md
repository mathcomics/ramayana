# Contact constraints: pin feet, lookAt, held-by

2026-11-07 · status: pin feet built (pose lab, 2026-11-07); lookAt and held-by open

Three constraints that make contact explicit instead of eyeballed. They
came out of the panel reviews of sections 05, 07 and 08 (the artist's
critiques and the self-review in `issues/problem-poses.md`): gazes that
land on nothing, held props floating near hands, and the leg-angle cascade
when building a pose. None of them changes the pose format: poses stay
forward kinematics rooted at the pelvis, as the ankle precedent suggests
(the ankle is ground-relative because ground contact *is* its meaning;
everything else stays joint-relative).

## 1. Pin feet (pose lab only — no data change)

Building a standing pose against the chain: dragging the pelvis, lean or
a hip swings the feet off the floor, then knee and ankle get re-fixed by
hand. Most poses have feet on the ground, so the lab should let you build
from the ground up.

- A **"pin feet" toggle** on the stage (like "Joints"), on by default. A
  foot counts as planted when it touches the ground line in the current
  pose.
- While it is on, dragging the pelvis, lean, chest or a knee re-solves
  that leg's `hip` / `knee` / `ankle` numerically so each planted foot
  stays exactly where it is (ankle keeps the foot's ground angle).
- Both halves of the machinery exist: joint drags are already solved
  numerically against probe renders, and the two-handed grip already
  solves a whole arm in 3D to the hilt (`src/parts.js`). This is the same
  solve pointed at a leg.
- The saved pose is unchanged in form: the solver only writes the same
  angle fields the sliders do.

As built (2026-11-07): the toggle re-solves on **lean and chest** drags
(dragging a hip or knee is the artist moving that leg on purpose). A foot
counts planted when its lowest drawn node is within 0.06 head-units of
the ground (`joints.<side>.low`, added to the renderer's joints). Targets
are pinned **relative to the pelvis** — the figure frame re-centres on
the body every render, and the drag already holds the pelvis still on
screen, so pelvis-relative is what "stays put" means there. The solve is
closed-form two-bone IK on a probe render's own joints (side view keeps
angles exact, lengths carry the `out` foreshortening), always on the
knee-flexes-backward branch, 3 passes. A **Join hands** button was added
at the same time (not in this proposal): it solves each arm's `elbowOut`
so both hands land on the body's midline in the front view, for joined
palms and clasped hands. The forearm is kept within 40° of the paper:
past that the side-view hand foreshortens into a splayed fan instead of
the drawn hand (found on the first devotion drafts), and hands touch
well before exact convergence, so the solve also stops at 0.05. It then
lays the left hand exactly on the right in the side view (two-bone IK
on the left shoulder/elbow): the far shoulder is drawn ~0.27 behind the
near one, so identical angles leave the hands offset, and the overlap
is the point of joined palms. Other poses keep that natural shift.

## 2. lookAt (panels)

Figures face each other but nobody's eye-line lands: a seated figure
looks level through a kneeling figure's waist (08.10, 08.11), a pointing
Ravana looks over the kneeling Surpanakha (05.06 before adjust). Today
every gaze is a hand-set `spine.head` / `spine.neck` adjust.

- Figure field **`lookAt: "<figure id or prop name>"`**: after placement,
  the renderer aims the head at the target — the pitch split over
  `spine.neck` and `spine.head` (side view), plus `spine.turn` when the
  target is behind the figure's facing or the view is front.
- The target point: a figure's head centre (`joints.spine.H` is already
  returned by `renderFigure`), a prop's centre, or a prop anchor when it
  has one.
- Placement already runs in passes (`seatOn`, three passes in
  `src/scene.js`); the gaze solve is a late pass over placed figures, so
  it stays deterministic.
- An explicit `spine.head` / `spine.neck` / `turn` adjust wins over
  `lookAt` (the writer's hand beats the solver).

## 3. held-by (panels)

Placeholder props meant to be in a hand are placed by guessed `at` +
`lift` and float: the jar above the pourer (07.12), the ring off the palm
(08.03, 08.10), the umbrella with no bearer (07.12).

- Prop field **`held-by: "<figure id or who>"`** with optional
  `hand: "right" | "left"` (default right): the prop is placed at that
  figure's grip point instead of by `at` / `lift`. The grip is already
  computed per hand for held weapons (`limbs[s].grip` in
  `src/parts.js`); it needs exposing through `renderFigure` like
  `joints`.
- The mirror of `on:` — a figure on a prop's seat follows the prop; a
  held-by prop follows the figure (and its row, scale and facing).
- Placeholder boxes hang centred on the grip; a drawn prop can later add
  a `grip` anchor (like `seat`) to say where it is held, and `angle` can
  follow the hand like held weapons do.
- Two-figure contact (a jar poured over a third figure's head, clasped
  hands) stays out of scope here; `lift` off a held-by prop can nudge.

## Order

held-by is the smallest (expose the grip, one placement branch) and kills
a whole class of floating props. lookAt next: it removes the most
hand-tuning from dialogue panels. Pin feet is lab-only and can ride along
with the next pose-lab session.
