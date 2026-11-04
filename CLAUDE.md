# Warli-inspired Ramayana

Ramayana story art in the artist's own Warli-inspired style, rendered as SVG
for a smartphone (portrait) webapp.

## Architecture (planned)

scene spec (JSON) → layout → figure geometry → SVG

- Specs are symbolic: species, pose, facing, placement. Never raw coordinates.
- The renderer is deterministic. Randomness (brush roughness, crowd variety)
  is always seeded.
- LLM generation of specs comes later. Three species: monkey, male,
  female (rakshasas are male/female characters, not a species).

## Source of truth

- `README.md` — project overview, layout, commands, pose lab.

- `docs/style-bible.md` — visual rules. Read it before changing the renderer.
- `docs/scene-spec.md` — proposal for scenes (spec + template routes, props).
- `docs/panels.md` — the panel language as implemented; lab; Cloudflare publishing.
- `reference/` — the artist's original friezes. Output is judged against these.

## Layout

    docs/        style bible, design notes
    reference/   artist's reference images
    src/         renderer library (skeleton, species, parts, svg output)
    data/        species profiles, poses (JSON)
    tools/       pose lab, contact sheet, parts sheet; lib.mjs + svg.mjs shared helpers
    test/        npm test (node:test): unit, data integrity, render snapshot
    manuscript/  story text and scene breakdown (own README)
    panels/      panel definitions, one folder per section
    out/, _site/ generated (not committed)

## Conventions

- Measurements in head-units; panels use an SVG viewBox.
- Test renders at real phone size (figures ~60–150 px tall).
- After any renderer change, regenerate the contact sheet and look at it.
- Run `npm test` before every commit. A refactor must keep the render
  snapshot unchanged; an intended visual change is accepted with
  `UPDATE_SNAPSHOT=1 npm test` after looking at the render.
- Do not trace or copy third-party Warli reference material; derive
  primitives from the style bible and the artist's own work.

## Commands

    node tools/contact-sheet.mjs monkey --zoom 3   # out/contact-monkey@3x.png
    node tools/parts-sheet.mjs monkey              # out/parts-monkey.png (each body part)
    node tools/build-poselab.mjs                   # out/poselab.html (published artifact)

Pose lab (published artifact, saves poses to its database, collection
`poses`): https://claude.ai/artifact/631NuGY6VEftsybpaEDWUA
Saved poses are reviewed and then merged into `data/poses.json`.

    node tools/render-panels.mjs 02                # out/panels/02-*.png + issues/needs
    node tools/build-site.mjs                      # _site/ (Cloudflare Pages build)
    node tools/build-panellab.mjs                  # out/panellab.html (published artifact)

Panel lab (published artifact, drafts in its database, collection
`panels`): https://claude.ai/artifact/RrHEPbeEDjq9T5WGRJKhDG
Drafts are merged into `panels/` when asked; republish the lab after
renderer or panel changes.

## Status (2026-11-04)

- **Code review 2026-11-04:** test suite added (`npm test`, 38 tests incl.
  a 380-render snapshot). Dead code removed (unused geom helpers, the
  old ear-curl and `open` shape paths, unused params). Tools share
  `tools/lib.mjs` (replaces `panels-lib.mjs`) and `tools/svg.mjs`.
  `renderFigure` takes an `id` prefix (panels no longer rewrite ids by
  regex) and a character look can be spread straight into its options.
  All renders, sheets, the site and generated data are unchanged.
  Open: `node tools/import-hair.mjs` with no arguments also imports the
  **front** hair SVG (the exported generated shape), which would replace
  the generated front hair; run it with the side file only for now.

- Three species, one skeleton, one shared set of poses: **monkey** (done,
  tuned by the artist), **male**, **female** (long hair; side hair drawn by
  the artist in `data/shapes/`). Mouth shape per species (arch/box/wedge).
- **Characters** in `data/characters.json` (18, incl. queen1, queen2,
  surpanakha, sage1 added 2026-11-03 as copies for the artist to customise: species, body colour as a
  hex matching the drawn face's skin, outfit, cloth colour). The pose lab
  has no colour controls.
- **Faces are the artist's drawings** (decided 2026-11-02): one SVG per
  character and view in `data/faces/`, from templates in
  `data/faces/templates/`; `tools/import-faces.mjs` → `data/faces.json`.
  Never edit the drawings' curves or colours; only place, rotate and
  mirror (colours exactly as drawn, decided 2026-11-02). All 18
  characters have front and side faces (raxas_m1 = copy of indrajit;
  queens and surpanakha = copies of sita; sage1 = dasharatha without
  crown, white beard). Characters/views without a face use the
  generated head. Check with `node tools/face-sheet.mjs` (one US-letter page, PNG + PDF).
- **28 shared poses** in `data/poses.json` (2026-11-04), all **side
  view**, alphabetical, named `<base>-<visible action>` (style bible §7).
  Most are first drafts from a pose reference sheet, being refined in the
  pose lab. The **front view is derived** from the side pose by the
  renderer (`view: 'front'`, `frontOf()` in `src/figure.js`; style bible
  §6); the separate front poses were removed. The **ankle is the foot's
  angle from the ground** (0 = flat), not from the shin. The pose lab
  shows the chosen pose in side and front; its gallery lists side poses;
  character menu is view only; saves hold only the pose (collection
  `poses`); merge into the repo when asked. Contact sheets show side +
  front pairs.
  Section 2 panels use the new names (2026-11-04): 02.02 Kaikeyi
  `stand-lean-back` + king `stand-stagger-back`; 02.03 `stand-point` and the
  king in front view, `stand-hand-on-head`.
- Manuscript is maintained in a separate conversation (`manuscript/`).
  Scene list v0.4 (15 sections, 145 panels; sizes full/half where
  decided; full panels use back/front; early books shrunk, war in four
  sections). `manuscript/characters.md` lists who is
  identifiable (the 11 named characters in `data/characters.json`) and
  the generic types; looks live only in `data/characters.json`. Bali,
  Angad, Tara and Manthara are now generic figures.
- **Cast is complete** (18). More generic monkeys and rakshasas come from
  cloth colour and a **cloth pattern** (2026-11-04: `red-check`,
  `red-diamond`, `red-stripe` on a full top; rakshasas only; a panel
  figure can override `cloth`; pose lab has a pattern menu, view only),
  not new characters.
- **Panels (spec route) implemented 2026-11-03** (`docs/panels.md`,
  `src/scene.js`). Delivery is a vertical scroll of full-width panels;
  `size` is a share of a screen height (mostly 0.75, sometimes 0.5 or 1);
  the id is the file name (not in the JSON); `at` can be a number 0–1;
  figures overlap in list order and scale with the panel (front row ≈ 2/3
  of its height). Sample: section 2 "The throne", 8 panels in
  `panels/02-the-throne/` (02.07 has a placeholder background SVG). Props
  are placeholder boxes (`data/props.json`). Poses are approximated with
  `adjust`; each panel's `needs` lists what's missing (walk, pull, slump,
  look back; throne, palace, tree). Site builder `tools/build-site.mjs` →
  `_site/`; Cloudflare Pages not set up yet (steps in docs/panels.md).
  Panel lab published.
- **Next:** refine the new poses in the lab (14 saves there, not merged);
  **back view** for front poses that bend head-down, e.g. fall-headlong
  (back of the head; needs a back-head layer in the face files and a back
  draw order; style bible §6); artist feedback on the sample; walk pose; props
  import (`data/props/<id>.svg`, like faces); template route (figure markers in an artist's scene SVG).
  The copied faces will be customised by the artist.
  `manuscript/characters.md` doesn't list queen1/queen2/surpanakha/sage1
  yet (manuscript conversation).
