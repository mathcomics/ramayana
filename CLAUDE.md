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

## Status (2026-11-02)

- Three species, one skeleton, one shared set of poses: **monkey** (done,
  tuned by the artist), **male** and **female** (first versions; female has
  a hair bun and hourglass proportions). No rakshasa species and no female
  monkeys.
- Outfit options at render time: bottom briefs | dhoti, top bare | full.
  Palettes: body brown / dark red / tan; cloth white / yellow / red.
- Nine shared poses in `data/poses.json`. The pose lab switches species,
  outfit and colours as view-only options; saves hold only the pose
  (collection `poses`); merge into the repo when asked.
- Manuscript is maintained in a separate conversation (`manuscript/`).
- Next: characters — each inherits a species and fixes outfit, cloth
  colour and body colour. Then scene layout and panels.
