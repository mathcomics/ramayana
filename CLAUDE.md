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
- `panels/layouts.md` — the tags: each kind of scene the artist has
  approved a model for and how it is built; and how the rows are set.
- **Approved reference panels** — panels carrying `tags` (e.g. `frieze`,
  `spy`, `giant`): artist-reviewed models that output is judged
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
    node tools/build-poselab.mjs                   # out/poselab.html (published artifact)
    node tools/pose-catalogue.mjs                  # out/pose-catalogue.png (poses + story moments)
    node tools/base-catalogue.mjs                  # out/base-catalogue.{png,html}: distinct lower bodies
                                                   # page: https://claude.ai/artifact/9VH3oVabnkmaxNHcwDFLzz
    node tools/gesture-catalogue.mjs               # out/gesture-catalogue.{png,html}: distinct upper bodies
                                                   # page: https://claude.ai/artifact/RmiwkAFe1gBtRkHFpHzUm5
    node tools/pose-gaps.mjs --scenes 04           # docs/issues/missing-poses.md; candidates per scene
    node tools/prop-gaps.mjs                       # docs/issues/missing-props.md; placeholder props per panel
    node tools/import-held.mjs                     # data/props/held/{sword,club,bow}.svg -> data/held.json
    node tools/check-faces.mjs                     # face drawings: what composes, what to fix
    node tools/view-gaps.mjs                       # docs/issues/missing-views.md: head views to draw

Pose lab (published artifact; edits bases and gestures, angles and
finding fields, saving to its database, collections `bases`,
`gestures`): https://claude.ai/artifact/631NuGY6VEftsybpaEDWUA
Saves are reviewed and then merged into `data/bases.json` and
`data/gestures.json`: the `commit-pose-lab`
skill (`.claude/skills/`), which also deletes the merged saves — a save
overrides the repo entry in the lab.

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
| `01-intro` | 7 | the opener, and the artist's drafts of the court (2026-11-14) |
| `02-the-throne` | 17 | written against the brief |
| `03-the-forest` | 10 | predates the briefs — to revisit (03.02 is approved and locked) |
| `04-surpanakha` | 15 | predates the briefs — to revisit |
| `05-the-golden-deer` | 26 | artist-reviewed; the model chapter (05.11 tagged) |
| `06-jatayu` | 13 | written against the brief |
| `07-sugriva` | 15 | written against the brief |
| `08-bali` | 10 | written against the brief |
| `09-the-leap` | 13 | written against the brief (09.09 approved and locked) |
| `10-the-ring` | 11 | written against the brief |
| `11-lanka-burns` | 1 | the approved reference panel 11.08 only |
| `13-the-war-begins` | 5 | battle scenes only (siege ladder, rocks hurled, the fall, a chief, the fallen field); no opener yet |
| `14-kumbhakarna` | 13 | 12 exploratory drafts of the waking (14.01–14.04c, to be cut to 5–6) and the approved reference panel 14.05 |

Chapters 12 and 15–18 have briefs and no panels; the site marks them
"to come". Every drawn chapter's folder number matches its brief number.
The approved reference panels (every panel with `tags`; 20 after the
artist's tagging round of 2026-11-13) are the models other panels are
judged against and are locked; the tags and what each kind of scene
looks like: `panels/layouts.md`.

On the chapters that predate the briefs: they are too complex (the
artist), and each is reworked against its brief when it comes up —
splitting single paintings into more, simpler panels, dropping what the
brief does not show, and swapping the `adjust` stand-ins for the real
poses now that they exist. Chapter 6 has been through that pass: the sea
crossing, the arrival in the grove and the funeral pyre are gone, the
chariot with them. **Chapter 5 still has the chariot** in 05.21 —
the last panel to lose it (05.22 lost it 2026-11-14).

### Figures

Bodies, faces and poses all come from the artist's drawings
(`docs/design/drawn-parts.md`, `faces.md`, `pose-picking.md`). What the
code still decides by a rule instead: `docs/issues/rules-to-migrate.md`;
what looks wrong: `docs/issues/problem-poses.md`.

- **22 characters** in `data/characters.json` (Kausalya, the sage and the
  generic men male1, male2 added 2026-11-14).
  More generic monkeys and rakshasas come from cloth colour and a cloth
  pattern, never from new characters. Every character has a front and a
  side face drawing; there is no generated fallback — except the
  side-only kaikeyi, kausalya and raxas_f1–f3 (`sideOnly`), which have a side face only and are
  never drawn in front view.
- **Poses: any base with any gesture**, named `<base>-<gesture>`, all
  side view (the front view is derived by the renderer). **28 bases**
  (`data/bases.json`: legs, lean, tail; `ground` and story moments
  `use`) and **51 gestures** (`data/gestures.json`: arms, chest, head,
  mouth; `hold` and `use`); `src/compose.js` composes a pair when a panel
  names it, so retuning a base or gesture changes every pose using it.
  There is no list of poses (dropped 2026-11-14: the finding fields moved
  onto the halves); the panels use 52 pairs today
  (`docs/design/pose-picking.md`).
- A head is always one of six drawn views, shown as drawn: front,
  three-quarter, side, back, down 40°, top (mirrored for the other side;
  `docs/design/faces.md`). All are drawn by hand; a missing one shows
  as its nearest drawn view (`docs/issues/missing-views.md`).
- Weapons are drawn along a reference line in the hand
  (`data/props/held/`, a per-character version where one exists);
  `grip: "both"` solves the second arm onto the hilt.

### Props

Every `data/props/<id>.svg` is a prop (64; the four giant faces, front and side, asleep and `-awake`, still carry a placeholder note); there is no registry.
A prop id with no drawing renders as a fixed 2 × 2 head-unit labelled
box. A prop can carry anchors a figure stands or sits on
(`on: "<prop>#<anchor>"`) and can be recoloured per use (roles named on
the drawing's root: `data-recolor-body`, `data-recolor-cloth`). The queue: `docs/issues/missing-props.md`.

### Open

- **16 wanted poses** in `data/poses.json` (`wanted`), each with the
  stand-in to use meanwhile; `docs/issues/missing-poses.md` is the
  generated queue.
- **Sword postures are unreviewed.** They are the 14 two-handed
  longsword guards (`roof`, `ox`, `plow`, `fool`, `key`, `crown`,
  `wrath`, `longpoint`, `unicorn`, `hanging`, `middle`, `flank`,
  `change`, `barrier`; each desc names its guard) — the old `sword…`
  gestures were deleted 2026-11-10, unused by any panel. There is no
  one-handed sword gesture any more except `swordcarry`.
- Panel-lab drafts still sitting in its database carry pose names from
  before the composite renaming, and the old `size` field (now `tall`:
  0.75 → 1.5, 0.5 → 1, 0.3 → 0.6) and the retired `shot` / `zoom` / `lift`
  (now `nudge: [0, n]`) (`docs/design/panels.md`, Rows) — fix them when a draft is merged.
- The reader site is Cloudflare Pages project `ramayana`
  (`https://ramayana-7fw.pages.dev`, open to account members only). It
  builds from GitHub, but automatic builds are **off**: publishing is the
  manual `.github/workflows/publish-site.yml`, which calls the deploy
  hook. Once the site settles, turn automatic builds on and delete the
  workflow.
- Head views: body hair (`hair-body`) per head view, and the rakshasa
  men's props in their extra views (copied from Rama) —
  `docs/proposals/2026-11-12-head-rendering-survey.md`, Open.
- Face guides are stale: the base faces were redrawn after the guides
  were last refreshed. Run `node tools/face-templates.mjs` and commit
  (guide layers only; the diff is large because of the layout).
- Wanted next: a pose picker in the panel lab (filter by story moment,
  tap to insert), and the open items in `docs/proposals/`.
