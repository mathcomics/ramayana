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
- `docs/design/composition.md` + `layouts/scenes/` — how panels are
  arranged (chapter openers, sky and horizon, throne, top view), from the
  artist's scene layouts.
- `reference/` — the artist's original friezes. Output is judged against these.

## Layout

    docs/        design/ (how it works), proposals/, issues/ (see docs/README.md)
    reference/   artist's reference images
    src/         renderer library (skeleton, species, parts, svg output)
    data/        species profiles, poses (JSON)
    tools/       pose lab, contact sheet, parts sheet; lib.mjs + svg.mjs shared helpers
    test/        npm test (node:test): unit, data integrity, render snapshot
    manuscript/  story text and scene breakdown (own README)
    panels/      panel definitions, one folder per section
    layouts/     templates for sketching panel layouts (page + figures for scale)
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
Saved poses are reviewed and then merged into `data/poses.json`.

    node tools/render-panels.mjs 02                # out/panels/02-*.png + issues/needs
    node tools/build-site.mjs                      # _site/ (Cloudflare Pages runs this)
    node tools/build-panellab.mjs                  # out/panellab.html (published artifact)
    node tools/layout-template.mjs 0.5 wide        # layouts/0.5-wide.svg (size: 0.75, 0.5, 0.3; shot: far, wide, mid)

Panel lab (published artifact, drafts in its database, collection
`panels`): https://claude.ai/artifact/RrHEPbeEDjq9T5WGRJKhDG
Drafts are merged into `panels/` when asked; republish the lab after
renderer or panel changes.

## Status (2026-11-07)

- **Chapters 02 and 07 reworked against the briefs (2026-11-07):** the
  first two of the revisit pass (only ch 05 is artist-reviewed).
  Ch 02 (11 panels): new opener — the **empty Ayodhya throne** (opener
  chosen, composition.md) — then the king on it front-view far, the
  lead-by-hand, a 0.3-mid **Kaikeyi arrival strip** (the 05.04
  pattern), pull and point at `wide`, a 0.3 walking-away strip, the
  look back, a 0.3 three-walking strip, river, forest (02.07.svg →
  02.10.svg). Ch 07 (14 panels): `kishkindha` replaces `hills`
  (opener + the vow, now 0.5), monkeys watch from the plateau on
  `kishkindha#stand-*` anchors, `ledge` replaces `rocks`, new 0.3
  strips (Hanuman bounds down; **Bali falls** alone), real
  `kneel-palms` / `kneel-bow` poses replace adjust stand-ins, the
  brief's cuts applied (no Tara warning, no Lakshman-confronts-
  Sugriva; fire clasp is two figures), monsoon figures sit/stand on
  the ledge's anchors. Two new lessons in panel-writing.md (no far
  props in mid-shot strips; lone full-body action wants `wide`).
  Snapshot updated after looking; lab republished.
- **Scene props: Lanka redrawn; ledge, kishkindha, male-top; stand
  anchors and prop recolouring (2026-11-07):** `lanka-island` redrawn as
  a small domed palace on its dark mountain (same palette and viewBox;
  05.01 placement unchanged, snapshot updated). New rocky props with
  seeded-random outlines: `ledge` (6.2 × 2.3, flat standing top, any
  rocky scene) and `kishkindha` (13 × 6.5: the monkey city's stupa-domed
  palace on its hill, flat-topped Rishyamukha in front — the abduction
  watch and the meeting with Rama). Both carry **stand anchors**
  (`stand-left` / `stand` / `stand-right`; the ledge also `seat`), and
  figure `on` now takes `"<prop>#<anchor>"` (default stays `seat`; a
  figure on an anchor takes the prop's scale). `male-top` = the artist's
  standing man from above (tight viewBox 1.1 × 0.76), and props can
  **recolour per use**: a `recolor` map in `data/props.json` (role →
  drawn colour) + prop fields `who` / `body` / `cloth` (palette names
  resolve; a pattern suffix keeps the base colour). Panel writers:
  07.01 / 07.07 / 08.01 (`hills`) and 08.05 (`mountain`) can swap to
  `kishkindha` in the revisit pass; top-view bow / begging-bowl props
  and a female/monkey top view are still to draw. Rules:
  `docs/design/composition.md` (Kishkindha and rocks, Top view),
  `docs/design/panels.md` (Recolouring, anchors).
- **Manuscript rewritten as chapter briefs (2026-11-07):**
  `manuscript/scenes.md` v0.5 — no scene lines or panel ids anywhere;
  one brief per chapter (arc, 3–6 beats, Must show / Not shown) plus a
  **continuity-and-motifs list** (returning places, travelling objects,
  mirrored compositions) that panel sessions must read before writing a
  chapter. **Chapter 5 is the only artist-reviewed chapter and the
  model; the drawn panels for 1–4 and 6–8 are to be revisited against
  the briefs (too complex, artist 2026-11-07).** Cut for wordlessness /
  simplicity: Tara's warning and Lakshman confronting Sugriva (7),
  Vibhishana's plea for Hanuman (9), Sita shown the fallen brothers and
  the second javelin (10), Sugriva seized (11), the false Sita (12),
  Ravana rushing at Sita (13). Surpanakha promoted to identifiable
  (12 named); `pending-changes.md` cleared. `tools/pose-gaps.mjs` now
  mines the beats (ids = chapter numbers); missing-poses regenerated;
  `manuscript/README.md`, `characters.md`, `panels.md`,
  `panel-writing.md` updated to the brief format. Later the same day:
  ten-headed Ravana skipped (single-headed throughout; the regrowing
  head carries the myth) and **chapter 10 "The bridge" split out** (the
  Ocean rises and points the way; Nala and the squirrel not shown) —
  **16 chapters now**, old 11–15 renumbered 12–16; no drawn chapter
  moved.
- **Artist props: flowers, two thrones, Jatayu's wing (2026-11-07):**
  the artist's `flowers.svg` sheet lives in `data/props/sheets/` and is
  split into seven props with tight viewBoxes: `flower-droop`,
  `flower-white`, `flower-pink`, `flower-yellow`, `flower-orange` (small
  standing flowers, 1.8–2.6 head-units) and `lotus-bud` / `lotus-full`
  (drawn hanging with falling petals — for flower-rain, placed with
  `lift`). `throne` split in two: **`throne-ayodhya`** (gold seat and
  steps under the red sun disc; ch 02 — the king's gold crown now reads
  against the red) and **`throne-lanka`** (the old gold-backed one;
  Ravana's court 05.02–05.06 and, as a stand-in, Sugriva's 07.12).
  `vulture-wing` (5.8 × 5.7, the wing Ravana cuts) ready for the Jatayu
  battle panels — not yet placed.
- **Composite names everywhere; bases shared in the lab (2026-11-07):**
  every pose is now named `<base>-<gesture>` — in poses.json, the index,
  the panels (183 references rewritten) and the docs; the old
  descriptive names are gone (stand → `step-hang`, walk → `walk-swing`,
  stand-bow-draw → `step-bowdraw`, stand-sword-up → `step-swordup` …;
  the renderer's fallback pose is `step-hang`). The name test now checks
  name = base + gesture. **Panel-lab drafts in its database still hold
  old pose names** — fix them when drafts are merged. **Pose lab: the
  lower body belongs to the base** ("no deviations", the artist's call):
  editing legs, lean or tail on any pose updates the session's base and
  every pose of that base loads with it (a gesture's `lean` still adds
  on top, feet kept by the leg solve); merging such a save = apply to
  the base reference + `recompose --base`. Per-pose lower-body
  deviations are not entertained until the bases are refined.
- **New sword set from the fencing-guard sheet (2026-11-07):** 14 new
  two-handed sword poses (heavy blade / club, not rapier) built from a
  historical guard reference (angles only): gestures `roof`, `ox`,
  `crown`, `hanging`, `unicorn`, `wrath`, `longpoint`, `plow`, `middle`,
  `key`, `fool`, `flank`, `barrier`, `change`, each one pose on an
  existing base (step, stepwide, leanback, leanfront, lunge, stepback —
  no new bases; recompose clean). **Composed poses are named
  `<base>-<gesture>`** (decided 2026-11-07, pose-picking.md): step-roof,
  stepwide-ox, step-crown, leanfront-hanging, leanback-unicorn,
  leanback-wrath, lunge-longpoint, stepwide-plow, stepwide-middle,
  step-key, step-fool, stepwide-flank, leanfront-barrier,
  stepback-change; artist composes leanback-roof and leanback-bowhigh
  merged from the lab, with the artist's retuned `lunge` base
  (recomposed through the lunge sword poses).
  **Step 2 (open, panel sessions): deprecate the
  old sword poses/gestures (swordup, swordacross, swordback, swordbehind,
  sworddown, swordfront, swordhip, swordlevel, swordlow, swordshoulder,
  swordwaist) in favour of these** — most war panels are
  not drawn yet; swap the few existing uses when panels are revisited.
  **The solved arm of a two-handed grip now keeps its stored `elbowOut`
  as the elbow's free swivel** (hand pinned to the hilt, upper arm swings
  out, forearm compensates; both bones kept within ±75° of the paper;
  `src/parts.js`), and the pose lab keeps that arm's "elbow out" handle.
- **Pose composition: bases, gestures, lab compose (2026-11-07):**
  `bases` (27) and `gestures` (42) in `data/pose-index.json` — the
  distinct lower / upper bodies, one-word names (bases named by the
  artist; gesture names first drafts), each with a desc and its poses;
  a test keeps every pose in exactly one of each. Catalogues:
  `tools/base-catalogue.mjs`, `tools/gesture-catalogue.mjs` (published
  pages, URLs under Commands). The pose lab has Base and Gesture
  pickers that compose a draft (`<base>-<gesture>`; a bowing gesture
  carries `lean` in the index; the base's feet are kept by the leg
  solve); tune and save as a whole pose. **Decided: poses stay whole in
  poses.json and panels keep referencing them** — the index is the
  mapping layer; no reference migration.
  `docs/proposals/2026-11-07-pose-composition.md`.
  **All 48 poses recomposed from the grid (2026-11-07,
  `tools/recompose.mjs`, shared solves in `tools/compose-lib.mjs`):**
  legs + lean + arms + chest are now derived from each pose's base ×
  gesture (editing a reference pose then `recompose --base/--gesture`
  propagates); gaze (neck/head), mouth, tail and turn stay the pose's
  own. The artist-approved merges became real: sword/bow/hand stands on
  step's legs, sword lunges on lunge's stride, walk-passing with
  walk's arms, leap-flat = the lying body flying. The sword-lunge arms
  were raised to keep the blade above the ground on the deeper stride
  (a buildShapes ground test guards all species). Gesture splits while
  recomposing: propback (sit-lean-back props on its hands, not
  armsback), swordlevel (stand-sword-forward's level blade, not
  swordwaist's angled one); 44 gestures.
- **Pin feet and Join hands in the pose lab (2026-11-07):** "Pin feet"
  toggle (on by default, next to Joints): while lean or chest is dragged,
  every foot touching the ground keeps its place under the body — that
  leg's hip and knee are re-solved by closed-form two-bone IK on the
  probe render's joints, targets pelvis-relative, always the
  knee-bends-backward branch. Planted = the foot's lowest node within
  0.06 of the ground: `joints.<side>.low` added to the renderer's joints
  (`src/parts.js`; renders unchanged). "Join" button (Hands field):
  solves each arm's `elbowOut` so both hands land on the body's midline
  in the front view (joined palms, clasped hands; the forearm is kept
  within 40° of the paper — past that the side-view hand foreshortens
  into a splayed fan instead of the drawn hand). Proposal updated
  (`docs/proposals/2026-11-07-contact-constraints.md`; lookAt, held-by
  still open). Found via `low`: kneel's forward foot and sit's stretched
  heel hover above the ground (problem-poses).
- **Devotion poses (2026-11-07):** `stand-palms-joined`,
  `kneel-palms-joined`, `kneel-bow` added to `data/poses.json` as first
  drafts (written directly, not lab saves); index entries moved out of
  `wanted` (14 left). Artist's direction: the overlap is the crux of
  joined palms — the hands lie exactly on each other in the side view
  (the far arm's shoulder/elbow solved to cancel the drawn 0.27 far-
  shoulder depth offset; other poses keep that natural shift). Upper
  arms hang straight (`out` 0), only the forearms converge (`elbowOut`
  ~-38, solved) so the palms meet at the chest midline in the front
  view — never more than ~40° of forearm out, past which the side-view
  hand foreshortens into a splayed fan;
  heads bowed (total pitch ~22°, kneel-bow ~54°). kneel-bow bows with
  lean 22 + chest 42 and the hips raised by Δlean so the legs stay
  planted (the manual version of the proposed pin-feet solve). Pose lab
  republished. Panels using the old `adjust` workarounds (03.05, 07.03,
  07.06, 07.11, 07.14, 08.11, 02.02…) swap to the real poses in the
  panel-revisit pass, not here.
- **Sections 07 "Sugriva and Bali" and 08 "Hanuman finds Sita"
  (2026-11-07):** `panels/07-sugriva-and-bali/` 07.01–07.14,
  `panels/08-hanuman-finds-sita/` 08.01–08.11. New openers 07.01 / 08.01
  (hills on the horizon), so the manuscript's 07.01–07.13 → 07.02–07.14
  and 08.01–08.10 → 08.02–08.11 (manuscript conversation needs the same
  change). Bali = `monkey1` (id bali, white cloth, scale 1.1); Angad =
  `monkey1` (scale 0.75); **Tara = `queen2` (red cloth)**, since there are
  no female monkeys: artist to confirm. Ashoka grove (08.08–08.11)
  follows 06.07 (geru). New placeholder props `hills`, `fire`,
  `tree-uprooted`, `jar`, `umbrella`, `rain-cloud`, `ring`, `mountain`,
  `lanka-wall`; night is a hex ground. Weakest: 07.04 (princes on
  Hanuman's shoulders hide his head; wants walk-carry-shoulder), 07.08
  (stand-pull). Needs also kneel-palms-joined, stand-palms-joined,
  kneel-bow, lie-back, sit-hand-on-head, crouch-ready, clasp hands.
- **Chapter openers, Lanka, Jatayu (2026-11-07):** each chapter starts
  with a location panel (table in `docs/design/composition.md`). New
  01-intro/01.01 (palace on the horizon); 04.01 = the forest hut from
  above (as 03.01); 05.01 = Lanka across the sea (artist's
  `layouts/scenes/0.5-lanka.svg`, prop `lanka-island`, grounds `sea`,
  `mist`). Renumbered: 04.01–04.11 → 04.02–04.12; 04.12 (Surpanakha
  before Ravana) → 05.02; 05.01–05.09 → 05.03–05.11. Chapter 10 opens
  with the same Lanka when made. Jatayu sheet
  (`data/props/sheets/jatayu.svg`) → props `vulture-fly`, `-swoop`,
  `-fall` (mirrored to face right), `-stand`; used in 03.05, 06.01–06.03;
  `vulture` placeholder → `vulture-lie` (06.10, 06.11). The manuscript
  (separate conversation) needs the same openers and renumbering.
- **Scene layouts, prop art, sky, seat (2026-11-07):** the artist's four
  compositions kept as drawn in `layouts/scenes/` (0.5-forest,
  0.5-lanka-throne, 0.5-deer, 0.5-deer-running; index with what each suits
  in its README; panel field `layout` names the one followed). Props
  extracted unchanged (outer scale only) into `data/props/`: `throne`
  (seat anchor), `golden-deer`, `golden-deer-run`, `hut-top`, `trees-top`,
  `tree-top`. Arranging rules: `docs/design/composition.md` (grows with
  each new layout). Renderer: panel `sky` + `horizon` (default 0.37), row
  `horizon` (16 px/head-unit at 0.75), figure `on: "<prop>"` (sits on its
  `seat`), prop `facing: left`; prop anchors in a group `id="anchors"`;
  prop ids stripped. New grounds sage, dry-grass, dark-green, stone-grey,
  sky. Panels: 03.01 from the forest layout, 05.03 sky + leaping deer on
  the horizon, 05.02 deer art, thrones in the mid row (02.01–02.03,
  04.12), 02.03 king seated on the throne (`sit`; wants
  sit-hand-on-head). His gold crown vanishes against the gold throne back.
- **Panel sizes 0.75 / 0.5 / 0.3 (2026-11-07):** no full-screen panels
  (too tall); `SIZES` in `src/scene.js`, any other size is an issue. The
  eleven size-1 panels (02.05, 03.01, 04.01, 04.09, 05.02, 05.03, 05.09,
  06.01, 06.04, 06.06, 06.07) are now 0.75 (06.04 / 06.06 backgrounds
  scaled to 540). New 0.3 strip; layouts 0.3-far/-wide/-mid, 1-far
  removed. The manuscript's "full" sizes (separate conversation) need
  updating.
- **Drawn faces at the drawn angles (2026-11-07):** `headTurn(..., {
  drawn })` uses the artist's front drawing when the face looks straight
  at the viewer and the side drawing when the head is seen exactly from
  the side (tilt = a turn in the picture), so every side-view figure
  looking ahead shows the side face exactly as drawn (Rama's hair, Ravana's
  maroon side hair). Slices (volumes) only for the angles between.
  Figures, head-turn sheet and pose lab Face tab pass the drawings.
  `docs/design/faces.md`.
- **Rama's side bun moved (2026-11-06):** moved up 0.084 head-units (a
  translate only, curves unchanged) so it spans the same heights as the
  front bun; round at turn 90. The "fit side parts by height" rule was
  reverted: mismatches are fixed in the drawings (the import lists them).
  Rama's side front-hair piece also moved up 0.045 to match the front.
- **Artist's Ravana and Rama faces (2026-11-06):** Ravana with fixed
  earrings; Rama with the hair split (front: bun + front hair in `over`,
  back hair in `back`; side: back piece in `back`). Rama's file came as a
  plain SVG (no layer names); the names were restored by layer order.
  Import: anything hidden in Inkscape (layer or single shape) still
  counts (`tools/faces-lib.mjs`); Rama's front back hair was hidden in the
  file and is drawn. Face turn pairing prefers a side part of
  the same colour, and mirrored front parts (earrings, moustache halves)
  share one side part (`tools/face-turn.mjs`); only rama and ravana changed.
- **Ravana's turned head fixed (2026-11-06):** the face-turn import paired
  his second front earring with the side drawing's red lips (one side
  earring for two front ones), so turned heads showed a red blob at the
  mouth and a half moustache. Now a mirrored pair of front parts shares
  one side part (`tools/face-turn.mjs`); only Ravana's turn data changed.
  Orange crown + yellow jewel (a copy of Sugriva's) deleted from Ravana's
  front face at the artist's request. Pose lab save `chair` (new) not merged yet.
- **Elbow and knee out (2026-11-06):** pose settings `arm.elbowOut`,
  `leg.kneeOut` (degrees, + away from the body): the forearm + hand point
  out by out + elbowOut, the shin by out + kneeOut (`src/parts.js`; held
  props and the two-handed grip follow the forearm). Pose lab: front-view
  handles "elbow out" / "knee out". Style bible §6. Existing poses
  unchanged (default 0).
- **Layouts and shots (2026-11-07):** `layouts/<size>-<shot>.svg`
  (`layouts/README.md`): no layers (artist's wish): a locked group `page`
  (rectangle + row ground lines), simple men as plain groups. Shots = row sets in `SHOTS`
  (`src/scene.js`), panel field `shot`: `far` (default, the old rows),
  `wide` (bigger whole figures) and `mid` (front row cut at the thighs,
  ground below the panel; the panel crops) measured from the artist's
  `0.75-wide.svg` / `0.75-mid.svg`. Generated: 1-far, 0.75-far, 0.5-far,
  0.5-wide, 0.5-mid (`node tools/layout-template.mjs 0.5 wide`). Mostly
  0.75 and 0.5 panels from now on, 1 rarely.
- **First prop art: palace (2026-11-06):** `data/props/palace.svg`, a
  one-colour silhouette (sepia, openings cut out) simplified from the
  artist's palace reference; 10 × 4 head-units. `tools/lib.mjs`
  `loadProps` reads `data/props/<id>.svg` (100 px = 1 head-unit, size from
  the viewBox). Used in 02.05 (moved to at 0.55 so it fits).
- **Reader site publishing (2026-11-06):** Cloudflare Pages project
  `ramayana` connected to GitHub as in kena (Cloudflare builds), with
  automatic builds off; `.github/workflows/publish-site.yml` (manual
  dispatch) calls the deploy hook (secret `CLOUDFLARE_DEPLOY_HOOK`). One
  site, `https://ramayana-7fw.pages.dev`, private via Cloudflare Access
  (account members only). Later: turn automatic builds on and
  delete the workflow. Owner setup still to do (docs/design/panels.md,
  Publishing).
  Site = an index of all chapters from scenes.md (those without panels
  "to come") + one scrolling page per chapter, previous / next links.
- **Sections 05 "The golden deer" and 06 "Jatayu" (2026-11-06):**
  `panels/05-the-golden-deer/` 05.01–05.09, `panels/06-jatayu/` 06.01–06.11.
  Maricha = `raxas_m1` (id maricha, white cloth); the ascetic = `sage1`
  (id ascetic, club as a stand-in staff); the flying chariot is a
  placeholder prop in the front layer with its riders lifted into it.
  New placeholder props `golden-deer`, `chariot`, `lanka`, `rocks`,
  `jewels`, `pyre`; placeholder backgrounds 06.04 (hill), 06.06 (waves).
  Needs: run with bow, staff/pot, vulture states
  (wings spread, falling, lying), heads looking up, all prop art.
- **Section 04 "Surpanakha" panels (2026-11-06):** `panels/04-surpanakha/`
  04.01–04.12. Artist's direction: 04.01 is Surpanakha watching the three
  from behind a tree (replaces "a fair woman comes up to Rama"); she stays
  a rakshasi throughout (no fair form, no transformation in 04.04), always
  the `surpanakha` character, whose cloth is now `red-check`. Khara =
  `raxas_m1` (id khara, red-diamond). Held props set by `adjust`
  (04.08 bow, 04.09 clubs). New placeholder prop `cave`. Needs: hut, tree,
  cave, throne art; held spear; fan of arrows effect; stand-embrace.
  The manuscript (separate conversation) still has the fair form in
  04.01 / 04.04 and `raxas_f1` for her rakshasi form in characters.md.
- **Section 03 "The forest" panels (2026-11-06):** `panels/03-the-forest/`
  03.01–03.06 (03.01 top view, size 1, green hex ground, placeholder
  `hut-top` / `trees-top`; 03.02 lake + birds placeholder background
  `03.02.svg`; 03.03 deer ×3 placeholders; 03.04 sage seated, raised hand
  by `adjust`; 03.05 joined palms by `adjust` until `stand-palms-joined`,
  vulture placeholder on the tree; 03.06 Sita reaching to the tree). New
  placeholder props `hut-top`, `trees-top`, `deer`, `vulture`; props take
  `lift` (`src/scene.js`). Needs: sit-cross-legged, stand-palms-joined;
  deer, vulture, tree, top-view hut/trees art; tally marks.
- **Pose names revised (2026-11-06):** 14 poses renamed to name the
  visible body, prop right after the base (style bible §7,
  `docs/design/pose-picking.md`): stand-guard → stand-fists-up,
  stand-throw → stand-arms-overhead, stand-wind-up → stand-arm-back,
  stand-stagger-back → stand-step-back, leap-dive → leap-flat,
  fall-headlong → fall-forward, stand-shoot-bow(-raise/-release) →
  stand-bow-draw(-high) / stand-bow-release, stand-sword-overhead / -high /
  -guard → stand-sword-up / -across-head / -waist, lunge-sword-thrust /
  -strike → lunge-sword-forward / -down. No old-name mapping; the six lab saves
  under old names were re-saved under the new ones (same angles, old
  saves deleted). Walk saves merged (`walk`, `walk-passing`
  reworked); `stand-look-left` save deleted.
- **Neck (2026-11-06):** always drawn behind the head (with the head's
  depth unit when the head is behind the torso); 1.5 × the drawn length
  (`NECK_STRETCH` in `src/parts.js`; style bible §6).
- **Joint handles in the pose lab (2026-11-06):** dots on every joint;
  tap → ring + knob, drag to turn. Side view: lean, chest, neck, head,
  shoulder, elbow, wrist, hip, knee, ankle; front view: shoulder / hip
  `out`. Each move solves the value numerically (probe renders) so the part
  follows the pointer; the view is held still while dragging (no
  re-centring jump); name + angle label while a joint is selected; tapping where two
  dots meet cycles them; dots closer than 0.15 are pushed apart (display
  only: both hips, shoulders and neck in the side view); the solved arm of a two-handed grip has none.
  `renderFigure` / `buildShapes` return `joints` (figure frame: limbs
  sh/E/Wr/grip/hp/Kn/A, spine pelvis/waist/neck/head/H).
  Sliders for dragged angles removed (panels keep head turn, tail, wrist
  turn, hand, toe turn, prop); ranges in `RANGES`. "Joints" toggle on the
  stage hides the dots (remembered per browser).
- **Right / left and head turn in degrees (2026-11-06):** poses name limbs
  `right` / `left` (the character's own; right = the side view's near
  side; `normalizePose` still reads near / far and maps them; the renderer
  keeps near / far inside; `storedPose()` writes right / left). `look` is
  gone: `spine.turn`, −90 … 90 from the body's front, + to its right (lab
  slider "head turn"; panels `turn`). The front view is now flipped so the
  right side is on picture-left (head drawing not mirrored: R conjugated),
  so a head turns to the same side of the body in both views. Migrated
  poses.json, pose-index `hold`, panel `adjust` paths (old `near.`/`far.`
  paths and old lab saves still load). Lab: Right / Left panels, prop hand
  Right / Left, no Look buttons.
- **Two tones (2026-11-06):** left leg (thigh/cloth, shin, foot) and torso
  (skin or full top) 5% lighter (toward white) (`SHADED`, `shade()` in `src/figure.js`;
  style bible §3, §4).
- **Pose lab saves merged 2026-11-06:** 26 saves; only `walk` changed
  (merged). `stand-look-left` (= `stand` with look left) not merged: head
  direction isn't a pose (pose-picking rule 3). Saves stay in the lab.
- **Weapons on reference lines + two-handed poses (2026-11-06):**
  `data/props/held/sword.svg`, `club.svg`, `bow.svg`: layer `base` plus
  optional layers named by character id (own version); each drawing
  carries its `line` (straight; bow: curve + `grip`), whose ends place it
  and whose length is the weapon's (100 px = 1 head-unit; no separate
  reference file). `tools/import-held.mjs` → `data/held.json`; figures
  pick their character's version (`who` from `characterLook`), else base. Bow doubled (≈5.8 head-units). `grip:
  "both"` solves the other arm in 3D to the hilt. 44 poses: overhead /
  shoulder / guard now two-handed, new `stand-sword-across-head`, `-hip`,
  `-forward`, `-behind-head`, `lunge-sword-down` (all usable for a
  club). Pose lab: a 4th panel "Prop" (holds None/Sword/Club/Bow, hand
  Near/Far, angle, out, grip, bow string; one prop at a time); the four
  panels side by side (2 columns under 640 px).
- **New poses and held props (2026-11-06):** 11 poses from the artist's
  reference sheets (angles only, not traced): `walk`, `walk-passing`;
  `stand-bow-draw`, `stand-bow-draw-high`, `stand-bow-release`;
  `stand-sword-up`, `stand-sword-shoulder`, `stand-sword-waist`,
  `stand-sword-back`, `lunge-sword-forward`, `lunge-sword-low` (39 poses;
  index entries; walk / shoot gaps closed). Held props: `arm.prop`
  (`kind` sword | bow, `angle` from the hand, `out`, `draw` for the bow
  string to the other hand): generic shapes along a reference line
  (`src/parts.js`), pose lab prop / bow string controls. Drawings along
  the line and two-handed grips: `docs/proposals/2026-11-06-held-props.md`.
- **Pose picking (2026-11-06):** `data/pose-index.json` (per pose: desc,
  ground, hold, story-moment tags, nearest poses; tag words; `wanted`
  poses in order with what to use meanwhile; a test keeps it in step with
  poses.json). Rules and names: `docs/design/pose-picking.md` (style bible
  §7 extended). Tools: `pose-catalogue.mjs` (thumbnails + tags by base),
  `pose-gaps.mjs` (→ `docs/issues/missing-poses.md`; `--scenes` gives
  candidate poses per scene). Shoot and walk now covered; moments
  with no pose: ride/chariot (15 scenes), embrace (4); next wanted:
  stand-palms-joined, kneel-bow. Section 02 panels use walk / walk-passing
  (02.05 looks back with `turn` 90; 2026-11-06).
  Next: pose picker in the panel lab (filter by moment, tap to insert).
- **Steps 3 and 4 finished (2026-11-06):** pose settings `spine.turn`
  (head turn, any angle; `look` is its shortcut) and `leg.toe` (toe turn);
  pose lab sliders "head turn", "toe turn". Feet blend front / side / sole
  drawings by direction (old front-view foot rule gone). Head centre from
  the `head` / `side-head` anchors (male side head 0.12 behind the neck
  top); neck projected without a minimum length. Steps list in
  `docs/issues/rules-to-migrate.md` (remaining: any view angle, back view).
- **Head turn (step 4, merged 2026-11-06 from branch `head-turn`):** heads at any turn and tilt
  from the front and side face drawings: `tools/face-turn.mjs` (import:
  volumes lofted per row from the paired front/side elements, other
  elements as cards on the surface; `turn` in `data/faces.json`),
  `src/headturn.js` (`headTurn(turn, yaw, pitch)`, slabs sorted by depth
  with a layer bias), `node tools/head-turn-sheet.mjs [ids]`. Pose lab:
  Pose / Face tabs, character picker in the header, pattern picker
  removed; the Face tab shows the grid (turn 0–180°, up/down 20, 40, 90°;
  the 30° and 60° turns need drawing updates, decided better than the
  rule-based switch). **Used by the figures** (2026-11-06): `headMatrix`
  from lean + chest + neck + head and `look` (0 / ±90°), both views; the
  `back` part (as drawn in the nearer view) behind the body. Replaces the
  face switch, flip and up/down faces. Face tab: ±90° rows, mouth picker.
  Import lists front/side height mismatches (every face has some; the
  artist fixes the drawings; front-only rows get a rounded cap).
- **End-on parts + toes-first front foot (2026-11-06):** both body files
  have an `end` layer (upper arm, forearm, thigh, shin end-on; sole of the
  foot; anchors end-shoulder/elbow/hip/knee/ankle, end-toe), used since step 5.
  The front foot is drawn toes at the viewer (artist's male, scaled 0.9
  for the female); feet have 7 edges (all three views).
- **Step 5 done (2026-11-06):** each limb part, hand and foot shows a blend
  of its front, side and end drawings by its own 3D direction (`dpLook`,
  `dpShape` in `src/parts.js`); new pose setting `arm.twist` (wrist turn,
  pose lab slider). Removed: the 0.8 × width end-on rule, the front hand
  ignoring the wrist, the front-view foot turn. Kept: thigh fold, mirrored
  point hand. `export-parts` writes the end layer back. Steps list:
  `docs/issues/rules-to-migrate.md`. Next: step 3 (feet by toe direction) or 4
  (head turn/tilt).
- **Faces split into base + character (2026-11-06):** `data/faces/base/
  <species>.svg` (skin painted in the body colour, eyes, mouths, anchors
  top/chin; optional `front-up`/`front-down` versions, empty so far) and
  `data/faces/<id>.svg` (`under`, `over`, `back`, `hair-body`, optional own
  `eyes`/mouths; guide shows the base). Bases from rama, sita, hanuman.
  `tools/face-templates.mjs` refreshes guides + templates after a base
  change; `tools/split-faces.mjs` was the one-time split; merge-faces
  removed. Front view picks up/down at ±25° head tilt. Face sheet fixed
  (front view, body scale). The five female copies (kaikeyi, raxas_f1,
  queen1, queen2, surpanakha) were copies of sita. Artist's new sita,
  queen1, raxas_f1 (2026-11-06; front/side hair with matching node counts
  for later blending); kaikeyi and queen2 = copies of the new sita;
  surpanakha still the previous sita.
  Face guides show torso and neck only.
- **Hands shared (2026-11-06):** `data/parts/hands.svg` (fist/out/in/point,
  front/side/end, male size); body files have one guide `hand` (the "in"
  hand) and get the hands scaled to it (female 0.88).
- **Front torso (2026-11-06):** the front drawings as drawn, picked by
  |lean + chest| folded at 90° (deepest at 90°, turned over past it); no
  projected heights, no minimum rule. Front and side heights can differ in
  bent poses; the artist adjusts drawings.
- **Limbs (2026-11-06):** thigh top folds into the body by cos(angle) in
  side view (no 0.12 cap band; arms plain); an end-on limb's extra length
  goes back over its upper joint (kneel). (End-on rule replaced by the
  end drawings in step 5.)

- **Drawn parts (merged into main 2026-11-05):** figures are built from the
  artist's drawn body parts (`data/parts/male.svg`, `female.svg` →
  `tools/import-parts.mjs` → `data/parts.json`; `tools/export-parts.mjs`
  writes the SVG back; renderer `src/parts.js`; `docs/design/drawn-parts.md`).
  9-node torsos with two bend keys; front view = projection with shared
  heights; limbs have `out` (out of the paper); draw order by depth;
  no loincloth; monkey = male parts + tail (`tail.turn`); characters can
  have a body `scale` (monkey1 0.8). What is still rule-based:
  `docs/issues/rules-to-migrate.md`; pose/face problems from the self-review:
  `docs/issues/problem-poses.md`. Next steps there: feet by toe direction (3),
  head turn/tilt + back of head (4), wrist turn + end-on hands (5).
  `anatomy`/parts-sheet/face templates still use the rule-based shapes.
  Pose lab: wide layout on full screen.

- **Code review 2026-11-04:** test suite added (`npm test`, 38 tests incl.
  a 380-render snapshot). Dead code removed (unused geom helpers, the
  old ear-curl and `open` shape paths, unused params). Tools share
  `tools/lib.mjs` (replaces `panels-lib.mjs`) and `tools/svg.mjs`.
  `renderFigure` takes an `id` prefix (panels no longer rewrite ids by
  regex) and a character look can be spread straight into its options.
  All renders, sheets, the site and generated data are unchanged.
- **Every character must have a drawn face, front and side; no fallback**
  (decided 2026-11-04). Panels list a missing face as an issue and
  `import-faces` reports it. The hand-drawn species hair (`data/shapes/`,
  `import-hair`, `export-hair`, `head.hairShape`) was retired.
- **Species heads are only a size guide** (decided 2026-11-04): `head` is
  `{ size, width }`, drawn as a plain rectangle (template guide, species
  views). Generated ears, eyes, mouths, hair, taper and the eye-colour
  rule were removed; their rules now live in style bible §5.6 as drawing
  guidance. Contact sheets draw a character of the species (`--who`);
  `head-sheet` was retired. Figures shift a pixel or two (hidden ears and
  taper no longer count toward their width).

- Three species, one skeleton, one shared set of poses: **monkey** (done,
  tuned by the artist), **male**, **female**. Mouth shape per species
  (arch/box/wedge) is drawn in the faces; poses pick mouth size 1–3.
- **Characters** in `data/characters.json` (18, incl. queen1, queen2,
  surpanakha, sage1 added 2026-11-03 as copies for the artist to customise: species, body colour as a
  hex matching the drawn face's skin, outfit, cloth colour). The pose lab
  has no colour controls.
- **Faces are the artist's drawings** (decided 2026-11-02): one SVG per
  character in `data/faces/<id>.svg` with top-level layers `front` and
  `side` (merged 2026-11-05; split into base + character 2026-11-06, see
  above), templates in `data/faces/templates/<species>.svg`;
  `tools/import-faces.mjs` → `data/faces.json`. Never edit the drawings'
  curves or colours; only place, rotate and mirror (only the base skin
  takes the body colour). All 18
  characters have front and side faces (raxas_m1 = copy of indrajit;
  queens and surpanakha = copies of sita; sage1 = dasharatha without
  crown, white beard). No generated fallback: every character needs
  both faces. Check with `node tools/face-sheet.mjs` (one US-letter page, PNG + PDF).
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
  `stand-lean-back` + king `stand-step-back`; 02.03 `stand-point` and the
  king in front view, `stand-hand-on-head`.
- Manuscript is maintained in a separate conversation (`manuscript/`).
  Panel-side changes the manuscript hasn't caught up with go in
  `manuscript/pending-changes.md` (written by panel sessions, applied and
  deleted by the manuscript session) — not into chat notes.
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
- **Panels (spec route) implemented 2026-11-03** (`docs/design/panels.md`,
  `src/scene.js`). Delivery is a vertical scroll of full-width panels;
  `size` is a share of a screen height (mostly 0.75, sometimes 0.5 or 1);
  the id is the file name (not in the JSON); `at` can be a number 0–1;
  figures overlap in list order and scale with the panel (front row ≈ 2/3
  of its height). Sample: section 2 "The throne", 8 panels in
  `panels/02-the-throne/` (02.07 has a placeholder background SVG). Props
  are placeholder boxes (`data/props.json`). Poses are approximated with
  `adjust`; each panel's `needs` lists what's missing (walk, pull, slump,
  look back; throne, palace, tree). Site builder `tools/build-site.mjs` →
  `_site/`; published via Cloudflare Pages (docs/design/panels.md).
  Panel lab published.
- **Pose lab saves merged 2026-11-04** (20 saves, 13 with changes: bend-low,
  crouch-arms-over-head, fall-back, fall-forward, kneel, lie-front, run-low,
  sit, sit-lean-back, stand, stand-hands-on-hips, stand-point,
  stand-point-up). The saves stay in the lab.
- **Point hand** added 2026-11-04 (`hand: point`, like out with a 1.6×
  longer single finger and 0.6× grouped fingers; pose lab has a Point
  button). No pose uses it yet.
- **Next:** keep refining poses in the lab;
  **back view** for front poses that bend head-down, e.g. fall-forward
  (back of the head; needs a back-head layer in the face files and a back
  draw order; style bible §6); artist feedback on the sample; walk pose; props
  import (`data/props/<id>.svg`, like faces); template route (figure markers in an artist's scene SVG).
  The copied faces will be customised by the artist.
  `manuscript/characters.md` doesn't list queen1/queen2/surpanakha/sage1
  yet (manuscript conversation).
