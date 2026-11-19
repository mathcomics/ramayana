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
are not shown (the season icons were dropped 2026-11-18); the story closes in chapter 18 with Rama
and Sita in the swan chariot **waving back at the reader**.

### Panels

| Chapter | Panels | State |
|---|---|---|
| `01-intro` | 9 | the opener, and the artist's drafts of the court (2026-11-14) |
| `02-the-throne` | 16 | written against the brief |
| `03-the-forest` | 12 | predates the briefs — to revisit (03.02 is approved and locked) |
| `04-surpanakha` | 16 | predates the briefs — to revisit |
| `05-the-golden-deer` | 26 | artist-reviewed; the model chapter (05.12 tagged) |
| `06-jatayu` | 25 | written against the brief |
| `07-sugriva` | 16 | written against the brief |
| `08-bali` | 19 | written against the brief |
| `09-the-leap` | 15 | written against the brief (09.11 approved and locked) |
| `10-the-ring` | 31 | written against the brief; variations to choose from (10.04–10.06, 10.09 and 10.10 the night search (10.11, 10.12 deleted 2026-11-19), 10.19–10.27 Sita's visitors, 10.28–10.33 the grove by day) |
| `11-lanka-burns` | 23 | two city variations of the panic to choose from (11.25c, 11.25d: a burning tower, the palace steps; 11.25b and 11.24 deleted 2026-11-19); first draft (2026-11-17, cut 2026-11-18): the opener on the ledge, the turn back and the run in (11.01–11.03), the havoc (11.04–11.06), the news and Ravana sending Indrajit (11.11–11.13), Indrajit running out (11.14), Hanuman on a vine with Indrajit aiming up (11.15), the binding (11.17, 11.18), Ravana's throne (11.19, 11.20), the burning tail and the burning palace (11.21–11.23) and the sea (11.27), around the approved reference panel 11.25; the homecoming still to write |
| `12-the-bridge` | 30 | first draft against the brief, with variations to choose from (2026-11-15); 12.18, 12.19, 12.21, 12.22 and 12.25 deleted, the monkeys with a weapon on each stone now in 12.26 (2026-11-19); variations of the shore (12.13b, 12.17a–c); the Ocean is a stand-in (male2) |
| `13-the-war-begins` | 12 | one siege variation to choose from (13.08b; 13.02, 13.06, 13.07a, 13.08c, 13.09, 13.09a, 13.10 and 13.10a deleted 2026-11-19, 13.04a, 13.08a and 13.11 on 2026-11-18); the opener (Lanka across the sea, 13.01), the rakshasas alarmed on 11.01's ledge (13.01a) and the monkeys arriving on it (13.01b), the wall manned with spears (13.02a) and battle scenes (ladders carried and raised against the wall (13.04, 13.05), trunks carried below the hurling wall (13.07), the ladders climbed (13.08), the breach (13.08b), the ram at the wall's foot (13.12)) |
| `14-kumbhakarna` | 25 | fourteen variations of the fight and the death to choose from (14.15–14.24, 2026-11-17: the face over the wall, the foot, the peak thrown and broken, Rama's arrows, the fallen arm, the hand, fist and foot cut off in negative (14.21a–c, 2026-11-18), the face crying out under the arrows (14.21d, `giant-face-side-cry`), the head in negative, in the sea, on the shore); 9 exploratory drafts of the waking (14.01–14.13, cut from 13 on 2026-11-18 — 14.05–14.08 and 14.10 deleted — toward 5–6; the steaming bowl now 14.09 alone) and the approved reference panel 14.14 |
| `15-the-mountain-of-herbs` | 28 | first draft against the brief, with variations to choose from (2026-11-17); moved from 16 to 15 with the popular order (2026-11-18), Indrajit for Ravana in 15.02, throwing from his cloud (`cloud-small`; in 15.02a the javelin leaves `cloud-big`); ten panels inserted around the first and third beats (15.01a–15.16a, 2026-11-18); the healer is monkey2; the javelin and the herbs are stand-ins |
| `16-indrajit` | 21 | first draft against the brief (2026-11-18): the fire rite (Lanka's roofs by night with the glow, the shrine — the fire alone, or on the top of its steps (16.02a) — Indrajit and the rakshasas at the fire, black smoke rising over the roofs; 16.01–16.05), Vibhishana leading Lakshman and the monkeys through the streets and the watch from a wall's corner (16.06–16.08), Indrajit caught and leaping from the fire, the fire left burning low (16.09–16.11), the duel one side per strip (16.12–16.17), the head struck off in negative (16.18) and the end (16.19); the fire altar, the smoke (a black vine), the broken bow and the head alone are stand-ins |
| `17-ravanas-fall` | 19 | first draft (2026-11-19), on the artist's directions: Ravana's lament before his throne over Indrajit's body (17.01–17.04), striding out with sword and club (17.05), the duel with Rama one side per strip (17.06–17.10), and variations to choose from: the head cut off (17.11, 17.12), the head growing back (17.13–17.15) and more heads growing (17.16–17.18), the heads drawn on `head-alone`; the great arrow, the fall and the pyre still to write |
| `18-return` | 1 | the construction strip alone |
| `reference` | 7 | reference drawings, panel lab only (not on the site): `repeat` on rocks, lotuses, flowers, ladders (ref.01–ref.06); arrows struck in the chest (ref.07) |

Chapters 12–18 open with a construction strip (`NN.00`, 0.6 tall, the
`icon-construction` sign alone on `sand`): the site is public and these
chapters are not finished. Delete a chapter's strip when it is done.
Every drawn chapter's folder number matches its brief number.
The approved reference panels (every panel with `tags`; 31 since the frieze 13.02 was deleted
2026-11-19) are the models other panels are
judged against and are locked; the tags and what each kind of scene
looks like: `panels/layouts.md`.

On the chapters that predate the briefs: they are too complex (the
artist), and each is reworked against its brief when it comes up —
splitting single paintings into more, simpler panels, dropping what the
brief does not show, and swapping the `adjust` stand-ins for the real
poses now that they exist. Chapter 6 has been through that pass: the sea
crossing, the arrival in the grove and the funeral pyre are gone, the
chariot with them. Chapter 5 has lost the chariot too (05.26 on 2026-11-14,
the last chariot panel deleted 2026-11-16).

### Figures

Bodies, faces and poses all come from the artist's drawings
(`docs/design/drawn-parts.md`, `faces.md`, `pose-picking.md`). What the
code still decides by a rule instead: `docs/issues/rules-to-migrate.md`;
what looks wrong: `docs/issues/problem-poses.md`.

- **24 characters** in `data/characters.json` (monkey2, a bearded monkey, added 2026-11-18; raxas_m4, bald, added 2026-11-16; Kausalya, the sage and the
  generic men male1, male2 added 2026-11-14).
  More generic monkeys and rakshasas come from cloth colour and a cloth
  pattern, never from new characters. Every character has a front and a
  side face drawing; there is no generated fallback — except the
  side-only kaikeyi, kausalya and raxas_f1–f3 (`sideOnly`), which have a side face only and are
  never drawn in front view.
- **Poses: any base with any gesture**, named `<base>-<gesture>`, all
  side view (the front view is derived by the renderer). **28 bases**
  (`data/bases.json`: legs, lean, tail; `ground` and story moments
  `use`) and **61 gestures** (`data/gestures.json`: arms, chest, head,
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

Every `data/props/<id>.svg` is a prop (72); there is no registry.
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
  gestures were deleted 2026-11-10, unused by any panel. The one-handed
  sword gestures are `swordcarry` and the 10 sabre guards from the
  artist's sheet (`watch`, `straight`, `lance`, `bastion`, `swap`, `arc`,
  `bull`, `shoulder`, `waist`, `boar`; added 2026-11-18, each desc names
  its guard).
- Panel-lab drafts still sitting in its database carry pose names from
  before the composite renaming, and the old `size` field (now `tall`:
  0.75 → 1.5, 0.5 → 1, 0.3 → 0.6) and the retired `shot` / `zoom` / `lift`
  (now `nudge: [0, n]`) (`docs/design/panels.md`, Rows) — fix them when a draft is merged.
- The reader site is Cloudflare Pages project `ramayana`
  (`https://ramayana-7fw.pages.dev`, open to account members only).
  Cloudflare's GitHub integration builds and publishes it on every push
  to `main` on origin: pushing **is** publishing, there is no other step
  (the manual workflow and its deploy hook are gone, 2026-11-16).
- Head views: body hair (`hair-body`) per head view, and the rakshasa
  men's props in their extra views (copied from Rama) —
  `docs/proposals/2026-11-12-head-rendering-survey.md`, Open.
- Face guides are stale: the base faces were redrawn after the guides
  were last refreshed. Run `node tools/face-templates.mjs` and commit
  (guide layers only; the diff is large because of the layout).
- Wanted next: a pose picker in the panel lab (filter by story moment,
  tap to insert), and the open items in `docs/proposals/`.
