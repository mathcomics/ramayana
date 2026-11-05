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
docs/scene-spec.md       proposal: scene spec, props, layout
docs/panels.md           the panel language (implemented), lab, publishing
docs/drawn-parts.md      drawn-parts figures (branch drawn-parts)
docs/remaining-rules.md  what is still rule-based in them, and the blockers
docs/problem-poses.md    self-review of all poses: what to fix in poses or drawings
src/scene.js             panels and screens: definition in, SVG out
panels/<NN-section>/     panel definitions: <id>.json (+ optional <id>.svg background)
data/props.json          prop registry (sizes; placeholders until drawn)
data/grounds.json        ground colours
tools/build-site.mjs     reader site → _site/ (Cloudflare Pages)
tools/render-panels.mjs  screens → out/panels/*.png, with issues and needs
tools/build-panellab.mjs panel lab page → out/panellab.html
tools/lib.mjs            shared tool helpers (paths, data, sections, rsvg, lab bundling)
tools/svg.mjs            SVG parsing for import-faces
test/                    npm test: unit, data integrity and render snapshot
reference/               the artist's paintings and sketches (the yardstick)
src/geom.js              2D helpers (angles: 0 = down, +90 = forward)
src/figure.js            skeleton solve, body-part shapes, SVG output
data/species/*.json      per-species proportions, in head-units
data/poses.json          named poses (joint angles, view, hands, mouth)
data/characters.json     cast: species + body colour + outfit + cloth colour
tools/contact-sheet.mjs  every pose for a species → out/contact-<species>.png
tools/parts-sheet.mjs    every body part separately → out/parts-<species>.png
tools/figure-svg.mjs     one character, one pose → editable SVG, one path per body part
tools/build-poselab.mjs  builds the pose lab page → out/poselab.html
tools/poselab.template.html  pose lab source
data/faces/              the artist's face drawings, <character>-<front|side>.svg (own README)
data/faces.json          imported faces (generated; do not edit)
out/, _site/             generated (not committed)
```

### Commands

Needs Node 18+ and `rsvg-convert` (librsvg) for PNG output. No npm installs.

```sh
npm test                                       # all tests (node:test, no packages)
UPDATE_SNAPSHOT=1 npm test                     # accept an intended render change
node tools/contact-sheet.mjs monkey --zoom 3   # all poses, 3× (or: male, female)
node tools/figure-svg.mjs rama --pose stand      # out/figure-rama-stand-side/front.svg (or --pose-file x.json)
node tools/parts-sheet.mjs monkey [--light]    # each body part at one scale (--light: pale, outlined, PDF, to draw on)
node tools/build-poselab.mjs                   # rebuild the pose lab page
node tools/face-templates.mjs                  # face templates per species and view
node tools/import-faces.mjs                    # data/faces/*.svg → data/faces.json
node tools/face-sheet.mjs                      # all characters on one US-letter page (PNG + PDF)
node tools/render-panels.mjs [02]              # panel screens → out/panels/, lists issues and needs
node tools/build-site.mjs                      # reader site → _site/
node tools/build-panellab.mjs                  # panel lab page → out/panellab.html
```

After any renderer change, regenerate the contact sheet and look at it at
real phone size (figures roughly 60–150 px tall).

### Tests

`npm test` runs `test/*.test.mjs` with Node's built-in runner:

- **geom, figure, scene, svg:** unit tests of the helpers, the skeleton and
  the front-view derivation, outfits and patterns, eye colour, panel layout
  and placement, background clean-up, and the import tools' SVG parsing.
- **data:** every name resolves (species, poses, cloth, faces); pose names
  follow style bible §7 and stay alphabetical.
- **render snapshot** (`test/render-snapshot.json`): a fingerprint of every
  species × pose × view × facing, every character and every panel. A
  clean-up must leave it unchanged. When a render is meant to change, look
  at it, then run `UPDATE_SNAPSHOT=1 npm test` and commit the new file.

### Figure model in brief

- **Skeleton:** a pelvis root, a torso hinged at the waist (it can curl),
  neck and head, two-segment arms and legs, and a tail for monkeys.
- **Views:** poses are side view; the front view is derived from the
  side pose when drawn (`view: 'front'`). Facing left is a mirror of
  facing right.
- **Pose:** joint angles relative to the parent joint (except the ankle:
  the foot's angle from the ground, 0 = flat), plus head view,
  mouth (1–3) and a hand per arm (`fist`, `out` or `in`). See the `_doc`
  field in `data/poses.json`. All species share the same poses.
- **Look (not part of the pose):** a character from
  `data/characters.json` fixes species, body and cloth colours and outfit
  (`bottom`: briefs | dhoti, `top`: bare | full). `characterLook()` turns it
  into `renderFigure` options; facing is chosen per use.
- **Shapes:** limbs follow straight-against-curve with knotty joints. The
  loincloth is derived from the thighs and the torso. The head is the
  artist's drawn face (`data/faces/`, every character has one); a species
  gives only the head's size and width, a plain rectangle used as the
  drawing guide.

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

### Panels and the site

Scenes in `manuscript/scenes.md` are guidance; **panel definitions** in
`panels/` say what is drawn (JSON per panel, optional background SVG);
the **site** is built from them into `_site/` and served by Cloudflare
Pages. The language, the lab and the publishing setup are in
[docs/panels.md](docs/panels.md).

**Panel lab** (published artifact; drafts saved to its database, collection
`panels`, merged into `panels/` on request):
https://claude.ai/artifact/RrHEPbeEDjq9T5WGRJKhDG

## Working conventions

- Every visual change needs three things: a render you have looked at, a
  matching rule in `docs/style-bible.md`, and a commit to `main`.
- Never trace or copy third-party Warli material. Derive the primitives
  from the style bible and the artist's own work.
- `CLAUDE.md` holds the current status and next steps for AI-assisted
  sessions.
