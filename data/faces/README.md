# Faces

The artist's face drawings. A drawn face is the character's whole head;
the renderer only places it.
**Every character must have a front and a side face** (decided
2026-11-04): there is no generated fallback. Both are in one file per
character, `<character-id>.svg` (since 2026-11-05), as two top-level
layers, `front` and `side`; the side layer sits 3 head-units to the right
(the importer ignores that offset). `import-faces` and the panels report
a missing view.

## Workflow

1. Start from the template for the character's species:
   `templates/<monkey|male|female>.svg` (front and side layers).
2. Draw the face in the layers, or paste it in and scale it to fit the guide.
   The guide (the species' head rectangle and the drawn body standing
   straight, at the figure's real scale; drawing rules in style bible §5.6)
   is locked and ignored on import. Long hair that lies on the back goes
   in `hair-body`, drawn over the body guide.
3. Save as `<character-id>.svg` in this folder, using the ids in
   `data/characters.json`: `rama.svg`, `sita.svg`, `monkey1.svg`,
   `raxas_m1.svg` …
4. Commit the file (or hand it to Claude), then run
   `node tools/import-faces.mjs`. That writes `data/faces.json`, which the
   renderer and the pose lab use.

The drawing is never edited. On import, each layer's elements are copied
unchanged with the transforms of their groups; the renderer only moves,
scales, rotates (with the head) and mirrors (facing left) the whole layer.

## Coordinates

The guide marks the head centre of each view. If you move the guide layer
(say, dragging it along with the drawing), the importer measures from where
the guide now is. Layers may be named by label or by id (`side-head`,
`front-nape` …: the view prefix is ignored).

Head-units: the head centre is (0, 0), y points down, the head spans about
±0.5. The red cross in the guide marks the centre. In side view the face
looks **right**.

## Layers

In each of the `front` and `side` layers:

| Layer | Use |
|---|---|
| `head` | The face: skin, eyes, ears, mouth, crown, beard, earrings… Turns with the head. |
| `back` | Optional. Hair behind the head: turns with the head, drawn behind the whole body. |
| `hair-body` | Optional. Long hair on the back and shoulders: moves with the upper body, pinned at the `nape` anchor and turned with the chest; the front view sees its up-down part, like the torso. Drawn just behind the torso. |
| `anchors` | `nape`: a small circle where the body hair joins the body. The templates put it at the neck base; move it only if the hair starts elsewhere. Needed when there is a `hair-body` layer. |
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
