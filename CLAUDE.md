# Warli-inspired Ramayana

Ramayana story art in the artist's own Warli-inspired style, rendered as SVG
for a smartphone (portrait) webapp.

## Architecture (planned)

scene spec (JSON) → layout → figure geometry → SVG

- Specs are symbolic: species, pose, facing, placement. Never raw coordinates.
- The renderer is deterministic. Randomness (brush roughness, crowd variety)
  is always seeded.
- LLM generation of specs comes later. Current focus: figure model and
  rendering for generic human, monkey and rakshasa — pose and anatomy.

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

## Status (2026-11-01)

- Generic monkey done: shared skeleton, two views (side/front), knotty
  straight-against-curve limbs, tapered rounded-square head with outside
  ears and three mouth openings, three hands (fist/out/in), hinged torso
  curl, derived loincloth, tail.
- Nine monkey poses in `data/poses.json`, tuned by the artist in the pose
  lab and merged. Pose-lab saves also live in the artifact's `poses`
  collection; merge them into the repo when asked.
- Manuscript (2026-11-02): wordless (images only). Canon = Dutt's
  condensed Ramayana (1899). `manuscript/scenes.md` v0.3: 93 one-image
  scenes, from the bridal of Sita to the flight home (11.04), Surpanakha
  episode dropped; `characters.md`: 14 identifiable characters
  (Kumbhakarna is a one-off giant, shown in parts) with silhouette signatures, plus creature and
  prop needs. Outside-Dutt episodes decided (jewels, tail fire in; Angad's foot open). Open: grouping scenes into screens.
- Next: artist reviews the scene list; generic rakshasa and human (same
  skeleton, own species profiles), then scene layout and panels.
