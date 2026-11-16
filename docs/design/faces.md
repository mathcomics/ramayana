# Faces

Faces are the artist's drawings; the code places, rotates and mirrors
them, never edits their curves or colours (only the base skin takes the
character's body colour). A head is always one of its drawn views, shown
as drawn: there are no computed in-between angles. Drawing rules: style
bible §5.6. Workflow for the artist: `data/faces/README.md`. Why this
model: `docs/proposals/2026-11-12-head-rendering-survey.md`.

## Views

| View | The head | Layer |
|---|---|---|
| front | facing the viewer | `front` |
| three-quarter | turned 30°, looking picture-right | `quarter` |
| side | turned 90°, looking picture-right | `side` |
| back | turned 180° | `back-view` |
| down 40° | facing the viewer, lowered 40° | `front-down` |
| top | lowered 90°: the top of the head | `top` |

`front-up` (raised) is read when drawn but is not one of the intended
views. Turns to the other side use the drawing mirrored. A side-only
character (`sideOnly` in `data/characters.json`) has the side view only.

## Files

- `data/faces/base/<species>.svg` (male, female, monkey): the base face,
  per view `skin` (face shape and ears), `eyes`, `mouth-1/2/3`, anchors
  `top`, `chin`. The bases draw front, side, `quarter` and
  `front-down`, and the head alone in `back-view` (the front's skin) and
  `top` (a circle); a character draws only its own parts in every view
  (in back and top all of them in `over`).
- `data/faces/<id>.svg`, one per character, per view: `under` (behind the
  face), `over` (hair, crown, beard, marks), `back` (behind the whole
  body), `hair-body` (long hair on the back, pinned at the `nape`
  anchor), and optionally its own `eyes` replacing the base's. Mouths
  come from the base only.
- Coordinates: head-units, head centre at (0, 0), y down; the face looks
  picture-right in the side and three-quarter views.

The faces are composed from the drawings each time they are loaded
(`loadFaces` in `tools/lib.mjs`, `composeFaces` in `tools/faces-lib.mjs`;
no generated file): per character, per view, `head` (under, skin, eyes,
over), `mouth` (1–3), `back`, `hairBody`, `nape` and `defs`. The base
skin is painted with the character's body colour, and so is any part of a
base mouth filled with the base's skin colour (the lip line of the side
mouth 1).
`node tools/check-faces.mjs` lists the composition and reports a missing
file, a missing front or side view, and anything else to fix in a drawing.

## Views to draw

Every character has all its views drawn by hand (the four beyond front and
side were first generated from those two, then redrawn; the generator is
gone). A view a character lacks is drawn as its nearest drawn view; the
queue, most used first: `docs/issues/missing-views.md`
(`node tools/view-gaps.mjs`).

## A head in a figure (`src/headturn.js`, `src/figure.js`)

- The head's orientation is a 3×3 matrix R (head-local → picture, depth
  toward the viewer): `headMatrix(tilt, turn, front)`, with tilt = lean +
  chest + neck + head (+ bows the face) and turn = `spine.turn` (degrees
  from the body's front, + to its right). Front view: the camera looks at
  the body's front, the figure flipped so its right is on picture-left
  (R conjugated by the flip, so the drawing is not mirrored); side view:
  at its right side.
- `headView(R, views)` picks the drawn view seen from the most similar
  direction (the viewer's direction in head-local coordinates against each
  view's, `htRot(yaw, pitch)`; mirrored views count for turns to the
  other side). A roll in the picture plane is free: the drawing is rotated
  — so a side-view head tilted any amount is the side drawing turned, and
  a front-view nod picks front, down 40° or top. A view not drawn: the
  nearest drawn one stands in (the panel lists an issue).
- The view is placed by one matrix: R times the view's own orientation,
  its in-plane part made a pure rotation (a reflection when mirrored).
- The head centre sits where the parts files' `head` / `side-head`
  anchors put it from the neck top. `back` goes behind the whole body,
  the head after the torso in depth order; `hair-body` comes from the
  figure's own view (front or side) and follows the upper body
  (`docs/design/drawn-parts.md`).
- Sheets: the pose lab's Face tab (every intended view of a character,
  a blank space where one is not drawn); `node tools/face-sheet.mjs`
  (front and side).
