# Reference compositions

The model panels to follow when a panel is a scene of a known kind, and
how a shot's row geometry is measured. The rules these panels taught:
`docs/design/composition.md`. The panel language, heights and the shot
tables: `docs/design/panels.md`.

## Where composition is kept

| What | Where |
|---|---|
| Models to follow for a kind of scene | the panels below |
| The rules they taught | `docs/design/composition.md` |
| Row geometry of the shots | `SHOTS` in `src/scene.js`; the tables in `docs/design/panels.md` |
| Scene props (throne, deer, hut from above, Lanka …) | `data/props/`, each registered in `data/props.json` |

A panel carrying `tags` is an **approved reference panel**: artist-reviewed
and locked — follow it, never rework it (`panels/CLAUDE.md`).
`grep -rl '"tags"' panels/` lists them all; `grep -rl '"tags".*panic'
panels/` narrows to one tag. The untagged models below are the best panel
of their kind so far: follow them, but they can still change.

## Model panels by kind of scene

| Kind of scene | Model | What it does |
|---|---|---|
| the forest home from above | 03.01 (= 04.01) | top view, no sky: ground `sage`, the hut `lift`ed to the middle of it, a clump of trees near the top-left corner and the same clump again bottom-right |
| travelling: the three walk toward the reader | **03.02** — `travel` | front views behind a rising fold of ground (`forest-ridge`); the farther the figure, the deeper behind the fold; flowers at the near edge |
| a crowd seen from above | **09.09** — `travel`, `topview` | top-view props (`monkey-top`) `lift`ed up the ground as distance, the leader nearest the bottom edge, `wave-top` on the `floor` row |
| a king on his throne | 02.01–02.03 (Ayodhya), 05.02–05.03 (Lanka) | three panels: the throne alone on the `mid` row, centred, as the chapter opener; then the king seated `on` it in `view: front`, still far; then the same pair closer in a `wide` (Ayodhya) or `mid` (Lanka) shot. The hall is a flat ground colour — `dusty-pink`, `geru` |
| someone sees something far off | 05.08 | `wide` shot, sky above the horizon: the watcher big in front (1.5×, `lift` −1.5 so the bottom edge cuts them) with `turn` −90 to look off, the subject small on the `horizon` row across the panel |
| something flees into the distance | **05.10** — `chase`, `far` | sky over `dry-grass` and nothing in between: both figures on the `horizon` row, the fleeing one at the far edge, the chaser small behind. The horizon and the size do all the work |
| a far place across the sea | 05.01 | no figures: `mist` sky over `sea`, the island on the `horizon` row a little right of centre, `palace-lanka` on the island's `stand` anchor at half scale |
| a crowd in panic, fleeing | **11.08** — `panic`, `crowd`, `flee` | a 0.6 strip, `wide` shot: five figures all `facing` one way at different runs (`run-pump`, `runwide-hang`, `leap-reach`), `mouth` 3 throughout, cloth colours and patterns all different, the fire they flee at the far edge |
| a crowd in panic under a giant | **14.05** — `panic`, `crowd`, `giant` | the same strip and shot; only the giant's hand is in frame, reaching down; the crowd breaks around it — one crawling, one flung, one turned back the other way |

Any court works from the throne model — Ayodhya's (`throne-ayodhya`),
Ravana's (`throne-lanka`), Kishkindha's (`throne-kishkindha`: 08.10,
09.02); any "arrival at a far place" from 05.01.

## Measuring a new shot

A shot is a set of three rows — `front`, `mid`, `back` — each with a
head-unit (pixels per head-unit in a 1.5 panel) and a ground line
(height above the panel's bottom edge as a share of the panel height,
negative = below it, so the panel crops). `far`, `wide` and `mid` are
measured from the artist's drawings of the shot.

To add one: draw a 360 × 540 page with a ground line and a man standing
on each row. Measure each row's head-unit (the man's height ÷ 7.5) and
its ground line's height as a share of 540, and add the row set to
`SHOTS` in `src/scene.js`. The renderer scales to the other panel heights
itself, so one drawing is enough and need not be kept once measured.
