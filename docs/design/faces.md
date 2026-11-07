# Faces

Faces are the artist's drawings; the code places them and turns them in
3D, never edits their curves or colours (only the base skin takes the
character's body colour). Drawing rules: style bible §5.6. Workflow for
the artist: `data/faces/README.md`.

## Files

- `data/faces/base/<species>.svg` (male, female, monkey): the base face.
  Views `front` and `side`, each with layers `skin` (face shape and ears),
  `eyes`, `mouth-1`, `mouth-2`, `mouth-3`, and anchors `top`, `chin`.
- `data/faces/<id>.svg`, one per character: views `front` and `side`, each
  with layers `under` (behind the face), `over` (hair, crown, beard,
  marks), `back` (behind the whole body), `hair-body` (long hair on the
  back, pinned at the `nape` anchor), and optionally the character's own
  `eyes` / `mouth-*` replacing the base's.
- Coordinates: head-units, head centre at (0, 0); front x right, y down;
  side x forward (the face looks right).

`node tools/import-faces.mjs` composes base + character into
`data/faces.json`: for each view the drawn markup, and `turn`, the turn
data below. It lists characters with a missing file or view, and where a
face's front and side drawings disagree on heights (`~` lines).

## Turn data (`tools/face-turn.mjs`)

- Every drawn element (path, circle, ellipse, rect) of both views is
  flattened with its transforms.
- A front element is paired with the side element of the same kind
  (skin, eyes, mouth-n, character parts) whose height range overlaps it
  best (overlap / union > 0.4).
- **Volumes:** the largest paired skin element (the head) and paired
  character elements of some size (hair masses, buns) become volumes,
  stored as rows every 0.02 head-units: at height y the front drawing's
  extent (x centre, half-width) and the side drawing's (depth centre,
  half-depth). Rows run over the front drawing's height; where the side
  drawing ends sooner, the depth is the row width × the volume's usual
  depth-to-width ratio (a rounded cap).
- **Cards:** everything else (eyes, mouths, ears, marks, small parts) is a
  flat card, its markup kept as drawn: front cards on the head volume's
  front surface at their centre (outside it, at its middle depth), side
  cards in the side plane at the eyes' distance from the middle.

## Drawing a turned head (`src/headturn.js`)

`headTurn(turn, yaw, pitch, { mouth, id, R, part })` returns SVG markup in
head-units around the head centre. The orientation is a 3×3 matrix R
(head-local → picture, with depth toward the viewer); `headMatrix(tilt,
turn, front)` builds it for a figure, yaw / pitch for the sheets.

- **At the drawn angles the drawings are used as drawn** (`drawn`: the
  face's front / side markup): the front drawing when the face looks
  straight at the viewer (R's depth row is the face direction; any roll
  is a turn in the picture), the side drawing when the head is seen
  exactly from the side (any tilt is then a turn in the picture: every
  side-view figure looking ahead). The slices below are only for the
  angles between (turned heads, front faces tilted up or down). The
  slices can't reproduce shapes with hollows, separate pieces at one
  height or parts that wrap round the head.

- Each volume row is an ellipse (front width × side depth) seen through
  R, plus a band joining its outermost points to the rows on either side
  (across the head's own up axis as seen). Rows seen nearly edge-on
  draw only their band.
- All rows of all volumes are sorted by the depth of their centre and
  drawn far to near, with a layer bias so the drawn layering wins near
  the front: `under` −0.15 and `back` −0.3 (times how much the face points
  at the viewer, so reversed for the back of the head), `over` +0.15;
  toward the side view the side drawing's layer counts instead.
- Cards: front cards while the face is turned less than 45° from the
  viewer, side cards past it; each placed by an affine transform from R,
  hidden when its side faces away. Eyes and mouths are clipped to the
  head's outline. Only the pose's mouth (1–3) is drawn.
- `part`: `back` draws only what is in the `back` layer of the drawing
  the camera is nearer to (front layer while the face turns less than
  45°, else the side layer), for drawing behind the body; `head` draws the
  rest.

## In a figure

- The head centre sits where the parts files' `head` / `side-head`
  anchors put it from the neck top (front x, side depth, height the
  average of the two), turned with the head.
- Tilt = lean + chest + neck + head (+ bows the face), turn = `spine.turn`
  (degrees from the body's front, + to its right, the near side in the
  side view; −90 … 90). Front view: the camera looks at the body's front,
  the figure flipped so its right is on picture-left (the head's matrix is
  conjugated by the flip, so the drawing isn't mirrored); side view: at its
  right side, showing the side drawing.
- `back` goes behind the whole body, the head after the torso in depth
  order; `hair-body` follows the upper body (`docs/design/drawn-parts.md`).
- Sheets: `node tools/head-turn-sheet.mjs [ids]`, the pose lab's Face tab.
