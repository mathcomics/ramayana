# Panels: the modelling language

How a panel is described, rendered and published. This implements the spec
route of `docs/proposals/2026-11-03-scene-spec.md`; the template route (figure markers in an
artist's scene SVG) comes later.

## Three layers

| Layer | Where | What |
|---|---|---|
| Scenes | `manuscript/scenes.md` | The story as chapter briefs: each chapter's arc in 3–6 beats, plus the continuity-and-motifs list. **Guidance**, not a definition: the panel side breaks beats into panels (one beat may be several panels) and owns ids, heights, shots and order. |
| Panel definitions | `panels/<NN-section>/<id>.json` (+ optional `<id>.svg`) | What the renderer draws. One file per panel. |
| Rendered panels | `_site/` (not committed): an index of chapters (all `## N.` headings of `manuscript/scenes.md`; those without panels marked "to come") and one scrolling page per chapter with previous / next links | Built by `tools/build-site.mjs`; published to Cloudflare Pages by hand (GitHub Action calls a deploy hook). |

The **panel lab** (`tools/build-panellab.mjs`, published artifact) shows any
section as it will scroll on a phone while you edit a panel's JSON.

## Delivery: a scroll of panels

The reader scrolls one long column. Every panel is the full width (360
units) and `tall` × that width high: **1.5** (540 units, most panels),
**1** (360, square) or **0.6** (216, a strip). Nothing taller than 1.5. Panels follow each other in id order; there
are no screens or pages to fill.

### Ids

A panel's id is its file name, `<chapter>.<nn>` (`05.07`), and panels
sort by it numerically. **A panel inserted later takes a letter, so
nothing else moves**: after `05.01` comes `05.01a`, then `05.01b`;
between `05.01a` and `05.01b` goes `05.01aa`; after the last panel the
next number (`05.23`). Ids are cited all over the docs, the data and
the lab's drafts, so a renumbering touches dozens of files: do it once,
when the artist calls a chapter settled, with
`node tools/renumber-panels.mjs 05` (`--dry` first). Merge or delete
that chapter's lab drafts before renumbering — they are stored by id.

## Panel definition

`panels/02-the-throne/02.03.json`; the **id is the file name** and is not
repeated inside the JSON.

```json
{
  "scene": "Kaikeyi points Rama away; the king slumps",
  "tall": 1.5,
  "ground": "dusty-pink",
  "figures": [
    { "prop": "throne", "at": 0.88 },
    { "character": "dasharatha", "pose": "stand", "facing": "left", "at": 0.74,
      "adjust": { "spine.chest": 40, "spine.lean": 10 } },
    { "character": "rama", "pose": "stand", "facing": "left", "at": 0.16, "mouth": 1 },
    { "character": "kaikeyi", "pose": "point", "facing": "left", "at": 0.48, "mouth": 3 }
  ],
  "needs": ["pose: slump (or sit, on the throne)"]
}
```

### Panel fields

| Field | Values | Notes |
|---|---|---|
| `scene` | text | The scene line it draws, for reference only. |
| `tall` | `1.5` · `1` · `0.6` | Height as a multiple of the width (360). Default 1.5. Anything else is an issue, and so is the old `size` field. |
| `ground` | name from `data/grounds.json`, or a hex | Background colour. |
| `sky` | name from `data/grounds.json` (`sky`), or a hex | A colour above the horizon (outdoor panels). |
| `horizon` | 0–1 | Height of the horizon above the bottom edge, as a share of the panel. Default 0.37. Row `horizon` stands things on it. |
| `tags` | list of words (`panic`, `crowd`, `flee`, `giant` …) | Marks an **approved reference panel**: reviewed with the artist, the model for compositions of these kinds (the panels replace the retired `reference/` images as the yardstick). Find them with `grep -rl '"tags"' panels/` before writing a similar scene. A tagged panel is never changed in a rework pass without the artist's consent; only the artist's review adds tags. |
| `figures` | one list of figures **and** props | An entry with `character` is a figure, with `prop` a prop. **One overlap rule: later entries draw over earlier ones** — a prop before the figures is scenery, after them a foreground that hides them (03.02's ridge), and props and figures interleave freely. (The old separate `props` list with `layer` back/front still renders, folded in around the figures — old lab drafts only; migrate on merge.) |
| `needs` | list of text | Missing poses, props, art. Collected into the to-do list. |
| `background` | file name | Optional; default `<id>.svg` next to the JSON. |

### Figures

| Field | Values | Notes |
|---|---|---|
| `character` | character id (`data/characters.json`) | Generic types (`monkey1`, `queen1` …) can repeat. (Old name `who` still reads.) |
| `pose` | pose name (`data/poses.json`) | Unknown pose → `stand`, with a warning. Picking: `docs/design/pose-picking.md`. |
| `facing` | `left` · `right` | |
| `at` | number, slot or relation | See placement. Default 0.5 (centre). |
| `row` | `top` · `horizon` · `back` · `mid` · `front` · `floor` · `closeup`, or a number | Where it stands and how big: see Rows. Default `front`. Rows don't change the overlap order. |
| `on` | a prop's name (its `id`, else its `prop`), optionally `#<anchor>` | Puts the figure on the prop's named anchor (default `seat`), at the prop's scale (`at`, `row`, `lift` are ignored; `scale` still applies). `seat`: the hips rest there (`"pose": "sit", "on": "throne"`); a `stand` anchor: the feet rest there (`"on": "kishkindha#stand"`). A `face` anchor is different: the **head alone** is drawn, centred on the anchor and sized by it — no body, so no neck and no `hair-body` (`"on": "sound-cry#face"`, the crier's face in the bubble). |
| `cloth` | palette colour, optionally with a pattern: `red-check` · `red-diamond` · `red-stripe` | Overrides the character's cloth for this figure (rakshasa variety). |
| `mouth` | 1 · 2 · 3 | Overrides the pose. |
| `view` | `side` · `front` | Default `side`. Front is derived from the side pose. |
| `turn` | degrees, −180 … 180 | Head turn from the body's own front, + to its right; overrides the pose's `spine.turn`. ±90 faces the viewer; ±180 is a full look back (profile facing backward, 11.08). |
| `hands` | `{ "right": "point", "left": "fist" }` (fist · out · in · point) | Overrides the pose. |
| `adjust` | `{ "right.arm.shoulder": 60 }` | Joint angles over the pose, same paths as `data/poses.json` (the character's right / left; older `near.` / `far.` paths still work). For one-off gestures; a gesture used twice becomes a pose. Can also give a hand a held prop: `"left.arm.prop": { "kind": "bow", "angle": 90 }`, or swap one (`"right.arm.prop.kind": "club"`). |
| `scale` | number | This figure only (a child, a giant). |
| `lift` | head-units | A small adjustment up (+) or down, in the figure's own head-units (a hop, feet on a ledge). Anything placed high — flight, a top view — takes a numeric `row`. |
| `nudge` | head-units | Small horizontal shift after placement. |
| `id` | text | Name for relations when the same character appears twice. |

### Props

`{ "prop": "throne", "at": "right", "row": "back" }` — an entry of the same
`figures` list; its place in the list is its depth (before the figures =
behind them, after = in front; the retired `layer` field is an issue).

- `prop`: a drawing's id (`data/props/<id>.svg`); a prop scales with its
  row.
- Artwork: `data/props/<id>.svg`, 100 px = 1 head-unit, bottom edge on the
  ground; its viewBox sets the prop's size. Any SVG there is a prop — no
  registry. A prop id with no artwork yet renders as a **labelled dashed
  box** of a fixed 2 × 2 head-units (`PLACEHOLDER` in `src/scene.js`).
- `at`, `row`, `scale`, `lift`, `nudge`, `id` as for figures.
- `facing`: drawings face right; `left` mirrors the prop (and its anchors).
- Recolouring: a prop whose drawing names role colours on its root
  element (`<svg data-recolor-body="#a05a2c" data-recolor-cloth="#c8ab37" …>`) takes
  `character` (a character id: that character's body and cloth colours), or
  explicit `body` / `cloth` (hex, or a cloth palette name; a pattern
  suffix keeps the base colour). So one drawing serves many characters:
  `{ "prop": "male-top", "character": "rama" }`.
- Anchors: a group `id="anchors"` in the prop's SVG holds named circles
  (not drawn). `seat`: where a seated figure's hips rest (`on`).
  `stand`, `stand-left`, `stand-right`: where a standing figure's feet
  rest (`on` with `#`, e.g. `"on": "kishkindha#stand"`; `ledge` and
  `kishkindha` have them). A prop can stand `on` another prop's anchor
  too — its bottom centre lands there, at the carrying prop's scale
  (`palace-lanka` on `"lanka-island#stand"`).
- **Naming an anchor**: after *what of the figure lands on it*, never
  after where it sits in the drawing — `seat` (hips), `stand` (feet),
  `face` (the head alone, as in `sound-cry`). Lowercase, one word, the
  bare name for the only or default one, `-left`/`-right` for variants
  of the same kind (two places a figure could stand) — never for parts
  of one anchor. The parts and face sheets name their anchors the same
  way (`nape`, `neck-top`, `wrist-left`).
- **An anchor's size**: an anchor that places a whole figure (`seat`,
  `stand`) is a point; its circle is only a marker and the radius means
  nothing. An anchor that places a part is *drawn to size*: the circle's
  **diameter is the head's height**. A head is 1 head-unit tall for every
  species (only the width differs: monkey 1.0, male 0.88, female 0.74),
  and the drawing is 100 px = 1 head-unit, so `r="50"` is a full-size
  head and `sound-cry`'s `r="40"` is 0.8 of one. One circle carries both
  the place and the size — a tilted head is the panel's `adjust`, not the
  prop's.
- **Delivering a drawing** (what saves an edit on import):
  file name = the prop id, kebab-case, saved as
  `data/props/<id>.svg`; the header comment says what *this* drawing is
  (a copied header from another file is the commonest fix); the page
  cropped to the drawing (Inkscape *Resize page to drawing*), 100 px =
  1 head-unit at the size it should appear at `scale` 1; facing right;
  the bottom edge on the ground, or a part that enters from outside the
  panel cut straight at that edge; colours that a panel should change
  drawn in one exact fill each (the skin one hex, the cloth one hex —
  a nail or sole in another colour will not follow a recolour), using
  the character's or palette hex where it belongs to one; stroke width
  matching the props it will stand beside; anchors as named circles in
  a group `id="anchors"`.
- Drawn so far: `palace-ayodhya`, `palace-lanka` (the golden rework,
  Lanka's palaces; also small on `lanka-island`'s `stand` anchor),
  `golden-deer`, `golden-deer-run`,
  `hut-top`, `trees-top`, `tree-top`, `lanka-island` (the bare island —
  the city split off into `palace-lanka`, 2026-11-08),
  `vulture-fly`, `-swoop`, `-fall`,
  `-stand` and `vulture-wing` (the wing Ravana cuts off — a lone wing,
  not a bird; all from the artist's Jatayu sheet,
  `data/props/sheets/`), the thrones `throne-ayodhya` (gold-backed,
  Dasharatha's — the two throne drawings were interchanged by the artist
  2026-11-08), `throne-lanka` (dark, under the red disc with a dark
  centre, Ravana's) and `throne-kishkindha` (gold
  stupa dome on a dark post, Sugriva's coronation),
  `ledge`, `ledge-jatayu` (the bluff Jatayu rests on; one `seat` on the
  top), `kishkindha` (rocky; seeded-random outlines, stand anchors),
  the giant's parts for chapter 14 `giant-feet`, `giant-fist`,
  `giant-grab` (reaching down from above), `giant-lie-waist` (the
  sleeping giant's middle) — each cut off at the frame edge it enters
  from, and recolourable (`body`, and `cloth` on the waist) so the four
  share one skin in a panel; the placeholder `giant-fingers` in the
  locked 14.05 stays until the artist swaps it,
  the flowers `flower-droop`, `-white`, `-pink`, `-yellow`, `-orange`,
  `lotus-bud`, `lotus-full`, `fire`, `vine`, and the top-view people
  `male-top`, `male-top-back`, `female-top` (recolour, see above). How to
  arrange them: `docs/design/composition.md`.

### Placement

- **Number**: 0–1 across the width (0.5 = centre), where the figure's
  centre stands. Figures may overlap; crowding is fine.
- **Slots**: `left`, `center-left`, `center`, `center-right`, `right`
  (0.14, 0.32, 0.5, 0.68, 0.86).
- **Relations**: `{ "before": X }` (in front of X's face), `{ "behind": X }`,
  `{ "beside": X }` (toward the open side), `{ "left-of": X }`,
  `{ "right-of": X }`. X is a figure's `who`/`id` or a prop's `prop`/`id`.
  The two bounding boxes touch; `"gap"` adds space in head-units
  (negative overlaps).
- `nudge` shifts by head-units after placement.

### Rows

`row` says where an entry stands vertically and how big it is, by name
or by number — as `at` does across. Shares are of the panel height, so a
row looks the same in a panel of any height.

| `row` | Bottom edge | Size (a man standing = 6.1 head-units, as drawn) |
|---|---|---|
| `top` | the entry's **top** edge on the panel's top edge | as `front` |
| `horizon` | on the horizon line | far away: 16 px per head-unit in a 1.5 panel |
| `back` | 26 % (at the default horizon) | a man 22 % of the panel |
| `mid` | 15 % | 45 % |
| `front` (default) | 3 % | 69 % |
| `floor` | the bottom edge | as `front` (a foreground band sits flush: 03.02's ridge, 09.09's sea) |
| `closeup` | a panel below the bottom edge (−100 %) | a man's head at 75 %: he shows from about the waist up |
| a number | that share (0 = bottom, 1 = top; negative or above 1 crops) | as `front` |

`front`, `mid` and `back` are one-point perspective with the horizon as
eye level. A row at depth `t` (front 0.08, mid 0.4, back 0.7; 0 = the
bottom edge, 1 = the horizon) has its ground line at `t × horizon` and a
man's head at `0.75 − t × (0.75 − horizon)`: feet and heads converge on
the horizon, a man is `0.75 × (1 − t)` of the panel whatever the horizon,
and moving the panel's `horizon` moves the rows' ground lines with it
(`DEPTH` and `HEAD_TOP` in `src/scene.js`; starting values, set by eye).

`closeup` is for standing figures: a seated or kneeling one sinks out of
the panel; it takes `front` with a `scale`.

`scale` resizes one entry. `lift` is for small adjustments only, in the
entry's own head-units; anything placed high (flight, hanging, a top
view) takes a numeric row, which does not move when its `scale` changes.

## Background SVG

`panels/<section>/<id>.svg`, drawn in the panel's coordinates: 360 wide,
`tall` × 360 high (540 for 1.5). Draw anything (horizon, river, hills); the renderer
fills the ground colour first, then the background, then the `figures`
list in order.
A layer labelled `guide` is ignored; editor attributes are stripped. The
drawing is otherwise used as is.

## Commands

```sh
node tools/render-panels.mjs [02]   # out/panels/<section>.png (all panels) + issues and needs
node tools/build-site.mjs           # _site/ (the reader site)
node tools/build-panellab.mjs       # out/panellab.html (published as the panel lab)
node tools/renumber-panels.mjs 05 --dry  # a settled chapter's ids made consecutive (see Ids)
```

## Panel lab

Pick a section; the phone shows it as it scrolls. Pick a panel (or tap it
in the phone) and edit its JSON; it re-renders as you type and lists
issues.
**Save draft** stores the panel in the lab's database (collection `panels`);
drafts show with a dot and survive reloads. **Insert after** adds a
copy of the selected panel right after it, under the next free id (see
Ids); it is kept once saved as a draft (**Discard new panel** drops it
before that). Claude merges drafts into `panels/` when asked, as with
poses — a draft with a new id becomes a new file. Background SVGs come
from the repo.

A draft always overrides the repo panel in the lab, so a stale draft
hides every later repo change to that panel. **After a merge is
committed, delete each merged draft** — re-read it first and delete it
only if it still matches what was committed (the artist may have saved
it again since; a newer draft is kept). Then rebuild and republish the
lab. The whole procedure is the `commit-panel-lab` skill
(`.claude/skills/`), with `tools/merge-panel-drafts.mjs` doing the merge.

## Publishing (Cloudflare Pages)

One site, private, published by hand. The Pages project `ramayana` is
connected to GitHub as in the sister project `kena`, so Cloudflare builds
the site itself, but automatic builds are off. To publish: GitHub →
**Actions → Publish the reader site → Run workflow**. The workflow
(`.github/workflows/publish-site.yml`) only calls the project's deploy
hook; follow the build in Cloudflare under Deployments. The site is at
`https://ramayana-7fw.pages.dev`, open to members of the Cloudflare
account only (the default Access policy).

One-time setup by the repo owner:

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to
   Git** → GitHub → allow only `mathcomics/ramayana`.
2. Build settings: project name `ramayana`; framework preset **None**;
   build command `node tools/build-site.mjs`; output directory `_site`;
   production branch `main`. Node version comes from `.node-version`.
   Save and deploy (this first build publishes once).
3. **Turn off automatic builds:** project → Settings → Builds → **Branch
   control**: untick automatic production branch deployments; preview
   deployments **None**.
4. **Deploy hook:** Settings → Builds → **Deploy hooks → Add**, name
   `manual`, branch `main`. Copy the URL into GitHub → repo **Settings →
   Secrets and variables → Actions** as `CLOUDFLARE_DEPLOY_HOOK`. Keep
   it secret: anyone with the URL can start a build.
5. **Make it private:** Settings → General → **Enable access policy**.
   This protects `*.ramayana.pages.dev` only, so also protect the main
   address: Zero Trust → Access → Applications → the `ramayana`
   application → edit → add the hostname `ramayana-7fw.pages.dev` → save. In
   its policy, list the email addresses allowed in (they sign in with a
   one-time code). Check in a private window that the site asks for a
   sign-in.

**Later, automatic builds:** tick automatic production deployments again
(step 3) and delete the workflow.

The build needs no npm packages and no `rsvg-convert` (the site uses inline
SVG).
