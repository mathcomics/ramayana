# Ramayana

Ramayana story art in the artist's own style, rendered as SVG
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
- `panels/CLAUDE.md`, `manuscript/CLAUDE.md`, `data/CLAUDE.md` — the role
  contract for sessions working in that folder (what it owns, what to
  read first, where to log); they load automatically when files there are
  touched.

- `docs/README.md` — how the docs are organised: `docs/design/` (how things
  work now, no history), `docs/proposals/` (dated, status at the top),
  `docs/issues/` (`rules-to-migrate.md`, `problem-poses.md`). Log every
  problem found in one of the two issue files.
- `docs/design/style-bible.md` — visual rules. Read it before changing the renderer.
- `docs/design/panels.md` — the panel language as implemented; lab; Cloudflare publishing.
- `docs/design/panel-writing.md` — **read before writing panels**: the
  checklist, the artist's directions and review lessons. When the artist
  corrects a panel or a review finds a mistake, add the lesson there in
  the same commit.
- `docs/design/composition.md` — how panels are arranged (chapter
  openers, sky and horizon, throne, top view).
- `panels/layouts.md` — the model panel for each kind of scene, and how the
  rows are set.
- **Approved reference panels** — panels carrying `tags` (e.g. `panic`,
  `crowd`, `giant`): artist-reviewed models that output is judged
  against; locked without the artist's consent (`docs/design/panels.md`,
  Panel fields).

## Layout

    docs/        design/ (how it works), proposals/, issues/ (see docs/README.md)
    src/         renderer library (skeleton, species, parts, svg output)
    data/        species profiles, poses (JSON)
    tools/       pose lab, contact sheet, parts sheet; lib.mjs + svg.mjs shared helpers
    test/        npm test (node:test): unit, data integrity, render snapshot
    manuscript/  story text and scene breakdown (own README)
    panels/      panel definitions, one folder per chapter
    out/, _site/ generated (not committed)

## Conventions

- Measurements in head-units; panels use an SVG viewBox.
- Test renders at real phone size (figures ~60–150 px tall).
- After any renderer change, regenerate the contact sheet and look at it.
- Run `npm test` before every commit. A refactor must keep the render
  snapshot unchanged; an intended visual change is accepted with
  `UPDATE_SNAPSHOT=1 npm test` after looking at the render.
- Commits: author somdip <somdip@gmail.com>, **unsigned**. After cloning,
  run `git config --local commit.gpgsign false` (the session's signing key
  is not on the GitHub account, so signed commits show "Unverified").
- Do not trace or copy third-party reference material; derive
  primitives from the style bible and the artist's own work.

## Commands

    node tools/contact-sheet.mjs monkey --zoom 3   # out/contact-monkey@3x.png
    node tools/parts-sheet.mjs monkey              # out/parts-monkey.png (each body part)
    node tools/build-poselab.mjs                   # out/poselab.html (published artifact)
    node tools/pose-catalogue.mjs                  # out/pose-catalogue.png (poses + story moments)
    node tools/base-catalogue.mjs                  # out/base-catalogue.{png,html}: distinct lower bodies
                                                   # page: https://claude.ai/artifact/9VH3oVabnkmaxNHcwDFLzz
    node tools/gesture-catalogue.mjs               # out/gesture-catalogue.{png,html}: distinct upper bodies
                                                   # page: https://claude.ai/artifact/RmiwkAFe1gBtRkHFpHzUm5
    node tools/recompose.mjs --all --dry           # drift report: what per-pose tuning remains
    node tools/recompose.mjs --base kneel          # re-derive a base's poses from the grid (then look + snapshot)
    node tools/pose-gaps.mjs --scenes 04           # docs/issues/missing-poses.md; candidates per scene
    node tools/prop-gaps.mjs                       # docs/issues/missing-props.md; placeholder props per panel
    node tools/import-held.mjs                     # data/props/held/{sword,club,bow}.svg -> data/held.json

Pose lab (published artifact, saves poses to its database, collection
`poses`): https://claude.ai/artifact/631NuGY6VEftsybpaEDWUA
Saved poses are reviewed and then merged into `data/poses.json`: the
`commit-pose-lab` skill (`.claude/skills/`), which also deletes the
merged saves — a save overrides the repo pose in the lab.

    node tools/render-panels.mjs 02                # out/panels/02-*.png + issues/needs
    node tools/build-site.mjs                      # _site/ (Cloudflare Pages runs this)
    node tools/build-panellab.mjs                  # out/panellab.html (published artifact)
    node tools/renumber-panels.mjs 05 --dry        # settled chapter -> consecutive ids (inserts are 05.01a)

Panel lab (published artifact, drafts in its database, collection
`panels`): https://claude.ai/artifact/RrHEPbeEDjq9T5WGRJKhDG
Drafts are merged into `panels/` when asked — the `commit-panel-lab`
skill: merge, commit, delete the merged drafts (a draft overrides the
repo panel in the lab) unless saved again since; republish the lab after
renderer or panel changes.

## Where the work stands

### Story

`manuscript/scenes.md` is **18 chapter briefs**: per chapter the arc, its
2–3 beats (a beat = one story movement, one action per bullet), *Must
show* and *Not shown*, and at the top a continuity-and-motifs list
(returning places, travelling objects, mirrored compositions) that a panel
session reads before writing a chapter. No scene lines and no panel ids —
the panel side owns those. **Chapter 5 is the only artist-reviewed
chapter** and the model for the rest: more, simpler panels, with context
carried between them (sequential art, not single paintings).

Canon that shapes the drawing: Ravana is single-headed throughout (the
regrowing head carries the myth); a coronation is carried by the crown and
the throne alone — nothing poured, no umbrella; chapter 3's thirteen years
are season icons (to be drawn); the story closes in chapter 18 with Rama
and Sita in the swan chariot **waving back at the reader**.

### Panels

| Chapter | Panels | State |
|---|---|---|
| `01-intro` | 1 | the opener only |
| `02-the-throne` | 17 | written against the brief |
| `03-the-forest` | 7 | predates the briefs — to revisit (03.02 is approved and locked) |
| `04-surpanakha` | 12 | predates the briefs — to revisit |
| `05-the-golden-deer` | 22 | artist-reviewed; the model chapter (05.11 tagged) |
| `06-jatayu` | 11 | written against the brief |
| `07-sugriva` | 14 | written against the brief |
| `08-bali` | 10 | written against the brief |
| `09-the-leap` | 12 | written against the brief (09.09 approved and locked) |
| `10-the-ring` | 11 | written against the brief |
| `11-lanka-burns` | 1 | the approved reference panel 11.08 only |
| `14-kumbhakarna` | 1 | the approved reference panel 14.05 only |

Chapters 12–13 and 15–18 have briefs and no panels; the site marks them
"to come". Every drawn chapter's folder number matches its brief number.
The five approved reference panels (03.02, 05.11, 09.09, 11.08, 14.05)
are the models other panels are judged against and are locked:
`panels/layouts.md`.

On the chapters that predate the briefs: they are too complex (the
artist), and each is reworked against its brief when it comes up —
splitting single paintings into more, simpler panels, dropping what the
brief does not show, and swapping the `adjust` stand-ins for the real
poses now that they exist. Chapter 6 has been through that pass: the sea
crossing, the arrival in the grove and the funeral pyre are gone, the
chariot with them. **Chapter 5 still has the chariot** in 05.21 and
05.22 — the last two panels to lose it.

### Figures

Bodies, faces and poses all come from the artist's drawings
(`docs/design/drawn-parts.md`, `faces.md`, `pose-picking.md`). What the
code still decides by a rule instead: `docs/issues/rules-to-migrate.md`;
what looks wrong: `docs/issues/problem-poses.md`.

- **18 characters** in `data/characters.json` — the cast is complete.
  More generic monkeys and rakshasas come from cloth colour and a cloth
  pattern, never from new characters. Every character has a front and a
  side face drawing; there is no generated fallback.
- **65 poses** in `data/poses.json`, all side view (the front view is
  derived by the renderer). Each is named `<base>-<gesture>` and composed
  from the **27 bases** (lower body) and **59 gestures** (upper body) in
  `data/pose-index.json`; `tools/recompose.mjs` re-derives a pose from
  its base and gesture, so retuning a base propagates to all its poses.
  The lower body belongs to the base — no per-pose deviations.
- Heads turn and tilt to any angle from the front and side face drawings,
  and show the drawn face exactly as drawn at the drawn angles.
- Weapons are drawn along a reference line in the hand
  (`data/props/held/`, a per-character version where one exists);
  `grip: "both"` solves the second arm onto the hilt.

### Props

Every `data/props/<id>.svg` is a prop (43 drawn); there is no registry.
A prop id with no drawing renders as a fixed 2 × 2 head-unit labelled
box. A prop can carry anchors a figure stands or sits on
(`on: "<prop>#<anchor>"`) and can be recoloured per use (roles named on
the drawing's root: `data-recolor-body`, `data-recolor-cloth`). The queue: `docs/issues/missing-props.md`.

### Open

- **14 wanted poses** in `data/pose-index.json` (`wanted`), each with the
  stand-in to use meanwhile; `docs/issues/missing-poses.md` is the
  generated queue.
- The old sword gestures (`swordup`, `swordacross`, `swordback`,
  `swordbehind`, `sworddown`, `swordfront`, `swordhip`, `swordlevel`,
  `swordlow`, `swordshoulder`, `swordwaist`) are **deprecated** in favour
  of the guard set (`step-roof`, `stepwide-ox`, `leanback-wrath`,
  `lunge-longpoint` …): swap a remaining use when its panel is revisited.
- Panel-lab drafts still sitting in its database carry pose names from
  before the composite renaming, and the old `size` field (now `tall`:
  0.75 → 1.5, 0.5 → 1, 0.3 → 0.6) and the retired `shot` / `zoom` / big
  lifts (`docs/design/panels.md`, Rows) — fix them when a draft is merged.
- The reader site is Cloudflare Pages project `ramayana`
  (`https://ramayana-7fw.pages.dev`, open to account members only). It
  builds from GitHub, but automatic builds are **off**: publishing is the
  manual `.github/workflows/publish-site.yml`, which calls the deploy
  hook. Once the site settles, turn automatic builds on and delete the
  workflow.
- Wanted next: a pose picker in the panel lab (filter by story moment,
  tap to insert), and the open items in `docs/proposals/`.
