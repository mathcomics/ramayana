# Panels: the modelling language

How a panel is described, rendered and published. This implements the spec
route of `docs/proposals/2026-11-03-scene-spec.md`; the template route (figure markers in an
artist's scene SVG) comes later.

## Three layers

| Layer | Where | What |
|---|---|---|
| Scenes | `manuscript/scenes.md` | The story as chapter briefs: each chapter's arc in 3–6 beats, plus the continuity-and-motifs list. **Guidance**, not a definition: the panel side breaks beats into panels (one beat may be several panels) and owns ids, heights, shots and order. |
| Panel definitions | `panels/<NN-section>/<id>.json` | What the renderer draws. One file per panel. A folder with no chapter number (`panels/reference/`, ids `ref.NN`) holds reference drawings — models of a mechanism such as `repeat` — shown in the panel lab and checked by the tests, never published on the site. |
| Rendered panels | `_site/` (not committed): a wordless index — a grid of rounded square tiles, three to a row, one per chapter (all `## N.` headings of `manuscript/scenes.md`), each a drawn face, a prop, or a small cropped panel (figures in poses, props) on the chapter's typical ground (`panels/icons.json`; those without panels dimmed, not links) — and one wordless scrolling page per chapter, with a floating group of buttons at the bottom: home (the index), a solid triangle arrow to the previous chapter, this chapter's Devanagari number, and an arrow to the next; black on white (a faded empty button where there is no previous or next) | Built by `tools/build-site.mjs`; Cloudflare Pages builds and publishes it on every push to `main`. |

The **panel lab** (`tools/build-panellab.mjs`, published artifact) shows any
section as it will scroll on a phone while you edit a panel's JSON. Its
third column lists the chapters and every name a panel may use
(characters, poses, bases, gestures, props, grounds) with a count of the
panels using each; tapping a name shows all those panels, across
chapters, in place of a chapter.

## Delivery: a scroll of panels

The reader scrolls one long column. Every panel is the full width (360
units) and `tall` × that width high: **1.5** (540 units, most panels),
**1** (360, square) or **0.6** (216, a strip). Nothing taller than 1.5. Panels follow each other in id order; there
are no screens or pages to fill.

### Ids

A panel's id is its file name, `<chapter>.<nn>` (`05.08`), and panels
sort by it numerically. **A panel inserted later takes a letter, so
nothing else moves**: after `05.01` comes `05.01a`, then `05.01b`;
between `05.01a` and `05.01b` goes `05.01aa`; after the last panel the
next number (`05.23`). Ids are cited all over the docs, the data and
the lab's drafts, so a renumbering touches dozens of files: do it once,
when the artist calls a chapter settled, with
`node tools/renumber-panels.mjs 05` (`--dry` first). Merge or delete
that chapter's lab drafts before renumbering — they are stored by id.

## Panel definition

`panels/02-the-throne/02.01.json`; the **id is the file name** and is not
repeated inside the JSON.

```json
{
  "scene": "Kaikeyi points Rama away; the king slumps",
  "tall": 1.5,
  "ground": "bloom",
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
| `ground` | name from `data/grounds.json`, or a hex | Background colour. A grounds.json entry may be `[top, bottom]`, a vertical gradient (`twilight`), or `{ "horizontal": [left, right] }` (`summertime`) — set there, never in the panel. Under a `sky` the vertical gradient starts at the horizon; the sky and each foreground band have their own over the area they fill. |
| `sky` | name from `data/grounds.json` (`blue-sky`), or a hex | A colour above the horizon (outdoor panels). |
| `horizon` | 0–1 | Height of the horizon above the bottom edge, as a share of the panel. Default 0.37. Depth `horizon` stands things on it; every depth's ground line and size are built on it (Depth). |
| `camera` | `top` | A top view: no perspective. A numeric `depth` is then the share of the panel height up the ground (0 the bottom, 1 the top) at front size — the height is the distance (`topview`). Named depths keep their sizes. Any other value is an issue. |
| `mode` | `negative` | The dramatic beat: the background turns black and every figure and prop is a white silhouette (merged where they overlap). Ground, sky and foreground bands all go black. For a transformation (05.23, the ascetic becoming Ravana) and for the death of a major character (artist, 2026-11-15). Any other value is an issue. |
| `tags` | list of words from `panels/layouts.md`, Tags (`frieze`, `spy`, `giant` …) | Marks an **approved reference panel**: reviewed with the artist, the model for compositions of these kinds (the panels replace the retired `reference/` images as the yardstick). Find them with `grep -rl '"tags"' panels/` before writing a similar scene. A tagged panel is never changed in a rework pass without the artist's consent; only the artist's review adds tags. |
| `figures` | one list of figures **and** props | An entry with `character` is a figure, with `prop` a prop, with `foreground` a band of ground (Foregrounds). **One overlap rule: later entries draw over earlier ones** — a prop before the figures is scenery, after them a foreground that hides them (03.02's rising ground), and props and figures interleave freely. (The old separate `props` list with `layer` back/front still renders, folded in around the figures — old lab drafts only; migrate on merge.) |
| `needs` | list of text | Missing poses, props, art. Collected into the to-do list. |

### Figures

| Field | Values | Notes |
|---|---|---|
| `character` | character id (`data/characters.json`) | Generic types (`monkey1`, `raxas_f2` …) can repeat. (Old name `who` still reads.) |
| `pose` | `<base>-<gesture>`: any pair of a base and a gesture, composed when drawn | An unknown base or gesture → `step-hang`, with an issue naming it. Picking: `docs/design/pose-picking.md`. |
| `facing` | `left` · `right` | |
| `at` | number, slot or relation | See placement. Default 0.5 (centre). |
| `depth` | a number, or `front` · `mid` · `back` · `horizon`; or the framings `top` · `floor` · `closeup` | **How far away** — where it stands *and* how big: see Depth. Default `front`. Depth doesn't change the overlap order. (The retired `row` still draws, flagged: `node tools/migrate-depth.mjs` converts.) |
| `on` | a prop's name (its `id`, else its `prop`), optionally `#<anchor>`; or a foreground (`"foreground"`, or its `id`) | On a foreground: feet on its line at the figure's own `at`, the size of its own `depth` (default `front`) × `scale`. On a prop: puts the figure on the prop's named anchor (default `seat`), at the prop's depth and the figure's own `scale` — not the prop's (`at` and `depth` do nothing and are flagged; `nudge` still applies, and the figure follows the prop when it moves). `seat`: the hips rest there (`"pose": "sit", "on": "throne"`); a `stand` anchor: the feet rest there (`"on": "palace-kishkindha#stand"`). A `face` anchor is different: the **head alone** is drawn, centred on the anchor and sized by it — no body, so no neck and no `hair-body` (`"on": "sound-cry#face"`, the crier's face in the bubble). An `inside` anchor takes a **prop**, centred on the anchor and sized to fit its circle (the longer side = the circle's diameter, × the prop's own `scale`): a feeling in a thought bubble (`"prop": "heart", "on": "bubble-thought#inside"`). On a **figure** (its `id`, else its character): something it carries — `#hands` (midway between the two hands: a rock overhead), `#hand-right`, `#hand-left` (the near and far hand), `#head` (top of the head: a load on it), `#shoulder` (the near shoulder), `#chest` (the front of the chest, a third of the way from the neck to the waist; in the front view its middle: an arrow that has struck, `arrow-stuck`, ref.07), `#tail` (a monkey's tail tip: the fire on Hanuman's tail, `"prop": "fire", "on": "hanuman#tail"`, 11.21). The points come from the figure's skeleton in the view drawn, so nothing is drawn for them and they follow the pose, facing and `rotate`; a prop's bottom centre (or its `feet` anchor; carried in a hand, its `hand` anchor if it has one: where the hand holds it, e.g. the drum) lands there, a figure's hips; sized by the carrier's depth × its own `scale` (`"prop": "rock-circle", "on": "hanuman#hands"`). The pose must still hold the arms there. Order sets which is in front: the carried entry before the carrier sits behind its hands. |
| `cloth` | a colour name (`colors` in `data/characters.json`) or hex, optionally with a pattern: `red-check` · `red-diamond` · `red-stripe` | Overrides the character's cloth for this figure (rakshasa variety). |
| `show` | `head-alone` · `without-head` | Part of the figure only. `head-alone`: the head without its body, placed by the entry's own `at` / `depth` / `scale` / `nudge` (or `on`) and turned about its centre by `rotate` — a cut-off head flying or on the ground, a head growing back (17.11–17.18). `view`, `facing`, `mouth` and `turn` still apply; `pose` may be left out (it only tilts the head). The renderer makes it an empty `head-alone` prop with the figure on its `face` anchor. `without-head`: the body with no head and no neck, no hair behind it and no body hair — the body after the head is struck off. |
| `wear` | a prop id, or a list | Props worn at the neck, drawn by the figure: behind the whole body, the prop's `neck` anchor (else its top centre) on the neck base, mirrored with the figure, not turned with it — a garland flying back (`"wear": "garland"`: Sugriva in the chapter 8 fights, the mark that tells him from Bali). Size from the drawing (`data-height`). |
| `mouth` | 1 · 2 · 3 | Left out, the mouth is the gesture's own (`data/gestures.json`: calm gestures 1, action gestures 3). Set it only to differ from that — a value equal to the gesture's is flagged by `npm test`. |
| `view` | `side` · `front` | Default `side`. Front is derived from the side pose. |
| `turn` | degrees, −180 … 180 | Head turn from the body's own front, + to its right; overrides the pose's `spine.turn`. ±90 faces the viewer; ±180 is a full look back (profile facing backward, 11.25). |
| `hands` | `{ "right": "point", "left": "fist" }` (fist · out · in · point) | Overrides the pose. |
| `hand` | `right` · `left` | With `"on": "<prop>#hand"`: the hand the figure hangs by (default: the higher one in its pose). Flagged anywhere else. |
| `adjust` | `{ "right.arm.shoulder": 60 }` | Joint angles over the pose, same paths as `_angles` in `data/poses.json` (the character's right / left; older `near.` / `far.` paths still work). For one-off gestures; a gesture used twice becomes a pose. Can also give a hand a held prop: `"left.arm.prop": { "kind": "bow", "angle": 0 }` (0 = across the fist), or swap one (`"right.arm.prop.kind": "club"`). A gesture that holds a plain `sword` gives the character's own weapon instead where `data/characters.json` names one (`weapon`: clubs for the monkeys, a long spiked club for Sugriva, spiked clubs and swords for the generic rakshasas); the adjust still wins. |
| `scale` | number | This one is bigger or smaller than life (a child, a giant, a big rock) — not nearer: distance is `depth`. |
| `nudge` | head-units: a number (across) or `[dx, dy]` (across, up +) | **Moves without resizing**, after placement — by `at`/`depth`, a relation or `on` — in the entry's own head-units. `dy` is the height above its ground: a figure in the air is at the depth of the ground under it, nudged up (`"nudge": [0, 5]`: five head-units up, flying), so the JSON tells a far figure (a large `depth`) from a near one high in the panel (a large `nudge`). Whatever sits on or is placed against a nudged entry follows it. The retired `lift` is flagged (`lift: n` is `nudge: [0, n]`). |
| `rotate` | degrees, clockwise | Turns the whole figure, after the pose and `facing`. On a prop's anchor it turns about that point, so the grip, seat or footing stays put (`"on": "city-side#hand", "rotate": 90`: Hanuman's body upright against the wall, still hanging by the hand); on a foreground, about its feet; otherwise about its centre, then it stands on the bottom of its turned box, as a prop does. The layout spaces it by its unturned width. |
| `id` | text | Name for relations when the same character appears twice. |

### Props

`{ "prop": "throne", "at": "right", "depth": "back" }` — an entry of the same
`figures` list; its place in the list is its depth (before the figures =
behind them, after = in front; the retired `layer` field is an issue).

- `prop`: a drawing's id (`data/props/<id>.svg`); a prop scales with its
  depth.
- Artwork: `data/props/<id>.svg`, 100 px = 1 head-unit, bottom edge on the
  ground; its viewBox sets the prop's size — unless the root element
  carries **`data-height`**, the prop's real height in head-units (a man
  is 6.1): the drawing, its size and its anchors are scaled to it, so
  `scale` 1 is life-size beside a figure (`ladder` 10, `trees-side` 18,
  `hut-side` 7, `deer-stand` 3.4, `steps` 4.6; the top views `hut-top` 1.6,
  `trees-top` 2.6). A panel `scale` is then a choice —
  distance, exaggeration — not a correction, and a figure `on` such a
  prop at `scale` 1 is life-size against it. Any SVG there is a prop — no
  registry. A prop id with no artwork yet renders as a **labelled dashed
  box** of a fixed 2 × 2 head-units (`PLACEHOLDER` in `src/scene.js`).
- `at`, `depth`, `scale`, `nudge`, `on`, `id` as for figures.
- `facing`: drawings face right; `left` mirrors the prop (and its anchors).
- `rotate`: degrees clockwise about the drawing's centre, after `facing`; the prop stands on the bottom of its turned box (`"rotate": -90` lays the upright `fire` on its side, the burning street of 11.25). With `on` it turns about the point it lands on instead (an arrow in a chest about where it goes in: `"on": "ravana#chest", "rotate": 55`). Its own anchors are not turned, so whatever stands on a turned prop does not tilt with it.
- `repeat`: the prop drawn several times in a row — a cluster of rocks, a
  clump of lotuses or flowers, ladders against a wall. `"repeat": 3`, or
  `{ "n": 3, "gap": 0.3, "scale": [0.6, 1.05], "rotate": [-12, 12], "seed": 1 }`. The
  entry as written (its `at`, `depth`, `scale`, `nudge`, `on`, `rotate`,
  colours) is the **middle** copy; the others stand left and right of it,
  alternately outwards, on its ground line (or its anchor), drawn behind
  it, farthest first. Each copy has **its own size and turn, at random**
  (artist, 2026-11-17: copies shrinking steadily to the sides looked
  mechanical): `scale` and `rotate` are `[min, max]` ranges — the
  copy's size as a factor of the middle's, and its turn in degrees from
  the middle's (defaults `[0.6, 1.05]` and `[-12, 12]`; `[1, 1]` and
  `[0, 0]` make them all alike). The draw is seeded by the prop, the
  count and `seed`, not by where the entry stands, so moving it keeps
  its copies; another `seed` (any number) deals a different set. `gap` is the space between neighbours' edges in the
  middle's head-units (default 0, edge to edge; negative overlaps). The
  copies are named `<name>-left`, `<name>-right` (`-left2`, `-right2`
  further out), so an entry can stand on one
  (`"on": "rock-circle-left#stand"`). Models: `panels/reference/`
  ref.01–ref.06.
- `repeat` with **`to`**: a line running into the picture — stepping
  stones, a column of rocks. `"repeat": { "n": 7, "to": { "at": 0.58,
  "depth": 0.9 } }`: the copies run from the entry toward that point,
  each touching the last (`gap` as above, in the copy's own head-units),
  each sized by **its own depth** — so they shrink and climb toward the
  horizon with no `scale` — with smaller random ranges (defaults `scale`
  `[0.85, 1.1]`, `rotate` `[-10, 10]`). The point gives the direction:
  with more copies the line runs on past it (a line of stones runs off
  the far edge); one reaching the horizon is flagged. The entry needs a
  number or slot `at` and a perspective depth. Copies are named
  `<name>-1`, `<name>-2` … outwards and drawn farthest first; a figure
  `on` a copy takes that copy's depth.
- Recolouring: a prop whose drawing names role colours on its root
  element (`<svg data-recolor-body="#a05a2c" data-recolor-cloth="#c8ab37" …>`) takes
  `character` (a character id: that character's body and cloth colours), or
  explicit `body` / `cloth` (a name from `colors` in `data/characters.json`, or a hex — not a CSS name; a pattern
  suffix keeps the base colour). So one drawing serves many characters:
  `{ "prop": "male-top", "character": "rama" }`. The rocks recolour
  too (`{ "prop": "rock-square", "body": "skin-dark-brown" }`). `body` or
  `cloth` on a prop that names no role colours is flagged.
- Anchors: a group `id="anchors"` in the prop's SVG holds named circles
  (not drawn). `seat`: where a seated figure's hips rest (`on`) — the
  underside of its thighs at the pelvis lands on the point, so it goes on
  the top of the seat (a rock's top, a throne's cushion), and the legs
  hang as the pose has them.
  `stand`, `stand-left`, `stand-right`: where a standing figure's feet
  rest (`on` with `#`, e.g. `"on": "palace-kishkindha#stand"`; the rocks
  `rock-circle`, `rock-square`, `rock-rectangle` and `palace-kishkindha` have
  them; `ladder` and `steps` have `stand-low`, `stand` and `stand-high`, a
  low, middle and high rung or tread). A prop can stand `on` another prop's anchor
  too — its bottom centre lands there, at the carrying prop's depth and
  its own `scale` (`palace-lanka` at 4 on `"lanka-island#stand"`), or its own `feet` anchor
  when it has one: a creature whose wing or tail pulls its box off its
  feet (`vulture-stand`, `vulture-lookback` on `"rock-circle#stand"`).
- **Naming an anchor**: after *what of the figure lands on it*, never
  after where it sits in the drawing — `seat` (hips), `stand` (feet),
  `hand` (the figure hangs from it by one hand: its higher hand, or the
  one the figure's `hand` field names; `city-side`), `face` (the head
  alone, as in `sound-cry`), `inside` (a prop fitted into the circle, as in
  `bubble-thought`). Any other name places the feet, as `stand`. Lowercase, one word, the
  bare name for the only or default one, `-left`/`-right` for variants
  of the same kind (two places a figure could stand) — never for parts
  of one anchor. The parts and face sheets name their anchors the same
  way (`nape`, `neck-top`, `wrist-left`).
- **An anchor's size**: an anchor that places a whole figure (`seat`,
  `stand`, `hand`) is a point; its circle is only a marker and the radius means
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
  1 head-unit at the size it should appear at `scale` 1 — or drawn at
  any size with `data-height="<real height in head-units>"` on the root
  `<svg>`; facing right;
  the bottom edge on the ground, or a part that enters from outside the
  panel cut straight at that edge; colours that a panel should change
  drawn in one exact fill each (the skin one hex, the cloth one hex —
  a nail or sole in another colour will not follow a recolour), using
  the character's or a `colors` hex where it belongs to one; stroke width
  matching the props it will stand beside; anchors as named circles in
  a group `id="anchors"`.
- Drawn so far: `palace-ayodhya`, `palace-lanka` (the golden rework,
  Lanka's palaces; also small on `lanka-island`'s `stand` anchor),
  `stag-stand`, `stag-run`, `stag-lie`, `deer-stand` (brown; the golden deer is `"body": "#ffd42a"`),
  `hut-top`, `hut-side` (the same thatched hut at eye level), `trees-top`, `tree-top`, `trees-side` (a clump of three
  trees seen side on; `scale` ~2 at depth `back`), `tree-trunk` (a near
  trunk cut straight at both ends: on `closeup` it runs off the top and
  bottom edges, framing a panel — 06.19), `lanka-island` (the bare island —
  the city split off into `palace-lanka`, 2026-11-08),
  `vulture-fly`, `-swoop`, `-fall`,
  `-stand` and `vulture-wing` (the wing Ravana cuts off — a lone wing,
  not a bird; all from the artist's Jatayu sheet,
  `data/props/sheets/`), the thrones `throne-ayodhya` (gold-backed,
  Dasharatha's — the two throne drawings were interchanged by the artist
  2026-11-08), `throne-lanka` (dark, under the red disc with a dark
  centre, Ravana's) and `throne-kishkindha` (gold
  stupa dome on a dark post, Sugriva's coronation),
  the rocks `rock-circle`, `rock-square`, `rock-rectangle` (plain stone,
  for every rocky scene; Jatayu perches on a `rock-circle`'s `seat`, 03.08), `palace-kishkindha` (domed palaces on a hill; a `stand` anchor on the stair),
  the giant's parts for chapter 14 `giant-feet`, `giant-fist`,
  `giant-grab` (reaching down from above), `giant-lie-waist` (the
  sleeping giant's middle), and the placeholder heads `giant-face-side`,
  `giant-face-front` (eyes shut; drawn by Claude for the artist to
  redraw) — each sized by its `data-height` to one giant (`giant-grab`
  6.9, the reference; `giant-fist` 5.0, `giant-feet` 6.5,
  `giant-lie-waist` 5.9, the faces 6.7 / 6.64), so a panel places them
  by depth with no `scale`; each cut off at the frame edge it enters
  from, and recolourable (`body`, and `cloth` on the waist) so the four
  share one skin in a panel; the placeholder `giant-fingers` in the
  locked 14.14 stays until the artist swaps it,
  the flowers `flower-droop`, `-white`, `-pink`, `-yellow`, `-orange`,
  `lotus-bud`, `lotus-full`, `fire`, `vine`, and the top-view people
  `male-top`, `male-top-back`, `female-top` (recolour, see above). How to
  arrange them: `docs/design/composition.md`.

### Foregrounds

`{ "foreground": [0.11, 0.22], "color": "forest" }` — a band of ground,
an entry of the same `figures` list, drawn from the panel's bottom edge
up to a straight line. The two numbers are the line's height at the left
and right edges, as shares of the panel height (one number: level). Its
place in the list is its depth, as for a prop: figures before it are
behind it (their feet hidden, the farther the deeper), figures after it
in front (03.02, 07.02, 07.09, 09.08).

- `color`: a `data/grounds.json` name or a hex; gradients as for `ground`.
- Standing on it: `"on": "foreground"` with the figure's own `at` (a
  number, slot or relation). The feet land on the line at that x; the
  size is the figure's own `depth` (default `front`) × `scale` — a
  farther walker on the fold is a larger depth (03.02: Lakshman 0.4, Sita
  0.26, Rama front); `nudge` `[dx, dy]` then moves along the line
  (the feet follow the slope) and up or down from it (03.02: Rama
  `[0, -0.5]` in front of it, Lakshman `[0, -1]` sunk behind it). A prop
  can stand on it the same way.
- `id` names it when a panel has more than one (`"on": "far-hill"`).
- `at`, `depth`, `scale`, `nudge` and `on` do nothing on a foreground itself
  and are flagged. On an entry standing on one, `depth` sets the size
  only: the band sets where the feet are (a band may rise above the
  horizon — a wall, a slope — where a depth from the feet would mean
  nothing).
- Not the horizon: `horizon` stays the eye level the depths are built on
  (and a `sky` above it); a foreground is a near slope of ground.

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
- `nudge` shifts by head-units after placement: a number across, or
  `[dx, dy]` across and up.

### Depth

`depth` says **how far away** an entry is, and that sets both where it
stands and how big it is — by name or by number, as `at` does across.
`nudge` moves it without resizing (a figure in the air: the depth of the
ground under it, nudged up). Shares are of the panel height, so a depth
looks the same in a panel of any height.

| `depth` | Bottom edge | Size (a man standing = 6.1 head-units, as drawn) |
|---|---|---|
| a number `t` | `t × horizon` (0 the bottom edge, 1 the horizon) | a man `0.75 × (1 − t)` of the panel |
| `front` (default) | 0.08 (3 % up at the default horizon) | 69 % |
| `mid` | 0.4 (15 % up) | 45 % |
| `back` | 0.7 (26 % up) | 22 % |
| `horizon` | on the horizon line | far away: 16 px per head-unit in a 1.5 panel (true perspective would shrink it to nothing) |
| negative | below the bottom edge | bigger than `front`: nearer than the frame, cropped |

One-point perspective with the horizon as eye level: at depth `t` the
ground line is at `t × horizon` and a man's head at
`0.75 − t × (0.75 − horizon)`, so feet and heads converge on the horizon,
a man is `0.75 × (1 − t)` of the panel whatever the horizon, and moving
the panel's `horizon` moves every ground line with it (`DEPTH`,
`HEAD_TOP` and `MAX_DEPTH` in `src/scene.js`). A depth from 0.95 up is
flagged.

**Framing, not distance** — three names place an entry against the
frame instead:

| `depth` | Bottom edge | Size |
|---|---|---|
| `top` | the entry's **top** edge on the panel's top edge | as `front` |
| `floor` | the bottom edge | as `front` (a foreground prop sits flush: 09.11's sea) |
| `closeup` | a panel below the bottom edge (−100 %) | a camera raised to face height: a man's head at 75 %, he shows from about the waist up |

`closeup` is for standing figures: a seated or kneeling one sinks out of
the panel; it takes `front` with a `scale`.

**Inherited depth**: whatever is `on` an entry takes that entry's depth —
on a prop's anchor the prop's (its `scale` says *a bigger rock*, not
*nearer*, and stays off the figure), carried on a figure the carrier's.
On a foreground the entry's own `depth` sets the size (Foregrounds).

In a top view (`"camera": "top"`) there is no perspective: a numeric
depth is the height up the ground, at front size.

`scale` resizes one entry — a giant, a child, a big rock. Many `scale`s
in a panel are a sign the depths are wrong.

**From `row`** (retired 2026-11-20): `tools/migrate-depth.mjs` rewrote
every panel to draw exactly as before (within 0.03 px): a named row
became the same depth; a number on the ground `row ÷ horizon`; any other
number (something lifted) `front` with the `nudge` up that keeps it in
place; a foreground walker's `scale` its `depth`; and every `scale` was
set to keep the old size, so many still carry an odd one (0.7242) where
the old hand-set perspective did not match — the by-eye pass removes
those. Old lab drafts still using `row` draw as before, flagged, and
`merge-panel-drafts.mjs` converts them on merge.

## Reading a panel back

`node tools/describe-panel.mjs 12.26` (or a chapter, `12`; `--problems`
for the marked lines only) prints the panel as it is laid out, so it can
be checked without opening the picture. `render-panels.mjs` writes the
same text beside each PNG (`out/panels/<section>/<id>.txt`). It works
from `renderPanel`'s `layout` (`src/scene.js`: each drawn entry's place,
size and a map from its own frame to the panel), with props measured
from their drawings, so it reports what is drawn, not what the JSON
intends.

Per entry, in drawn order: the pose with its base's and gesture's
descriptions, view, facing, head turn and tilt, mouth; its box as shares
of the panel (x across, y up from the bottom edge, as `at` and `depth`'s ground line);
its height and head in pixels at phone size; what places it. Then notes:

| Mark | Note |
|---|---|
| `!` | a face covered by something drawn after it, or by its own arm (*skin over skin*, *a raised arm hides the face*); an entry `on` a prop's stand anchor whose feet miss the prop (and what it stands on instead); an entry outside the panel; an `id` used twice; a renderer issue |
| `?` | in the air with nothing under it — the feet above the horizon, or more than 1.5 head-units above the ground that its size puts it on; small for where it stands (its size says farther back than its feet: sunk or far); lifted off its anchor by a `nudge`; a face cut by the frame or a head out of it |
| `·` | cut by an edge (the bottom edge named by the body: *shows down to the waist*); stands on a prop by position, without `on`; on a band, raised or sunk; who it faces and whether they face it; a placeholder prop |

"The ground its size puts it on": a figure as big as a man at depth `t`
should stand on that depth's ground line (Depth); the distance
between that line and its feet is how far it is lifted (or sunk).
`--props` lists every drawing's size in head-units, its anchors and
recolour roles; `--poses` every base (height, how far apart the feet)
and gesture (reach, how high the hands), measured on a man.

## Commands

```sh
node tools/render-panels.mjs [02]   # out/panels/<section>.png (all panels) + <id>.txt read-backs + issues and needs
node tools/describe-panel.mjs 12.26 # the panel as text: layout, contact, faces (see Reading a panel back)
node tools/build-site.mjs           # _site/ (the reader site)
node tools/build-panellab.mjs       # out/panellab.html (published as the panel lab)
node tools/renumber-panels.mjs 05 --dry  # a settled chapter's ids made consecutive (see Ids)
```

## Panel lab

Pick a section; the phone shows it as it scrolls. Pick a panel (or tap it
in the phone) and edit its JSON; it re-renders as you type and lists
issues. Below it, **Anchors in this panel** lists every prop in the panel
(by its `id`, else its name) with the anchors its drawing carries, and
each figure's carry points (`#hands`, `#head`, …); tap one to copy its
`"on"`.
**Save draft** stores the panel in the lab's database (collection `panels`);
drafts show with a dot and survive reloads. **Insert after** adds a
copy of the selected panel right after it, under the next free id (see
Ids); it is kept once saved as a draft (**Discard new panel** drops it
before that). Claude merges drafts into `panels/` when asked, as with
poses — a draft with a new id becomes a new file.

A draft always overrides the repo panel in the lab, so a stale draft
hides every later repo change to that panel. **After a merge is
committed, delete each merged draft** — re-read it first and delete it
only if it still matches what was committed (the artist may have saved
it again since; a newer draft is kept). Then rebuild and republish the
lab. The whole procedure is the `commit-panel-lab` skill
(`.claude/skills/`), with `tools/merge-panel-drafts.mjs` doing the merge.

## Publishing (Cloudflare Pages)

One public site. The Pages project `ramayana` is connected to GitHub:
Cloudflare builds and publishes the
site itself on **every push to `main`** on origin, so pushing is
publishing — there is no manual step (follow a build in Cloudflare under
Deployments). Readers reach it at `https://ramayana.lilboox.com`, which
redirects to `https://ramayana-7fw.pages.dev`.

One-time setup by the repo owner:

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to
   Git** → GitHub → allow only `mathcomics/ramayana`.
2. Build settings: project name `ramayana`; framework preset **None**;
   build command `node tools/build-site.mjs`; output directory `_site`;
   production branch `main`. Node version comes from `.node-version`.
   Save and deploy.
3. **Automatic builds:** project → Settings → Builds → **Branch
   control**: automatic production branch deployments on; preview
   deployments **None**.

The build needs no npm packages and no `rsvg-convert` (the site uses inline
SVG).
