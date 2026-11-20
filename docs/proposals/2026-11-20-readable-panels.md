# Panels that read from the JSON

2026-11-20 · status: **partly implemented** — 1, the read-back, in
`design/panels.md` (Reading a panel back), with the duplicate-id check of 7;
the rest proposed.

## The problem

A panel session writes JSON it cannot see. It renders, looks at the
PNG, retunes, renders again, and the artist still reworks much of it.
The aim: a writer should be able to tell from the JSON alone, or from a
text report of it, what the picture will look like, so that panels need
less editing.

## What the panels show (chapters 01–15, 307 panels, 1102 entries)

Counted with a script over `panels/` and over the 51 `Merge panel-lab`
commits (399 panels the artist edited in the lab):

| Finding | Count |
|---|---|
| entries with a `scale` (the docs say: size by row, scale for the unusual case) | 477 of 1102 |
| entries on a numeric `row` | 268 |
| … of them also scaled below 0.9: perspective worked out by hand | 114 |
| figures `on` an anchor that still need their own `scale` | 95 |
| `nudge`s over 2 head-units (the docs say: small adjustments only) | 39 |
| figures turned with `rotate` | 50 |
| `adjust` `spine.head` (aiming a gaze) | 64 |
| `adjust` `right.arm.prop` / `.kind` (swapping a weapon) | 40 |
| stand-ins named in `needs` | 36 |
| duplicate `id`s in one panel (13.12 `struck`, 14.01 `reeling` ×3, 14.09 `front`) | 3 panels |
| **artist's edits**: `pose` changed | 188 |
| `at` changed | 172 (figures) + 72 (props) |
| `row` / `scale` changed or added | 64 + 62 + 75 + 18 changed / added on figures and props; 52 + 32 + 45 + 12 for scale |

The artist's pose changes keep the base in 46 cases, the gesture in 44,
and change both in 98. The most common base swaps go to a more active
base: `step` → `stepwide` (10), `walk` → `run` (5), `step` → `leanback`,
`walk`, `arch`, `leanfront`, `stand`. The commonest gesture swap is away
from `hang`, arms hanging: `hang` → `swing`, `swordcarry`, `fool`,
`akimbo`.

## Why the JSON does not show the picture

1. **No layout is reported in words.** `renderPanel` (`src/scene.js`)
   works out every entry's box, but only pixels come out, plus a list of
   issues. Whether a monkey's feet touch his stone, whether a face is
   cut by the frame, how far apart two figures stand: none of it can be
   read without rendering and looking. Contact and grounding are the
   artist's commonest reason for failing a panel (`panel-writing.md`,
   *Whatever stands on something touches it*), and none of it is
   checked.
2. **A numeric row has a height but no depth.** `row: 0.2` sets the
   ground line and gives front-row size (`row()` in `src/scene.js`), so
   anything between the named rows needs a `scale` worked out by hand.
   12.26 is seven stones, each with its own `at`, `row` and `scale`
   (0.1 … 1.2), and a monkey on each at about 0.875 × its stone's scale.
   The reader sees only numbers, and cannot tell that they make a line
   running back to the horizon.
3. **An anchor is one point, so a crowd on a prop is placed by `nudge`.**
   13.01a and 13.01b stand three figures on `ledge#stand` and spread them
   with nudges of −9.5, −6 and −2.5. In 14.24 the monkeys dancing on the
   giant's head are at `[5,12]`, `[9,11]`, `[−1,15]`, because the face
   has no anchor to stand on. A foreground already does the right thing:
   `on` it, a figure uses its own `at`.
4. **Intent hides in joint paths.** `"spine.head": -35` means "looks up
   at Ravana", and `"right.arm.prop.kind": "club"` means "holds a club".
   The JSON gives the means and leaves out the meaning. Aiming a gaze
   by angle also breaks when either figure moves.
5. **Some of the lessons are recipes of adjusts that should be poses.**
   `panel-writing.md` teaches the writer to rebuild missing poses by hand:
   flying (four leg adjusts), lying dead (`liefront-armsdown` + four leg
   adjusts + `rotate` −15), and carrying a figure (three conditions).
   Chapter 6 uses `stepwide-swordcarry` + `rotate` 20 ten times as the
   flying carrier. Each recipe is copied into every panel that needs it,
   and none of them reads as what it is.
6. **Stand-ins are named by what they are, not by what they play.**
   `tree-trunk` with `rotate` −90 is the ram (13.12), a red `rock-circle`
   at `scale` 0.15 is a fruit (05.21), `half-circle` is a bowl, rotated
   `rock-square`s are flying debris. From the JSON, 13.12 has a tree and
   some rocks in it, and no wall at all. The scene line is the only place
   the meaning is written down.
7. **Entries are hard to identify.** Duplicate ids make relations and
   `on` ambiguous. A prop with `character` (`giant-grab` recoloured as
   Rama's hand, 09.02a, 10.31) contradicts the rule *an entry with
   `character` is a figure*. The scene line talks about "the near one"
   and "the carrier", but only some panels give an entry that `id`.
8. **A pose name does not say how it will look beside the others.**
   `step-hang` and `stepwide-fists` sit next to each other in the
   catalogue. What the artist changes is how much energy a figure has,
   and the names and descriptions do not say that.

## Proposals, most useful first

### 1. A text read-back: `tools/describe-panel.mjs` (implemented)

Lay the panel out exactly as `renderPanel` does and print the resolved
picture as text, one line per entry, plus the problems found:

```
12.26  tall 1 (360×360), sea, sky mist, horizon 0.10
  stone1  rock-rectangle  x 0.00–0.27  y 0.00–0.19  cut: left, bottom
  stone4  rock-square     x 0.41–0.49  y 0.05–0.09
  monkey1 (on stone4)     x 0.43–0.47  y 0.09–0.16  23 px tall  facing right, head back (turn −90)
          feet 0.0 hu above stone4's top            ok
  ...
  ! monkey2 on stone6: feet 0.4 hu beside the stone's top (nudge 1.2)
  ! rama's face covered by ravana's right arm (same skin)
  ! raxas_m2 cut by the top edge through the face
```

What it reports:

- each entry's box as shares of the panel, its height in pixels at phone
  size (the convention is 60–150 px figures), which edges cut it, and
  where it is cut (through the face, at the waist, at the knees);
- what each figure stands on: the surface under its feet (ground line,
  foreground, prop top, anchor) and the gap to it;
- what overlaps what, and especially limbs drawn over faces (*skin over
  skin hides a face*);
- facing: who faces whom, and who looks off-panel;
- a silhouette measure per figure (stance width and arm reach in
  head-units, compared with the base's resting width), so `step-hang`
  beside runners is flagged as static.

The same tool with `--props` and `--poses` prints the facts that are now
locked inside SVGs and angle tables: each prop's size in head-units,
facing, anchors and recolour roles; each pose's height, stance width,
and where its hands and head are. It is read-only and needs no change to
the language. It turns the commonest review failure into text the writer
can check before the artist sees the panel, and `npm test` can run its
contact checks over the approved panels as a regression.

### 2. `depth` replaces `row`; `nudge` lifts

**One rule:** `depth` says how far away an entry is, which sets its
ground line *and* its size; `nudge` moves it without changing its size.
A figure in the air is at the depth of the ground under it, lifted by a
nudge. Reading the JSON you can then tell a far-off figure (a large
`depth`) from a near one high in the panel (a large `nudge` up).

#### What numeric rows do today

Today a numeric `row` is a screen height at front-row size
(`row()` in `src/scene.js`). Of the 268 numeric rows in chapters 01–15,
converted to a depth with the scale that keeps today's size:

| Use today | Entries | Becomes |
|---|---|---|
| on the ground, already in perspective (scale within 20 % of what the depth gives) | 19 | `depth`, the `scale` dropped |
| on the ground, perspective set by hand and not quite right (12.26's stones, 13.08's climbers) | 20 | `depth` with a small leftover `scale` |
| above the horizon: fliers, bubbles, sound bursts | 96 | `depth` + `nudge` up |
| lifted, not far (the carried Sita at 0.28, the fallen deer at 0.3, 04.16's runners; depth alone would need × 1.3 to × 4.9) | 62 | `depth` + `nudge` up |
| below the bottom edge, cropped | 52 | a negative `depth`: nearer than the frame |
| top views | 19 | `"camera": "top"` (below) |

So 158 of them mean *higher in the picture*, not *farther away*. The
same number does two jobs, and the reader cannot tell which.

#### The fields

| Field | Values | Meaning |
|---|---|---|
| `depth` | a number, or `front` · `mid` · `back` · `horizon` | **How far away.** 0 = the bottom edge, 1 = the horizon; `front` 0.08, `mid` 0.4, `back` 0.7 (`DEPTH`). The ground line is at `t × horizon` of the panel height, and a man is `0.75 × (1 − t)` of it — today's perspective rows, made continuous. Negative = nearer than the frame: bigger, its ground below the bottom edge (cropped). Above 1 is flagged. `horizon` keeps its own fixed small size (16 px per head-unit in a 1.5 panel) — a far thing there would vanish at true perspective. Default `front`. |
| `depth` (framing) | `top` · `floor` · `closeup` | **Not distances, framing**, kept as names: `top` hangs the entry from the top edge; `floor` sits it on the bottom edge at front size (a foreground band); `closeup` is a camera raised to face height (head at 75 %, the body from the waist up off the bottom). The doc lists them apart from the depths. |
| `nudge` | head-units, `n` or `[dx, dy]` | **Moves without resizing**, in the entry's own head-units: `dy` is the height above its ground — `"nudge": [0, 5]` is five head-units in the air. No "small only" rule; the read-back (proposal 1) reports what is under a lifted entry. |
| `scale` | number | Unchanged: this one is bigger (a giant, a child, a big rock). Now rare. |
| panel `camera` | `"top"` | A top view: no perspective. `depth` is the share of the panel height up the ground (0 bottom, 1 top), and everything keeps front size — today's numeric rows in top views, unchanged. Named depths are flagged in a top view. The tag `topview` then has a field to match. |

**Inherited depth.** Anything `on` an entry takes that entry's depth:

- on a prop's anchor: the prop's depth (its `scale` still says *a bigger
  rock*, not *nearer*, and stays off the figure);
- carried `on` a figure: the carrier's depth;
- on a foreground: the depth where its feet land (`t` = the line's
  height there ÷ the horizon), so figures farther up a slope come out
  smaller with no `scale` (`travel`, `foreground`).

The rules in `panel-writing.md` that a writer must now remember
(*figures on a prop take the prop's row, not its scale*; *a carried
prop is sized by the carrier's row*) then follow from the language and
can go.

**A receding line.** `repeat` gets `to`: the copies run from the entry
toward a point `{ "at": …, "depth": … }`, each touching the last (`gap`
as now, in the copy's own head-units), each sized by its own depth, with
the random size and turn ranges as now. The copies are named
`<name>-1`, `<name>-2` … from the entry outwards, so a figure can stand
`on` one. 12.26's seven stones become one entry:

```json
{ "prop": "rock-rectangle", "id": "stone", "at": 0, "depth": -0.5,
  "repeat": { "n": 7, "to": { "at": 0.58, "depth": 0.9 } } },
{ "character": "monkey1", "pose": "arch-bull", "on": "stone-1#stand", "turn": -90 },
{ "character": "monkey2", "pose": "leap-arc",  "on": "stone-2#stand", "turn": -90, "nudge": [0, 1.5] }
```

with no `scale` on any monkey: each takes its stone's depth.

#### Migration

`tools/migrate-depth.mjs`, exact, so every render stays the same:

1. A named `row` → the same name in `depth`.
2. A numeric `row` `r` in a top view → `depth: r` and the panel gets
   `"camera": "top"`.
3. Any other numeric `row` `r`: if the entry is on the ground (its
   depth `r ÷ horizon` within 0 … 1 and the scale it would need within
   0.5 … 1.5 of today's, or negative) → `depth: r ÷ horizon`, `scale`
   multiplied by the ratio of the two sizes. Otherwise it is lifted →
   `depth: "front"` and the `nudge` up that puts it where it is now.
4. A figure on an anchor or a foreground: its `scale` divided by the
   size its new inherited depth gives, so it stays the same.

`npm test`'s render snapshot must not change, the tagged panels
included: the migration is a refactor. A second pass, by eye, then
drops leftover scales near 1 (an intended visual change, accepted with
`UPDATE_SNAPSHOT=1` after looking; never on a tagged panel without the
artist). `row` keeps reading for old lab drafts, flagged, and
`merge-panel-drafts.mjs` converts it on merge, as with `size` and
`lift`.

Docs to change with it: `panels.md` (Rows becomes Depth; the `on`,
`nudge` and `scale` rows), `panel-writing.md` (the lessons on rows, `on`
and carried props, the foreground on `floor`, seated figures in 0.6
strips), `layouts.md`, `composition.md`, and the panel lab's hints.

### 3. Surfaces on props

Besides point anchors, a prop can carry a **surface**: a polyline in its
`anchors` group (`<polyline id="top" …>`). `"on": "ledge#top"` places the
feet on that line at the figure's own `at`, measured across the prop
(0–1), as a foreground does now. Draw surfaces on `lanka-island` (the
ledge), the rocks, the wall and city props, the palaces and
`giant-face-*`. This removes the large nudges in 13.01a/b, 14.24, 06.12,
09.12 and 09.13, and the JSON says who stands where on the ledge.

### 4. Two fields for meaning

- `look`: a target id or `up` / `down` / `level` / `reader`. The
  renderer aims the head (the `lookAt` of
  `2026-11-07-contact-constraints.md`, never built). It replaces 64
  `spine.head` adjusts and the *Aim the gazes* lesson, and keeps working
  when either figure moves.
- `holds`: `"holds": "club"`, or `{ "right": "club", "left": "bow" }`.
  It replaces 40 `adjust` weapon paths; `adjust` is then left for joint
  angles only.

### 5. Turn the adjust recipes into bases (pose lab)

The artist draws these in the pose lab, and the recipes in
`panel-writing.md` become one line naming the pose:

| Recipe now | Wanted |
|---|---|
| `step-hang` + 4 leg adjusts (flying) | a `fly` base: legs closed, toes pointed |
| `stepwide-swordcarry` + `view: front` + `rotate` 20 (chapter 6, ten panels) | `fly` with a carrying gesture, and the carried figure `on: "ravana#carry"`, a carry point like `#hands` |
| `liefront-armsdown` + 4 leg adjusts + `rotate` −15 (a body lying dead, 17.01–17.03) | a `lieback` / `liedead` base with `ground: "lying"`, so it lies level without `rotate` |
| `kneel-flung` at `rotate` ±120, `fallfront-flung` at 50 (13.12) | a `tumble` base for figures flung through the air |

Any figure `rotate` left over, after these exist, should be what it
looks like: a body tumbling, not a pose corrected.

### 6. Name stand-ins by their role

An alias table, `data/props/aliases.json`:
`{ "ram": { "prop": "tree-trunk", "rotate": -90 }, "fruit": { "prop": "rock-circle", "body": "red", "scale": 0.15 }, "bowl": { "prop": "half-circle" } }`.
A panel then says `"prop": "ram"`. The renderer resolves the alias, and
`prop-gaps.mjs` lists each alias as a drawing still to make. When the
drawing arrives, only the table changes and every panel stays the same.

### 7. Identity checks in `npm test`

- Flag duplicate `id`s in a panel (13.12, 14.01, 14.09 today).
- Rename a prop's `character` (the recolour) to `colors: "rama"`, so
  that `character` always means a figure.
- Give an `id` to every entry the `scene` line refers to (`carrier`,
  `struck`, `near`), so the scene line and the entries can be matched
  up.

### 8. Pose energy

Add an `energy` field (0 at rest … 3 violent) to each base and gesture
in `data/bases.json` and `data/gestures.json`, the artist's judgement in
the pose lab. `pose-gaps.mjs` and the future pose picker would rank
candidates by the beat's energy, and the read-back (1) would flag a
figure two levels calmer than the panel around it. Pending that, add a
lesson to `panel-writing.md` from the 188 pose swaps: the artist moves
`step` → `stepwide` / `run` / `lean*`, and `hang` arms to a gesture
with a job, so a figure in an action panel never keeps `-hang`.

## Order

1 first: it is read-only, catches the commonest failure, and measures
the rest (how many contact errors 2 and 3 remove). 7 is small and can
go with it. 2 and 3 change the language and need the docs and
the tagged panels re-rendered to confirm they are unchanged. 4 and 6
are small renderer changes. 5 and 8 need the artist in the pose lab.
