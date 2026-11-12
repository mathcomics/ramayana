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
  `front-down`; in those views a character draws only its own parts.
- `data/faces/<id>.svg`, one per character, per view: `under` (behind the
  face), `over` (hair, crown, beard, marks), `back` (behind the whole
  body), `hair-body` (long hair on the back, pinned at the `nape`
  anchor), and optionally its own `eyes` / `mouth-*` replacing the base's.
  A view the base has no drawing for is the whole head in the character's
  file (skin included, in `over`).
- Coordinates: head-units, head centre at (0, 0), y down; the face looks
  picture-right in the side and three-quarter views.

`node tools/import-faces.mjs` composes base + character into
`data/faces.json`: per character, per view, `head` (under, skin, eyes,
over), `mouth` (1–3), `back`, `hairBody`, `nape`, `defs`, and `generated`
for a view still as generated. It reports a missing file, or a missing
front or side view.

## Generated views (`tools/bake-views.mjs`)

The views a character has no drawing for are written once into its face
file from its front and side drawings, by the slice model
(`tools/head-loft.mjs` with `tools/face-turn.mjs`: each element drawn in
both views lofted into stacked ellipses, the rest flat cards). In the views
the base draws (quarter, front-down) only the character's own parts are
written, sorted into under / over / back by the layer they come from in
its front drawing. They are
ordinary layers from then on, to keep or redraw (`--bases`: the bases'
quarter and front-down mouths; a character's views get mouths only if it
draws its own front mouths); an empty `generated`
layer marks a view not yet redrawn (`--force` regenerates those; a view
without the marker is never touched). Seen from behind or above (back,
top) the whole head is in `over`; the three-quarter and down views keep
the hair behind the head in `back`. Eyes and mouths are not clipped to
the face. The queue of views to draw by hand, most used first:
`docs/issues/missing-views.md` (`node tools/view-gaps.mjs`).

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
