# Reference compositions

The kinds of scene the artist has approved a model for, named by tag, and
how the rows are set. The rules behind them: `docs/design/composition.md`.
The panel language, heights and the rows: `docs/design/panels.md`.

## Where composition is kept

| What | Where |
|---|---|
| Models to follow for a kind of scene | the tagged panels; the tags below |
| The rules they taught | `docs/design/composition.md` |
| Row geometry | `DEPTH`, `HEAD_TOP` in `src/scene.js`; the table in `docs/design/panels.md` |
| Scene props (throne, deer, hut from above, Lanka …) | `data/props/` (any SVG there is a prop) |

## Tags

A panel carrying `tags` is an **approved reference panel**: artist-reviewed
and locked — follow it, never rework it (`panels/CLAUDE.md`). Only the
artist's review adds a tag; untagged panels are not models, however good.

The panels themselves are the examples, so this list names none — ids
change and models are added. Before writing a scene of one of these kinds,
find its models and render them:

    grep -rl '"tags".*"frieze"' panels/

A panel can carry several tags (a `frieze` with a `giant` in it). A new
tag goes in this table in the same commit as the review that adds it
(`npm test` checks every panel tag is listed here).

| Tag | Kind of scene | How it is built |
|---|---|---|
| `opening` | a chapter opener: the place before anyone is in it | no figures — the chapter's place prop alone, centred: a palace on the `horizon` row over open ground, or an empty throne on the `mid` row in a flat-coloured hall. Which chapter opens on what: `composition.md`, Chapter openers |
| `throne` | a king on his throne | the throne centred on the `mid` row, the king seated `on` it in `view: front`; the hall a flat ground colour (`dusty-pink`, `geru`), no sky. It follows an `opening` of the empty throne |
| `closeup` | one figure close, reacting | a 0.6 strip, one figure on the `closeup` row, cut at the chest by the bottom edge: head and shoulders only, against the flat colour of the place |
| `forest` | travelling through the forest, side on | the walkers small on the `horizon` row, all facing one way; `trees-side` on the horizon at the far side; a `tree-trunk` on the `closeup` row cut by the near edge frames the panel |
| `spy` | someone watched from hiding | the `forest` layout with the watched at the back on the `horizon` row, and the watcher big in front on the `closeup` row behind the near trunk, seen from behind (`turn` −90): the reader looks over their shoulder |
| `travel` | the travellers come toward the reader | front views on and behind a rising fold of ground (a `foreground`, standing `on` it); the farther the figure, the deeper behind the fold; flowers at the near edge |
| `foreground` | a band crossing the land | a sloped `foreground` across the lower panel; the figures small and evenly spaced `on` it, side on, all facing up the slope, plain sky above |
| `layers` | a busy scene in depth: people at several distances at once | the figures spread over the perspective rows — small ones far on `back` (with the place's prop, e.g. a throne), the main actor on `mid`, others big on the near rows; vary facing and view (one in `view: front`, coming at the reader) and let the nearest be cut by the edges. Size and overlap carry the depth |
| `frieze` | a crowd in one movement — running in, fleeing | a 0.6 strip, no sky: five or so figures side on across it, all `facing` one way (one may turn back), different runs (`run-pump`, `runlow-pumplow`, `runwide-hang`, `leap-reach`, one raised on a `row`), cloth colours and patterns all different, `mouth` 3 for panic. What they run from or toward sits at the far edge (fire) |
| `giant` | a giant among ordinary figures | only part of the giant is in frame — the hand reaching down from above (`giant-grab`); the figures under it break around it — one crawling, one flung, one turned back |
| `grapple` | two fighters locked | the two alone at the centre of an empty panel, side on, facing each other, chests together and arms over each other's shoulders, a long braced leg behind each, `mouth` 3 |
| `chase` | one figure pursuing another | both facing the same way, the fleeing one ahead at the far edge, the chaser behind |
| `horizon` | the action far off, on the horizon | sky over plain ground and nothing in between: the figures small on the `horizon` row. The horizon and the size do all the work |
| `topview` | a crowd or place seen from above | no sky; top-view props (`monkey-top`, `male-top`) on numeric rows up the ground as distance, the leader nearest the bottom edge; water as `wave-top` on the `floor` row |
| `mountain` | a figure on a summit | a tall panel; a big rock (`rock-square` at scale 2) on the `closeup` row fills the lower half, cut by the edges, the figure small on its top against the sky |
| `fly` | a figure flying across a great space | sky over `sea` with a low `horizon`; the figure tiny, high in the panel, in a diving pose — the empty space is the subject |
| `city` | moving over a city at night | a 0.6 strip, ground `night`; the rooftops (`city-gap`) big and cut by the edges at the bottom, lit windows, the figure small leaping between them `on` the gap's `stand` anchor |

## Setting the rows

`front`, `mid` and `back` are perspective rows: each is one depth `t`
(`DEPTH` in `src/scene.js`), and the horizon and a man's head height on
the bottom line (`HEAD_TOP`, 75 %) give its ground line and size
(`docs/design/panels.md`, Rows). To retune them, change a `t` or
`HEAD_TOP`, render a panel with a man on each row, and look; every panel
follows.
