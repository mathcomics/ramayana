# Ramayana

The Ramayana told as illustrated panels in the artist's own
style: flat figures with filled silhouettes, thick tapered limbs, and
gesture that carries the story. It is delivered as a smartphone (portrait)
webapp.

The repo has two halves:

| Part | Folder | What it is |
|---|---|---|
| **Art engine** | `src/`, `data/`, `tools/`, `docs/` | Deterministic renderer: a symbolic figure/scene description in, SVG out |
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
docs/README.md           how the docs are organised
docs/design/             how things work now (style bible, drawn parts, faces, panels)
docs/proposals/          dated proposals, each with its status at the top
docs/issues/             open problems: rules still to migrate, problem poses
src/scene.js             panels and screens: definition in, SVG out
panels/<NN-section>/     panel definitions: <id>.json (+ optional <id>.svg background)
data/grounds.json        ground colours
tools/build-site.mjs     reader site → _site/ (Cloudflare Pages)
tools/render-panels.mjs  screens → out/panels/*.png, with issues and needs
tools/build-panellab.mjs panel lab page → out/panellab.html
tools/renumber-panels.mjs a settled chapter's ids made consecutive (inserts are 05.01a)
tools/merge-panel-drafts.mjs panel-lab drafts → panels/ (commit-panel-lab skill)
tools/pose-saves.mjs     what pose-lab saves change (commit-pose-lab skill)
.claude/skills/          commit-panel-lab, commit-pose-lab: merging the labs' saves
tools/lib.mjs            shared tool helpers (paths, data, sections, chapters, options, PNG, lab bundling)
tools/svg.mjs            SVG parsing and writing for the importers
tools/svg-geom.mjs       SVG transforms and paths as geometry, for the importers
test/                    npm test: unit, data integrity and render snapshot
panels (with "tags")     approved reference panels: the artist-reviewed yardstick
src/geom.js              2D helpers (angles: 0 = down, +90 = forward)
src/parts.js             the artist's drawn body parts placed on the pose (both views)
src/figure.js            a figure's shapes from the parts, SVG output
data/species/*.json      per species: its drawn parts, head guide size, tail
data/bases.json          bases: lower bodies (legs, lean, tail)
data/gestures.json       gestures: upper bodies (arms, prop, chest, head, mouth)
data/poses.json          story-moment tags, wanted poses (a pose is any <base>-<gesture>)
src/compose.js           a pose from its base and gesture; the two-bone reach (shared with the pose lab)
data/characters.json     cast: species + body colour + outfit + cloth colour
tools/contact-sheet.mjs  every pose for a species → out/contact-<species>.png
tools/pose-catalogue.mjs poses with their story moments, by base → out/pose-catalogue.png
tools/catalogue.mjs      the base and gesture catalogues (tools/base-catalogue.mjs, gesture-catalogue.mjs)
tools/pose-gaps.mjs      story moments without a pose → docs/issues/missing-poses.md
tools/figure-svg.mjs     one character, one pose → editable SVG, one path per body part
tools/build-poselab.mjs  builds the pose lab page → out/poselab.html
tools/poselab.template.html  pose lab source
data/faces/              the artist's faces: base/<species>.svg + <character>.svg (own README)
out/, _site/             generated (not committed)
```

### Commands

Needs Node 18+ and `rsvg-convert` (librsvg) for PNG output. No npm installs.

```sh
npm test                                       # all tests (node:test, no packages)
UPDATE_SNAPSHOT=1 npm test                     # accept an intended render change
node tools/contact-sheet.mjs monkey --zoom 3   # all poses, 3× (or: male, female)
node tools/pose-catalogue.mjs                  # pose catalogue for picking (docs/design/pose-picking.md)
node tools/pose-gaps.mjs --scenes 04           # missing poses; candidate poses per scene
node tools/figure-svg.mjs rama --pose stand      # out/figure-rama-stand-side/front.svg (or --pose-file x.json)
node tools/build-poselab.mjs                   # rebuild the pose lab page
node tools/face-templates.mjs                  # character templates; refresh guides after a base change
node tools/check-faces.mjs                     # face drawings: what composes, what to fix
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
  the foot's angle from the ground, 0 = flat), plus the head's turn,
  mouth (1–3) and a hand per arm (`fist`, `out`, `in` or `point`). See the `_angles`
  field in `data/poses.json`. A pose is a base (lower body) with a
  gesture (upper body), composed when the data loads. All species share
  the same poses.
- **Look (not part of the pose):** a character from
  `data/characters.json` fixes species, body and cloth colours and outfit
  (`top`: bare | full; the lower cloth always covers the thighs). `characterLook()` turns it
  into `renderFigure` options; facing is chosen per use.
- **Shapes:** every body part is the artist's own drawing
  (`data/parts/`, `docs/design/drawn-parts.md`), placed on the pose. The head is the
  artist's drawn face (`data/faces/`, every character has one); a species
  gives only the head's size and width, a plain rectangle used as the
  drawing guide.

The full rules, with the reasoning behind each, are in
[docs/design/style-bible.md](docs/design/style-bible.md).

### Pose lab

A phone-friendly page with three modes: **Base** edits a lower body
(legs, lean, tail), **Gesture** an upper body (arms, prop, chest, head,
mouth), each with its finding fields (ground or free hands, story
moments) and showing the panels' poses that use it, live; **Pose** picks
a base and a gesture and shows the pair (any pair is a pose; nothing is
saved per pose). A new one-word name saves a new base or
gesture. Angles are set on the figures themselves: every joint shows a dot; tap one and drag the knob on its ring
to turn it (side view: the angles in the paper; front view: shoulder and
hip `out`). The selected joint shows its name and angle. A "Joints" toggle hides the dots. A character menu shows the
pose on any member of the cast; it changes only the view, never the saved
pose.

Two helpers keep contacts: **Pin feet** (on by default) holds every
planted foot in place under the body while a base's lean is dragged, by
re-solving that leg; **Join** solves both arms so the hands meet on the
body's midline (joined palms, clasped hands), and "joined on every base"
keeps a gesture's palms joined whatever base it is used with.
It is published as a claude.ai artifact (private to the owner):
https://claude.ai/artifact/631NuGY6VEftsybpaEDWUA

The page keeps its saves in its own database (collections `bases`,
`gestures`, `poses`); unsaved edits stay as drafts while the page is
open. Saves are merged into the data files on request, and the contact sheet
is reviewed after each merge. Republishing keeps the same URL.

### Panels and the site

Scenes in `manuscript/scenes.md` are guidance; **panel definitions** in
`panels/` say what is drawn (JSON per panel, optional background SVG);
the **site** is built from them into `_site/` by Cloudflare
Pages when published by hand (a private site). The language, the lab and the publishing setup are in
[docs/design/panels.md](docs/design/panels.md).

**Panel lab** (published artifact; drafts saved to its database, collection
`panels`, merged into `panels/` on request):
https://claude.ai/artifact/RrHEPbeEDjq9T5WGRJKhDG

## Working conventions

- Every visual change needs three things: a render you have looked at, a
  matching rule in `docs/design/style-bible.md`, and a commit to `main`.
- Never trace or copy third-party reference material. Derive the primitives
  from the style bible and the artist's own work.
- `CLAUDE.md` holds where the work stands and what is open, for
  AI-assisted sessions. Current state only: the history is in the git
  log.
