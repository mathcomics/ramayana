# Panels: the modelling language

How a panel is described, rendered and published. This implements the spec
route of `docs/scene-spec.md`; the template route (figure markers in an
artist's scene SVG) comes later.

## Three layers

| Layer | Where | What |
|---|---|---|
| Scenes | `manuscript/scenes.md` | The story, one row per intended panel. **Guidance**, not a definition: a panel may split, merge or reword a scene. |
| Panel definitions | `panels/<NN-section>/<id>.json` (+ optional `<id>.svg`) | What the renderer draws. One file per panel. |
| Rendered panels | `_site/` (not committed) | Built by `tools/build-site.mjs`; Cloudflare Pages runs it on every push. |

The **panel lab** (`tools/build-panellab.mjs`, published artifact) shows any
screen as it will look on a phone while you edit a panel's JSON.

## Screens

A screen is 360 × 720 units (phone portrait). Panels are packed into screens
in id order: a `full` panel (720) fills a screen; `half` (360) and `third`
(240) panels stack until the screen is full. `"newScreen": true` forces a
panel onto a new screen.

## Panel definition

```json
{
  "id": "02.03",
  "scene": "Kaikeyi points Rama away; the king slumps",
  "size": "half",
  "ground": "dusty-pink",
  "zoom": 1,
  "props": [
    { "prop": "throne", "at": "right" }
  ],
  "figures": [
    { "who": "rama", "pose": "stand", "facing": "left", "at": "left", "mouth": 1 },
    { "who": "kaikeyi", "pose": "point", "facing": "left", "at": "center-left", "mouth": 3 },
    { "who": "dasharatha", "pose": "stand", "facing": "left", "at": { "left-of": "throne", "gap": 0.2 },
      "adjust": { "spine.chest": 40, "spine.lean": 10 } }
  ],
  "needs": ["pose: slump (or sit, on the throne)"]
}
```

### Panel fields

| Field | Values | Notes |
|---|---|---|
| `id` | `"02.03"` | Same as the file name. Scene ids can be reused or suffixed (`02.03a`). |
| `scene` | text | The scene line it draws, for reference only. |
| `size` | `full` · `half` · `third` | Default `half`. |
| `ground` | name from `data/grounds.json`, or a hex | Background colour. |
| `zoom` | number | Scales **figures only** ("small in the panel" ≈ 0.55). |
| `props` | list | See below. |
| `figures` | list | Drawn back row first, then in list order. |
| `needs` | list of text | Missing poses, props, art. Collected into the to-do list. |
| `background` | file name | Optional; default `<id>.svg` next to the JSON. |
| `newScreen` | `true` | Start a new screen with this panel. |

### Figures

| Field | Values | Notes |
|---|---|---|
| `who` | character id (`data/characters.json`) | Generic types (`monkey1`, `queen1` …) can repeat. |
| `pose` | pose name (`data/poses.json`) | Unknown pose → `stand`, with a warning. |
| `facing` | `left` · `right` | |
| `at` | slot or relation | See placement. Default `center`. |
| `row` | `back` · `mid` · `front` | Default `front`. Back rows sit higher and smaller. |
| `mouth` | 1 · 2 · 3 | Overrides the pose. |
| `headView` | `front` · `side` | Overrides the pose. |
| `hands` | `{ "near": "fist", "far": "out" }` | Overrides the pose. |
| `adjust` | `{ "near.arm.shoulder": 60 }` | Joint angles over the pose, same paths as `data/poses.json`. For one-off gestures; a gesture used twice becomes a pose. |
| `scale` | number | This figure only (a child, a giant). |
| `lift` | head-units | Off the ground (leap, flight). |
| `nudge` | head-units | Small horizontal shift after placement. |
| `id` | text | Name for relations when the same character appears twice. |

### Props

`{ "prop": "throne", "at": "right", "row": "back", "layer": "back" }`

- `prop`: id from `data/props.json`, whose `size` is `[width, height]` in
  head-units, so a prop scales with its row.
- `layer`: `back` (default, behind figures of its row) or `front`.
- A prop with no artwork yet renders as a **labelled dashed box**.
- `at`, `row`, `scale`, `nudge`, `id` as for figures.

### Placement

- **Slots**: `left`, `center-left`, `center`, `center-right`, `right`
  (14 %, 32 %, 50 %, 68 %, 86 % of the width).
- **Relations**: `{ "before": X }` (in front of X's face), `{ "behind": X }`,
  `{ "beside": X }` (toward the open side), `{ "left-of": X }`,
  `{ "right-of": X }`. X is a figure's `who`/`id` or a prop's `prop`/`id`.
  `"gap"` is the space between the two (head-units, default 0.3; negative
  overlaps).
- **No coordinates.** Exact placement belongs to a background SVG or,
  later, the template route.

### Rows

| Size | back: ground / unit | mid | front |
|---|---|---|---|
| full | 47 % / 11 | 70 % / 15 | 95 % / 20 |
| half | 62 % / 11 | 78 % / 15 | 93 % / 20 |
| third | 60 % / 9 | 78 % / 12 | 92 % / 15 |

Ground is a share of the panel height from the top; unit is pixels per
head-unit (a male figure is about 7.5 head-units tall, so ~150 px in front).

## Background SVG

`panels/<section>/<id>.svg`, drawn in the panel's coordinates: 360 wide,
720 / 360 / 240 high. Draw anything (horizon, river, hills); the renderer
fills the ground colour first, then the background, then props and figures.
A layer labelled `guide` is ignored; editor attributes are stripped. The
drawing is otherwise used as is.

## Commands

```sh
node tools/render-panels.mjs [02]   # out/panels/<section>.png (all screens) + issues and needs
node tools/build-site.mjs           # _site/ (the reader site)
node tools/build-panellab.mjs       # out/panellab.html (published as the panel lab)
```

## Panel lab

Pick a section and a screen; click a panel (or tap it in the phone view)
and edit its JSON; the screen re-renders as you type and lists issues.
**Save draft** stores the panel in the lab's database (collection `panels`);
drafts show with a dot and survive reloads. Claude merges drafts into
`panels/` when asked, as with poses. Background SVGs come from the repo.

## Publishing (Cloudflare Pages)

One-time setup by the repo owner, as in the sister project `kena`:

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to
   Git** → GitHub → allow only `mathcomics/ramayana`.
2. Build settings: framework preset **None**; build command
   `node tools/build-site.mjs`; output directory `_site`; production branch
   `main`. Node version comes from `.node-version`.
3. Save and deploy. Every other branch and PR gets a preview link;
   **Settings → General → Enable access policy** keeps previews private.

The build needs no npm packages and no `rsvg-convert` (the site uses inline
SVG).
