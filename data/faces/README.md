# Faces

The artist's face drawings. A drawn face replaces the generated head for a
character; characters without one keep the generated head.

## Workflow

1. Start from the template for the character's species and view:
   `templates/<monkey|male|female>-<front|side>.svg`.
2. Draw the face in the layers, or paste it in and scale it to fit the guide.
   The guide (generated head and neck at the figure's real scale)
   is locked and ignored on import.
3. Save as `<character-id>-<front|side>.svg` in this folder, using the ids in
   `data/characters.json`: `rama-front.svg`, `sita-side.svg`,
   `monkey1-front.svg`, `raxas_m1-side.svg` …
4. Commit the file (or hand it to Claude), then run
   `node tools/import-faces.mjs`. That writes `data/faces.json`, which the
   renderer and the pose lab use.

The drawing is never edited. On import, each layer's elements are copied
unchanged with the transforms of their groups; the renderer only moves,
scales, rotates (with the head) and mirrors (facing left) the whole layer.

## Coordinates

Head-units: the head centre is (0, 0), y points down, the head spans about
±0.5. The red cross in the guide marks the centre. In side view the face
looks **right**.

## Layers

| Layer | Use |
|---|---|
| `head` | The face: skin, eyes, ears, mouth, crown, beard, earrings… Turns with the head. |
| `back` | Optional. Drawn behind the whole body, e.g. long hair below the shoulders in front view. |
| `mouth-1`, `mouth-2`, `mouth-3` | Optional. The pose's mouth size (1 small … 3 wide) picks one. If absent, the mouth drawn in `head` is used for every size. |

Layers are matched by name (Inkscape layer label or group id). Hiding a
layer in the editor doesn't matter: every layer is imported as visible.
Anything drawn outside a named layer is imported as part of `head`, in
the file's drawing order. A file with
no named layers is imported entirely as `head`.

## Colours

Faces are used **exactly as drawn**: no colour is swapped. Each character's
body colour in `data/characters.json` is a plain hex that matches the skin in
its drawn face, so the face meets the neck without a seam. Changing a skin
colour means changing both the drawing and that hex.
