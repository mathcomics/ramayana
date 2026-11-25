# Why panels use `nudge`

Surveyed 2026-11-25, at `caf1dc3`. Open: nothing suggested here is built.

`nudge` moves an entry without resizing it (`docs/design/panels.md`,
Figures). It is meant for a thing in the air. Over half of the nudges do
something else: they stand in for an anchor, an edge or a framing the
panel language cannot say. Each of those is a number found by eye, which
breaks when the thing it was measured against moves.

**386 nudges in 164 of the 363 reader panels.** The reference panels
have none, and the 10 in `panels/icons.json` are not counted. Every nudge
has one main reason here. The sorting was by hand, from the JSON, the
read-backs and about 80 panels looked at; a borderline nudge could be
moved to a neighbouring row.

| Group | Reason | Nudges | Panels |
|---|---|---|---|
| In the air | A figure: flying, leaping, flung | 82 | 56 |
| | A thing: arrow, rock, something falling or cut off | 28 | 20 |
| | An effect or the sky: streak, bubble, cry, smoke, cloud, moon | 39 | 34 |
| Contact | Rests on something with no usable anchor | 36 | 21 |
| | Behind an edge: sunk below a foreground's line or a rock's top | 43 | 13 |
| | Placed by eye on a body or on something held | 30 | 16 |
| | On an anchor, then moved off it | 20 | 9 |
| | A small fix so two things touch | 19 | 15 |
| Framing | How much shows at a frame edge | 50 | 36 |
| | Scenery set to a level | 26 | 26 |
| | On the ground, but its place and its size disagree | 9 | 5 |
| Nothing | `[0, 0]` | 4 | 4 |

In the air 149 (39 %), contact 148 (38 %), framing 85 (22 %), nothing 4
(1 %).

## What the numbers show

- **Rotated props.** Of the 36 with no usable anchor, 23 are on or
  measured against a prop turned with `rotate`: a rock as a mountain, the
  cry in 06.01. A prop's own anchors do not turn with it, so what stands
  on it is placed by hand. 15.09, 15.09a and 15.10b hold 13 of them: the
  flowers, and Hanuman, on the mountain of herbs.
- **Behind an edge.** 40 of the 43 are `on` a foreground. The shore
  (chapter 12) uses −0.3 to −0.7, the walls (chapter 13) −1 to −3.2.
- **Large numbers come from `scale`.** 54 nudges move up or down by more
  than 8 head-units, and 50 of those are on entries scaled below 1, whose
  unit is small. The 92 in 04.08 is drops of blood at `scale` 0.05.
- **Left from `row`.** 169 carry three decimals (`2.519`). Those look
  like what `tools/migrate-depth.mjs` wrote to keep a lifted `row` in
  place, not values chosen by the artist. Not checked against git.
- 117 move down, and 84 move across at all.

## Suggested, in order

The counts are upper limits: how many nudges have that reason, not how
many are sure to go.

1. **Say "behind" on a foreground** (40). One field for a figure standing
   behind the line and hidden up to some height. To decide: whether it
   takes head-units, a share of the figure, or a body part (knees, waist,
   chest), and whether it works on a prop's top edge as well (16.02a,
   16.02b).
2. **Turn a prop's anchors with its `rotate`** (23). The anchors already
   follow `facing`. The flowers on the mountain also need points along
   the slope, so they wait for 4. Figures standing on a turned prop today
   are tuned to the unturned anchor, so their nudges must be reset in the
   same change.
3. **More anchors on figures and held things** (24). The neck, for heads
   (17.16, 17.17: 11); the tip of a held arrow (17.22, 17.22a, 17.22b:
   7) and of a spear (11.20: 1); and a figure's feet on another's
   shoulders (13.05: 4; `#shoulder` lands the hips), a load in the two
   hands of a close `giant-grab` (10.31: 1).
4. **Stand along an edge of a prop** (20, and part of 2). Already
   proposed as *surfaces*: `docs/proposals/2026-11-20-readable-panels.md`,
   section 3. For the ledge in 13.01a and 13.01b, the stones of 12.26
   and the chariot of 18.05.
5. **Say where the frame cuts** (50). For example "shows from the waist
   up", or "flush with the top edge". Most are scenery pushed below the
   bottom edge, figures cut at the legs, or giant parts coming in from an
   edge.

Smaller, and possible at any time: remove the four `[0, 0]`, which change
nothing; round the values left from `row` when a panel is next worked on.

Not a problem: the 149 in the air. `nudge` is the right field there.

Locked reference panels use nudges too: 03.02, 03.10, 07.01, 09.12,
09.13, 09.15, 10.01, 10.02, 10.07, 11.25, 14.16 and 16.19. Converting
those needs the artist's consent, even when the picture stays the same.

## The panels, by reason

A number in brackets is how many nudges of that kind the panel has.

- **A figure in the air** (82): 05.15, 05.25, 05.26 (2), 06.04, 06.05 (2),
  06.06 (3), 06.07 (3), 06.09 (2), 06.10 (2), 06.13 (2), 08.04, 08.05 (2),
  08.07, 08.08 (2), 08.10, 08.18, 09.08, 09.14, 09.15, 10.01, 10.02,
  10.04, 11.04a, 11.15, 11.22, 11.25, 11.25c, 12.08, 12.09, 12.17c (2),
  12.26, 13.01b, 13.08, 13.12 (7), 13.15, 13.16 (3), 14.16, 14.18 (2),
  14.19a, 14.24 (3), 15.07, 15.08, 15.08a, 15.10b, 15.12, 15.13, 15.14,
  15.16a (2), 16.11a, 16.13, 16.18, 16.19 (3), 17.19a, 17.20, 18.02, 18.05
- **A thing in the air** (28): 04.08, 04.09 (2), 06.06 (2), 06.10, 06.11,
  09.02a, 12.17, 12.23, 13.07, 13.08b, 13.12 (3), 14.19a, 14.20,
  14.21a (2), 14.21c (2), 14.22 (2), 16.13, 16.15, 17.10, 17.14 (2)
- **An effect or the sky** (39): 01.09, 03.12, 04.08, 05.15, 05.16, 05.17,
  05.26, 06.01, 06.07, 06.10, 06.11, 06.12, 10.04, 10.28, 10.33, 11.02,
  11.25, 11.27, 11.28 (2), 14.09 (2), 15.02a (2), 15.05a, 15.06, 15.08a,
  15.10, 15.10a, 15.12, 15.13, 16.02a (2), 16.02aa, 16.02b, 16.02c,
  17.19a, 18.05 (2)
- **No usable anchor** (36): 06.01, 07.01, 07.02 (2), 07.03 (2), 08.01a,
  08.02, 08.03, 09.12 (2), 09.13, 10.06, 11.25c, 14.01, 14.03 (2),
  14.24 (2), 15.01, 15.02a, 15.09 (5), 15.09a (5), 15.10b (3), 15.14b,
  18.07
- **Behind an edge** (43): 03.02, 07.04, 12.01b (7), 12.12 (7),
  12.17a (4), 12.17b (4), 12.17c (2), 13.02a (5), 13.07 (5), 13.08,
  13.08b (4), 16.02a, 16.02b
- **By eye on a body or something held** (30): 04.10, 05.14, 05.15, 06.09,
  10.31, 11.20, 13.04, 14.01, 14.09 (2), 15.14a, 16.18, 17.16 (2),
  17.17 (9), 17.22 (2), 17.22a (2), 17.22b (3)
- **On an anchor, then moved off it** (20): 06.12 (2), 10.17, 12.23,
  12.26 (3), 13.01a (3), 13.01b (3), 16.02a, 16.02c, 18.05 (5)
- **A small fix so two things touch** (19): 03.08, 03.09, 03.10, 05.22,
  05.23, 05.24, 11.04, 11.15, 11.21, 11.22, 11.23, 11.25ca, 11.25d,
  12.20 (2), 13.05 (4)
- **How much shows at a frame edge** (50): 03.01, 06.04, 06.25, 07.02 (3),
  07.03 (3), 08.14, 08.15, 09.02a (2), 09.07, 10.05, 10.07, 10.08, 10.09,
  10.10 (2), 10.31 (2), 11.15, 11.25c, 11.25ca, 12.16a, 13.08, 13.12 (3),
  14.01 (4), 14.03, 14.15 (2), 14.16, 14.17, 14.18, 14.20a, 15.09, 15.09a,
  16.02aa, 17.22, 17.22a, 17.22b, 17.22d, 18.05 (2)
- **Scenery set to a level** (26): 07.01, 08.03, 09.12, 09.13, 10.04,
  10.10, 10.17, 11.01, 11.02, 11.03, 11.04a, 11.23, 13.01a, 13.01b,
  13.08b, 14.01, 14.23, 14.24, 15.00a, 15.08a, 15.09, 15.09a, 15.10b,
  15.11, 15.11a, 15.14b
- **Place and size disagree** (9): 05.17 (2), 06.24, 09.07, 11.25c,
  15.02a (4)
- **`[0, 0]`** (4): 07.01, 11.05, 14.01, 17.19a
