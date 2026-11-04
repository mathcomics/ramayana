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
- `reference/` — the artist's original friezes. Output is judged against these.

## Layout

    docs/        style bible, design notes
    reference/   artist's reference images
    src/         renderer library (skeleton, species, parts, svg output)
    data/        species profiles, poses (JSON)
    tools/       pose lab, contact sheet, parts sheet
    manuscript/  story text and scene breakdown (own README)
    out/         generated renders (not committed)

## Conventions

- Measurements in head-units; panels use an SVG viewBox.
- Test renders at real phone size (figures ~60–150 px tall).
- After any renderer change, regenerate the contact sheet and look at it.
- Do not trace or copy third-party Warli reference material; derive
  primitives from the style bible and the artist's own work.

## Commands

    node tools/contact-sheet.mjs monkey --zoom 3   # out/contact-monkey@3x.png
    node tools/parts-sheet.mjs monkey              # out/parts-monkey.png (each body part)
    node tools/build-poselab.mjs                   # out/poselab.html (published artifact)

Pose lab (published artifact, saves poses to its database, collection
`poses`): https://claude.ai/artifact/631NuGY6VEftsybpaEDWUA
Saved poses are reviewed and then merged into `data/poses.json`.

## Status (2026-11-03)

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
- Nine shared poses in `data/poses.json`. The pose lab has a character menu
  (view only); saves hold only the pose (collection `poses`); merge into
  the repo when asked.
- Manuscript is maintained in a separate conversation (`manuscript/`).
  Scene list v0.4 (15 sections, 145 panels; sizes full/half where
  decided; full panels use back/front; early books shrunk, war in four
  sections). `manuscript/characters.md` lists who is
  identifiable (the 11 named characters in `data/characters.json`) and
  the generic types; looks live only in `data/characters.json`. Bali,
  Angad, Tara and Manthara are now generic figures.
- **Cast is complete** (18). More generic monkeys and rakshasas will come
  from cloth colour and a cloth **pattern** (to be introduced next), not
  new characters.
- **Next phase: scenes.** Proposal in `docs/scene-spec.md` (scene spec JSON
  or the artist's scene SVG with figure markers → layout → panel SVG; props
  as artist-drawn SVGs with anchors). First milestone: one screen of 2–3
  bands from real scenes. The copied faces will be customised by the artist.
  `manuscript/characters.md` doesn't list queen1/queen2/surpanakha/sage1
  yet (manuscript conversation).
