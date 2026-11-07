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

- `docs/README.md` — how the docs are organised: `docs/design/` (how things
  work now, no history), `docs/proposals/` (dated, status at the top),
  `docs/issues/` (`rules-to-migrate.md`, `problem-poses.md`). Log every
  problem found in one of the two issue files.
- `docs/design/style-bible.md` — visual rules. Read it before changing the renderer.
- `docs/design/panels.md` — the panel language as implemented; lab; Cloudflare publishing.
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
    node tools/pose-gaps.mjs --scenes 04           # docs/issues/missing-poses.md; candidates per scene
    node tools/import-held.mjs                     # data/props/held/{sword,club,bow}.svg -> data/held.json

Pose lab (published artifact, saves poses to its database, collection
`poses`): https://claude.ai/artifact/631NuGY6VEftsybpaEDWUA
Saved poses are reviewed and then merged into `data/poses.json`.

    node tools/render-panels.mjs 02                # out/panels/02-*.png + issues/needs
    node tools/build-site.mjs                      # _site/ (Cloudflare Pages runs this)
    node tools/build-panellab.mjs                  # out/panellab.html (published artifact)
    node tools/layout-template.mjs 1               # layouts/template-1.svg (or 0.75, 0.5)

Panel lab (published artifact, drafts in its database, collection
`panels`): https://claude.ai/artifact/RrHEPbeEDjq9T5WGRJKhDG
Drafts are merged into `panels/` when asked; republish the lab after
renderer or panel changes.

## Status (2026-11-06)

- **Layout templates (2026-11-06):** `layouts/` with `template-1.svg`,
  `-0.75.svg`, `-0.5.svg` (page rectangle, row ground lines with scale, a
  man standing in each row, empty `sketch` layer) from
  `tools/layout-template.mjs`; `layouts/README.md`.
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
  Site = an index of all 15 chapters from scenes.md (those without panels
  "to come") + one scrolling page per chapter, previous / next links.
- **Sections 05 "The golden deer" and 06 "Jatayu" (2026-11-06):**
  `panels/05-the-golden-deer/` 05.01–05.09, `panels/06-jatayu/` 06.01–06.11.
  Maricha = `raxas_m1` (id maricha, white cloth); the ascetic = `sage1`
  (id ascetic, club as a stand-in staff); the flying chariot is a
  placeholder prop in the front layer with its riders lifted into it.
  New placeholder props `golden-deer`, `chariot`, `lanka`, `rocks`,
  `jewels`, `pyre`; placeholder backgrounds 06.04 (hill), 06.06 (waves).
  Needs: run with bow, staff/pot, Ravana's ten heads, vulture states
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
