# Scenes: proposal (draft, 2026-11-03)

Status: **proposal**. The spec route is implemented (2026-11-03) as described
in `docs/panels.md`, which supersedes §3 and §5 where they differ; the
template route, prop import and hand anchors are still to do. It describes how a scene in
`manuscript/scenes.md` becomes an SVG panel, building on the figure renderer
(`src/figure.js`), the shared poses, the characters and the artist's faces.

## 1. Pipeline

```
scenes.md line ──(LLM or by hand)──► scene spec (JSON) ─┐
                                                        ├─► layout ─► render ─► panel SVG
artist's scene SVG with figure markers (optional) ──────┘
```

There are two ways in, and both produce the same **layout**: every figure and
prop gets a ground point, a scale and a draw order. The renderer then draws
the result.

- **Spec route** (the default, for most scenes): a symbolic JSON spec. Its
  placement is relative and the layout code computes the coordinates.
- **Template route** (for scenes that need composing by hand): the artist
  draws the panel in Inkscape, with the background, the props and one marker
  per figure. The markers are swapped for posed figures.

## 2. Asset libraries (made before any scene renders)

| Library | Source | Status |
|---|---|---|
| Species | `data/species/*.json` | done (monkey, male, female) |
| Poses | `data/poses.json`, tuned in the pose lab | 9; more needed (§6) |
| Characters | `data/characters.json` | 14 |
| Faces | `data/faces/*.svg` → `data/faces.json` | 13 of 14 |
| **Props** | `data/props/<id>.svg` → `data/props.json` | new |
| **Grounds** | palette in a scene-level data file | new |

### Props

Props work like faces: the artist draws one SVG per prop, which is imported
and never edited (no edits to curves or colours, only placement). A template
per prop gives the scale guide: a standing male figure for size.

Layers in a prop file:

| Layer | Use |
|---|---|
| `prop` | The drawing itself. |
| `back`, `front` | Optional. Split for props a figure stands *inside* (chariot, fire, water band): `back` is drawn behind the figure, `front` in front of it. |
| `anchors` | Small marked points, read for position and then dropped. |

Anchors are circles labelled by id:

- `ground`: the point that sits on the ground line. This one is required.
- `grip` + `grip-dir`: for held props (bow, mace, sandals, mountain). This
  point is put at the hand, and the direction is lined up with the hand.
- `seat`, `stand`: where a figure sits or stands on the prop (throne,
  chariot).

The size comes from the drawing, in head-units, as with faces.

**A missing prop doesn't block a scene.** It renders as a labelled grey box
of a default size, and the build lists the missing props as a to-do list for
the artist.

## 3. Scene spec (JSON)

```json
{
  "id": "04.03",
  "ground": "dusty-pink",
  "props": [
    { "prop": "hut", "at": "right", "row": "back" }
  ],
  "figures": [
    { "who": "rama",     "pose": "stand",     "facing": "left",  "at": "center-right" },
    { "who": "sita",     "pose": "stand",     "facing": "left",  "at": "right", "row": "back" },
    { "who": "lakshman", "pose": "stand",     "facing": "left",  "at": "right" },
    { "who": "bharat",   "pose": "kneel-bow", "facing": "right", "at": { "before": "rama" } }
  ]
}
```

Rules:

- The spec only uses names that already exist: character ids
  (`data/characters.json`), pose names, prop ids and ground names. An unknown
  name is an error. A missing prop is the one exception, as a placeholder
  (§2).
- **Figure fields:**
  - `who`: a character id; a generic type such as `monkey1` can be repeated.
  - `pose`, `facing` (left|right).
  - Optional overrides: `mouth` (1–3), `headView` and `hands`. They change
    only this instance, never the pose.
- **Placement** is symbolic:
  - `at`: one of left, center-left, center, center-right, right; or a
    relation to another figure or prop.
  - `row`: back | mid | front.
  - `lift`: in the air, for a leap or flight.
- **Relations:**
  - `{ "before": X }`, `{ "behind": X }`, `{ "beside": X }`
  - `{ "on": prop }` (seat/stand anchor)
  - `{ "holds": prop }` (grip anchor at the near hand)
  - `{ "carries": X }`
- **Crowds:** `{ "crowd": "monkey1", "count": 4, "row": "back" }` expands
  into a row of figures with seeded variety, as described in style bible §8.
- **No coordinates** in a spec, ever. If a scene needs exact placement, it
  takes the template route.

## 4. Template route (artist's scene SVG)

The artist draws the panel in Inkscape at the panel's size, in these layers:

| Layer | Use |
|---|---|
| `background` | Ground colour and fixed scenery. |
| `back`, `front` | Props behind or in front of the figures (drawn directly, or `<use>` of a library prop). |
| `figures` | One **marker** per figure. |

A marker is a vertical line from the figure's feet to the top of its head,
labelled `who pose facing`, for example `rama point right`, plus optional
`mouth=3`. The bottom end is the ground point, the length sets the scale,
and the draw order follows the marker order. The importer swaps each marker
for the rendered figure. The rest of the drawing is used as drawn.

The renderer can also export a spec scene as a template, with markers in
place. That way a scene can start from auto-layout and be finished by hand.

## 5. Layout and draw order

- **Panel:** a fixed phone-portrait viewBox. A screen is 1 panel or 2–3
  stacked bands (style bible §2).
- **Rows:** each row has a ground line and a scale. The back row is higher
  in the panel and slightly smaller. There's no perspective beyond that.
- **Slots:** left…right spread evenly across the band. A relation places
  the figure next to its target, offset by the bounding boxes.
- **Draw order:**
  1. ground
  2. back-row props
  3. figures, back row to front row (left to right within a row)
  4. front props and effects (fire, arrows, water)
- The output is one SVG per panel, deterministic, with any randomness
  seeded from the scene id.

## 6. Renderer work this needs

1. **Hand anchors:** `buildShapes` reports each wrist position and the
   hand's direction, so held props can attach.
2. **Feet and bounding box** per figure, for relations (`before`, `on`).
   The bounding box already exists.
3. **New poses**, chosen from the scenes, for example kneel, kneel-bow, sit,
   carry-overhead, ride, fall, walk, dance and shoot-bow. These are tuned in
   the pose lab.
4. **Creatures** (deer, vulture, horse): each is either an artist-drawn
   prop with no pose, or a new species later. Decide per creature.
5. **Signature features** (crowns, necklaces, buns): now mostly drawn into
   the faces. Anything that's body-level (necklace, armlets) becomes a
   character-level overlay.

## 7. LLM role (later)

Given one line of `scenes.md` plus the lists of characters, poses, props and
grounds, the LLM writes a scene spec. It must pick from the lists. Anything
it can't express goes into a `needs` list on the spec (a missing pose,
prop or relation) instead of being invented. The `needs` lists across all
scenes become the asset backlog.

## 8. First milestone

One screen of 2–3 stacked panels from real scenes, built through the spec
route only, with placeholder boxes for any props not yet drawn. Then the
same scene through the template route, to check that both routes match.

## Open questions

- Ground colour: per scene, per book, or per screen?
- How tall is a band at a 2- or 3-way split, and how big are the figures in
  it (the target is 60–150 px)?
- Is a back view or a lying-down view ever needed?
- Do props get a single `prop` layer, or do all of them use back/front?
