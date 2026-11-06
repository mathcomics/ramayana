# Faces

The artist's face drawings, in two parts (since 2026-11-06):

- **`base/<species>.svg`** — the base face of a species (male, female,
  monkey): face shape and ears, eyes, three mouths. Shared by every
  character of that species, so a change here changes them all.
- **`<character-id>.svg`** — one per character: its own parts over the
  base face (hair, crown, beard, marks…), in its own colours.

**Every character must have a front and a side face** (decided
2026-11-04): there is no generated fallback. `import-faces` reports a
missing file or view.

## Workflow

1. Edit a base face, or start a new character from
   `templates/<species>.svg` (save it as `<character-id>.svg`, using the
   ids in `data/characters.json`).
2. After changing a base face, run `node tools/face-templates.mjs`: it
   refreshes the guide (the base face) in every character file and in the
   templates.
   The guide shows the species' torso and neck (no limbs) and, in
   character files, the base face.
3. Run `node tools/import-faces.mjs` (writes `data/faces.json`, used by the
   renderer and the labs), then `node tools/face-sheet.mjs` to check all
   characters on one page.

The drawings are never edited by the renderer: each layer is copied
unchanged (with its groups' transforms) and the whole face is moved,
scaled, rotated with the head and mirrored (facing left).

## Files and layers

Each file has top-level layers per view; their own offsets (side at 3
head-units right, up/down below) are ignored. Inside, layers are matched
by name (Inkscape label or id; a view prefix like `front-over` is
ignored). The `guide` layer is locked and ignored; if you move it with the
drawing, the importer measures from where it now is.

### Base face (`base/<species>.svg`)

Views: `front`, `side`, and optional `front-up`, `front-down` (the front
face with the head raised / lowered; empty = the level face is used).

| Layer | Use |
|---|---|
| `skin` | Face shape, ears, nose: **painted in the character's body colour** (`data/characters.json`), whatever colour it has here. |
| `eyes` | Eyes, as drawn. |
| `mouth-1`, `mouth-2`, `mouth-3` | The pose's mouth size (1 small … 3 wide), as drawn. |
| `anchors` | `top` (top of the head) and `chin`. In up / down, the character's parts are moved and stretched (vertically) so that the level face's top and chin land on this version's. Eyes and mouths a version doesn't draw follow the same way. |

### Character (`<character-id>.svg`)

Views: `front`, `side`, and optional `front-up`, `front-down` (the
character's own parts for the raised / lowered head; without them the
level parts follow the base's anchors).

| Layer | Use |
|---|---|
| `under` | Behind the base face, turning with the head: e.g. hair behind the head in front view, the back of a beard. |
| `over` | Over the base face: hair, crown, beard, earrings, face marks. |
| `back` | Optional. Behind the whole body (e.g. long locks in front view). |
| `hair-body` | Optional. Long hair on the back and shoulders: moves with the upper body, pinned at the `nape` anchor and turned with the chest; the front view sees its up-down part, like the torso. Drawn just behind the torso in the front view and just over it in the side view. |
| `eyes`, `mouth-1/2/3` | Optional. Replace the base's (a character whose eyes or mouth differ). |
| `anchors` | `nape`: where the body hair joins the body (the template puts it at the neck base). |

Draw order of a face: `under`, base skin, eyes, `over`, mouth.

### Matching front and side shapes (for blending later)

Where a hair shape is drawn in both views, give the front and side
versions the same number of nodes, so a head turn can later blend one
into the other (step 4). In sita, queen1 and raxas_f1 (2026-11-06): the
front `back` hair pairs with the side `over` hair, and the front
`hair-body` with the side `hair-body`; the two topmost nodes of a front
shape correspond to the two rightmost nodes of its side partner.

Save as **Inkscape SVG**: a plain SVG drops the layer names, and the
importer needs them.

## Coordinates

Head-units: the head centre is (0, 0), y points down, the head spans about
±0.5. The red cross in the guide marks the centre. In side view the face
looks **right**.

## Colours

Only the base's `skin` changes colour (to the character's body colour);
everything else is used exactly as drawn.

## History

`tools/split-faces.mjs` (one-time, 2026-11-06) split the 18 earlier whole
faces: skin-coloured parts became the base's (from rama, sita, hanuman),
eyes and mouths that differed from the base stayed with the character, and
the rest went to `under` / `over` by drawing order.
