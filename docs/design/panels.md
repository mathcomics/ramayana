# Panels: the modelling language

How a panel is described, rendered and published. This implements the spec
route of `docs/proposals/2026-11-03-scene-spec.md`; the template route (figure markers in an
artist's scene SVG) comes later.

## Three layers

| Layer | Where | What |
|---|---|---|
| Scenes | `manuscript/scenes.md` | The story, one row per intended panel. **Guidance**, not a definition: a panel may split, merge or reword a scene. |
| Panel definitions | `panels/<NN-section>/<id>.json` (+ optional `<id>.svg`) | What the renderer draws. One file per panel. |
| Rendered panels | `_site/` (not committed): an index of chapters (all `## N.` headings of `manuscript/scenes.md`; those without panels marked "to come") and one scrolling page per chapter with previous / next links | Built by `tools/build-site.mjs`; published to Cloudflare Pages by hand (GitHub Action calls a deploy hook). |

The **panel lab** (`tools/build-panellab.mjs`, published artifact) shows any
section as it will scroll on a phone while you edit a panel's JSON.

## Delivery: a scroll of panels

The reader scrolls one long column. Every panel is the full width (360
units) and `size` × one phone screen (720 units) tall: **0.75** (most
panels), **0.5** or **0.3** (a strip). No full-screen panels (1): too tall. Panels follow each other in id order; there
are no screens or pages to fill.

## Panel definition

`panels/02-the-throne/02.03.json`; the **id is the file name** and is not
repeated inside the JSON.

```json
{
  "scene": "Kaikeyi points Rama away; the king slumps",
  "size": 0.75,
  "ground": "dusty-pink",
  "props": [
    { "prop": "throne", "at": 0.88 }
  ],
  "figures": [
    { "who": "dasharatha", "pose": "stand", "facing": "left", "at": 0.74,
      "adjust": { "spine.chest": 40, "spine.lean": 10 } },
    { "who": "rama", "pose": "stand", "facing": "left", "at": 0.16, "mouth": 1 },
    { "who": "kaikeyi", "pose": "point", "facing": "left", "at": 0.48, "mouth": 3 }
  ],
  "needs": ["pose: slump (or sit, on the throne)"]
}
```

### Panel fields

| Field | Values | Notes |
|---|---|---|
| `scene` | text | The scene line it draws, for reference only. |
| `size` | `0.75` · `0.5` · `0.3` | Share of a screen height. Default 0.75. Anything else is an issue. |
| `ground` | name from `data/grounds.json`, or a hex | Background colour. |
| `zoom` | number | Scales **figures only** ("small in the panel" ≈ 0.45). |
| `shot` | `far` · `wide` · `mid` | Which rows (below). Default `far`. Layouts: `layouts/<size>-<shot>.svg`. |
| `props` | list | See below. |
| `figures` | list | **Overlap order: later figures are drawn over earlier ones.** |
| `needs` | list of text | Missing poses, props, art. Collected into the to-do list. |
| `background` | file name | Optional; default `<id>.svg` next to the JSON. |

### Figures

| Field | Values | Notes |
|---|---|---|
| `who` | character id (`data/characters.json`) | Generic types (`monkey1`, `queen1` …) can repeat. |
| `pose` | pose name (`data/poses.json`) | Unknown pose → `stand`, with a warning. Picking: `docs/design/pose-picking.md`. |
| `facing` | `left` · `right` | |
| `at` | number, slot or relation | See placement. Default 0.5 (centre). |
| `row` | `back` · `mid` · `front` | Default `front`. Back rows sit higher and smaller; rows don't change the overlap order. |
| `cloth` | palette colour, optionally with a pattern: `red-check` · `red-diamond` · `red-stripe` | Overrides the character's cloth for this figure (rakshasa variety). |
| `mouth` | 1 · 2 · 3 | Overrides the pose. |
| `view` | `side` · `front` | Default `side`. Front is derived from the side pose. |
| `turn` | degrees, −90 … 90 | Head turn from the body's own front, + to its right; overrides the pose's `spine.turn`. |
| `hands` | `{ "right": "point", "left": "fist" }` (fist · out · in · point) | Overrides the pose. |
| `adjust` | `{ "right.arm.shoulder": 60 }` | Joint angles over the pose, same paths as `data/poses.json` (the character's right / left; older `near.` / `far.` paths still work). For one-off gestures; a gesture used twice becomes a pose. Can also give a hand a held prop: `"left.arm.prop": { "kind": "bow", "angle": 90 }`, or swap one (`"right.arm.prop.kind": "club"`). |
| `scale` | number | This figure only (a child, a giant). |
| `lift` | head-units | Off the ground (leap, flight). |
| `nudge` | head-units | Small horizontal shift after placement. |
| `id` | text | Name for relations when the same character appears twice. |

### Props

`{ "prop": "throne", "at": "right", "row": "back", "layer": "back" }`

- `prop`: id from `data/props.json`, whose `size` is `[width, height]` in
  head-units, so a prop scales with its row.
- `layer`: `back` (default, behind figures of its row) or `front`.
- Artwork: `data/props/<id>.svg`, 100 px = 1 head-unit, bottom edge on the
  ground; its viewBox sets the prop's size. A prop with no artwork yet
  renders as a **labelled dashed box**.
- `at`, `row`, `scale`, `lift`, `nudge`, `id` as for figures (`lift`: a bird on a branch).

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

### Rows and figure size

Figures scale with the panel height, so a front-row figure is about two
thirds of its panel whatever the size.

| Row | Head-unit in a 0.75 panel | Ground line above the bottom |
|---|---|---|
| front | 46 (a man ≈ 345 tall) | 3 % of the panel height |
| mid | 34 | 17 % |
| back | 24 | 34 % |

Other sizes scale in proportion (a 0.5 panel: × 2/3, a 0.3 panel: × 0.4).

That table is the `far` shot. A panel's `shot` picks another row set
(head-unit in a 0.75 panel; ground as a share of the panel height above
its bottom, negative = below it, so the panel crops the figures):

| Shot | front | mid | back |
|---|---|---|---|
| `far` | 46 · 0.03 | 34 · 0.17 | 24 · 0.34 |
| `wide` | 55.2 · 0.031 | 40.8 · 0.085 | 28.8 · 0.136 |
| `mid` | 110.4 · −0.735 | 81.6 · −0.568 | 57.6 · −0.429 |

`wide` and `mid` are measured from the artist's layouts `layouts/0.75-wide.svg`
and `0.75-mid.svg` (the `mid` back row is extrapolated from the other two).

## Background SVG

`panels/<section>/<id>.svg`, drawn in the panel's coordinates: 360 wide,
`size` × 720 high (540 for 0.75). Draw anything (horizon, river, hills); the renderer
fills the ground colour first, then the background, then back-layer props,
figures in list order, and front-layer props.
A layer labelled `guide` is ignored; editor attributes are stripped. The
drawing is otherwise used as is.

## Commands

```sh
node tools/render-panels.mjs [02]   # out/panels/<section>.png (all panels) + issues and needs
node tools/build-site.mjs           # _site/ (the reader site)
node tools/build-panellab.mjs       # out/panellab.html (published as the panel lab)
```

## Panel lab

Pick a section; the phone shows it as it scrolls. Pick a panel (or tap it
in the phone) and edit its JSON; it re-renders as you type and lists
issues.
**Save draft** stores the panel in the lab's database (collection `panels`);
drafts show with a dot and survive reloads. Claude merges drafts into
`panels/` when asked, as with poses. Background SVGs come from the repo.

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
