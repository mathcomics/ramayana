# Warli-inspired Ramayana

The Ramayana told as illustrated panels in the artist's own Warli-inspired
style: flat figures with filled silhouettes, thick tapered limbs, and
gesture that carries the story. It is delivered as a smartphone (portrait)
webapp.

The repo has two halves:

| Part | Folder | What it is |
|---|---|---|
| **Art engine** | `src/`, `data/`, `tools/`, `docs/`, `reference/` | Deterministic renderer: a symbolic figure/scene description in, SVG out |
| **Manuscript** | `manuscript/` | The story text and the scene-by-scene breakdown the art illustrates ([its own README](manuscript/README.md)) |

## Art engine

### Pipeline

```
scene spec (JSON) → layout → figure geometry → SVG
```

- Specs are **symbolic**: species, pose, facing, placement. They never
  contain raw coordinates.
- The renderer is **deterministic**, and any randomness is seeded.
- Poses describe the figure only. Placement in a panel, height above the
  ground and background colour belong to scene layout.
- Later, an LLM will write scene specs and this engine will draw them.
  Three species cover every figure: monkey, male and female. Named
  characters (and rakshasas) will be defined on top of them.

### Layout

```
docs/style-bible.md      visual rules — read before changing the renderer
reference/               the artist's paintings and sketches (the yardstick)
src/geom.js              2D helpers (angles: 0 = down, +90 = forward)
src/figure.js            skeleton solve, body-part shapes, SVG output
data/species/*.json      per-species proportions, in head-units
data/poses.json          named poses (joint angles, view, hands, mouth)
data/characters.json     cast: species + body colour + outfit + cloth colour
tools/contact-sheet.mjs  every pose for a species → out/contact-<species>.png
tools/parts-sheet.mjs    every body part separately → out/parts-<species>.png
tools/build-poselab.mjs  builds the pose lab page → out/poselab.html
tools/poselab.template.html  pose lab source
out/                     generated renders (not committed)
```

### Commands

Needs Node 18+ and `rsvg-convert` (librsvg) for PNG output. No npm installs.

```sh
node tools/contact-sheet.mjs monkey --zoom 3   # all poses, 3× (or: male, female)
node tools/parts-sheet.mjs monkey              # each body part at one scale
node tools/build-poselab.mjs                   # rebuild the pose lab page
```

After any renderer change, regenerate the contact sheet and look at it at
real phone size (figures roughly 60–150 px tall).

### Figure model in brief

- **Skeleton:** a pelvis root, a torso hinged at the waist (it can curl),
  neck and head, two-segment arms and legs, and a tail for monkeys.
- **Views:** side and front. Facing left is a mirror of facing right.
- **Pose:** joint angles relative to the parent joint, plus head view,
  mouth (1–3) and a hand per arm (`fist`, `out` or `in`). See the `_doc`
  field in `data/poses.json`. All species share the same poses.
- **Look (not part of the pose):** a character from
  `data/characters.json` fixes species, body and cloth colours and outfit
  (`bottom`: briefs | dhoti, `top`: bare | full). `characterLook()` turns it
  into `renderFigure` options; facing is chosen per use.
- **Shapes:** limbs follow straight-against-curve with knotty joints. The
  head is a tapered rounded square with ears outside it. The loincloth is
  derived from the thighs and the torso.

The full rules, with the reasoning behind each, are in
[docs/style-bible.md](docs/style-bible.md).

### Pose lab

A phone-friendly page for tuning poses with sliders. A character menu
shows the pose on any member of the cast; it changes only the view, never
the saved pose.
It is published as a claude.ai artifact (private to the owner):
https://claude.ai/artifact/631NuGY6VEftsybpaEDWUA

The page keeps its saves in its own database (collection `poses`).
They are merged into `data/poses.json` on request, and the contact sheet
is reviewed after each merge. Republishing keeps the same URL.

## Working conventions

- Every visual change needs three things: a render you have looked at, a
  matching rule in `docs/style-bible.md`, and a commit to `main`.
- Never trace or copy third-party Warli material. Derive the primitives
  from the style bible and the artist's own work.
- `CLAUDE.md` holds the current status and next steps for AI-assisted
  sessions.
