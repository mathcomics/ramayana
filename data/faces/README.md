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

**Side-only characters** (`sideOnly: true` in `data/characters.json`;
kaikeyi and raxas_f1–f3, since 2026-11-12; only sita and surpanakha of the women
keep a front view) are only ever drawn in side view: only the
`side` layer is imported (`front` is ignored, it may stay empty). A
panel asking for their front view gets the side view and an issue.

## Views (since 2026-11-12)

A head is always one of its drawn views, shown as drawn (no in-between
angles; `docs/design/faces.md`):

| Top-level layer | The head |
|---|---|
| `front` | facing the viewer |
| `quarter` | turned 30°, looking right |
| `side` | turned 90°, looking right |
| `back-view` | from behind |
| `front-down` | facing the viewer, lowered 40° |
| `top` | lowered 90°: the top of the head |

The **bases** draw the face in front, side, three-quarter and down-40°
(`skin`, `eyes`, `mouth-1/2/3`), and the head in the back view (the
front's skin, no eyes or mouths) and the top view (a circle one head-unit
across). In every view a character's file holds **only its own parts** — `under` (behind the face), `over` (hair,
crown, beard, marks), `back` — and its own `eyes` / mouths only where it
draws its own in front (rakshasa men's eyes, raxas_m2's mouths); its guide
shows the base face, and a locked `guide-mouth` layer on top shows the
base's widest mouth, half transparent. In the back and top views all of
a character's parts are in `over`: hair covers the skull from behind and
above. They sit to the right of the side view in the file (x 6, 9, 12,
15), and are drawn by hand like the front and side.
The pose lab's Face tab shows every view of a character; the list of views
still to draw: `docs/issues/missing-views.md` (`node tools/view-gaps.mjs`).

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

Views: `front`, `side`, `quarter`, `back-view`, `front-down`, `top`
(above), and the unused `front-up`. A base
`front-up` / `front-down` with `top` and `chin` anchors makes a
character's raised / lowered view from its front parts when it has none.

| Layer | Use |
|---|---|
| `skin` | Face shape, ears, nose: **painted in the character's body colour** (`data/characters.json`), whatever colour it has here. |
| `eyes` | Eyes, as drawn. |
| `mouth-1`, `mouth-2`, `mouth-3` | The pose's mouth size (1 small … 3 wide), as drawn. |
| `anchors` | `top` (top of the head) and `chin`. In up / down, the character's parts are moved and stretched (vertically) so that the level face's top and chin land on this version's. Eyes and mouths a version doesn't draw follow the same way. |

### Character (`<character-id>.svg`)

Views: `front`, `side`, and the others above (`quarter`, `back-view`,
`front-down`, `top`, optional `front-up`).

| Layer | Use |
|---|---|
| `under` | Behind the base face: e.g. hair behind the head in front view, the back of a beard. |
| `over` | Over the base face: hair, crown, beard, earrings, face marks. |
| `back` | Optional. Behind the whole body (e.g. long locks in front view). |
| `hair-body` | Optional. Long hair on the back and shoulders: moves with the upper body, pinned at the `nape` anchor and turned with the chest; the front view sees its up-down part, like the torso. Drawn just behind the torso in the front view and just over it in the side view. |
| `eyes`, `mouth-1/2/3` | Optional. Replace the base's (a character whose eyes or mouth differ). |
| `anchors` | `nape`: where the body hair joins the body (the template puts it at the neck base). |

Draw order of a face: `under`, base skin, eyes, `over`, mouth.

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

A one-time script (`tools/split-faces.mjs`, 2026-11-06; removed, in git history) split the 18 earlier whole
faces: skin-coloured parts became the base's (from rama, sita, hanuman),
eyes and mouths that differed from the base stayed with the character, and
the rest went to `under` / `over` by drawing order.

Anything hidden in Inkscape (a layer or a single shape) still counts:
hiding is only an editing state. Delete what should not be drawn. Layers are found by their Inkscape names, so save as
Inkscape SVG (a plain SVG save drops the names).

Layers are optional: the import finds each part by its name, so a plain
group named `over`, `under` … (Inkscape label or id) works as well as a
layer.
