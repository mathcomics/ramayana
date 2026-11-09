# Vertical placement: an `up` field (% of panel height)

Status: proposed, 2026-11-08. Prompted by the artist asking what unit
`at` uses and whether a %-of-height unit would be more intuitive.

## What the conventions are today

(The rules live in `docs/design/panels.md` — Placement, and Rows and
figure size — and in `SHOTS` / `row()` in `src/scene.js`. This section
only collects them in one place.)

**The panel.** Every panel is 360 units wide; its height is `tall` × the
width: 540 / 360 / 216 units for `tall` 1.5 / 1 / 0.6. The viewBox is in
these units.

**Horizontal: `at`.** A 0–1 share of the panel's **width** (0.5 =
centre; the named slots are sugar for fixed shares). It already is a
percentage — of width, never of height. It says nothing about vertical
position.

**Vertical: `row` + `lift` (+ `horizon`).** An entry stands on its
row's ground line. Each row of each shot is defined as (head-unit in a
540-tall panel, ground line as a share of the panel height); both scale
with the panel, so **a figure's share of its panel is constant per
shot × row, whatever the height**. A figure ≈ 7.5 head-units tall:

| shot | front | mid | back | horizon | floor |
|---|---|---|---|---|---|
| `far` | 64 % | 47 % | 33 % | 22 % | 64 % |
| `wide` | 77 % | 57 % | 40 % | 22 % | 77 % |
| `mid` | 153 % (cropped) | 113 % | 80 % | 22 % | 153 % |

(`unit × 7.5 / 540` from `SHOTS`; `horizon` is 16 px/head-unit at 1.5
and stands on the panel's `horizon` line, default 0.37; `floor` is the
bottom edge at the front row's scale.)

**Props with no `scale`** work the same way: the drawing's viewBox (100
px = 1 head-unit) gives its size in head-units, and the row's unit
turns that into panel units. So a 4-head-unit palace on the front far
row is 4 × 46 / 540 ≈ 34 % of the panel height.

**`lift`** raises an entry off its ground line, in the entry's **own
head-units** — it scales with the entry's `scale` (and a figure's
`zoom`). Right for body-relative motion (a leap of 1.5 = one and a
half body heights, at any panel height); wrong-footed for scenery, where
"two of this prop's heights up" means nothing compositional.

## The problem

Placing scenery at an absolute height keeps costing arithmetic:

- the giant's fingers entering from the panel's top edge (14.05);
- Hanuman over the roofs (10.03: `lift` 4.2, found by trial);
- top views, where rows mean little and every prop is placed by `lift`
  (03.01, 09.09 — the monkey-tops needed lifts 8.4 / 9.4 / 8.2, and
  doubling a scale doubles the lift's meaning, which has bitten twice);
- hanging things (flower rain, `lotus-*` placed with negative lifts).

Horizontal placement never has this problem because `at` is already a
share of the panel. Vertical placement has no equivalent.

## Proposal: `up`

A per-entry field `up`: 0–1, the height of the entry's **bottom edge**
above the panel's bottom edge, as a share of the panel height — the
same convention as the panel's `horizon` field, applied to one entry.

- `up` replaces the row's ground line; the entry still takes its row's
  **unit** for scale (default front row, as today). So `row` keeps
  answering "how big", `up` answers "how high", `at` answers "where
  across".
- `up: 0` = standing on the bottom edge (what `row: "floor"` does);
  `up: 1` = bottom edge at the panel's top (the entry hangs out of
  frame — useful with negative values' opposite: things entering from
  above sit at `up` ≈ 0.8–1 with their drawn height reaching down).
- Mutually exclusive with `lift` and with `on` (an issue if combined).
  `lift` stays for body-relative motion; nothing migrates
  automatically.
- Implementation: one branch beside `lift` in `makeFig` / `makeProp`
  (`groundY = H * (1 - up)`), a docs row in panels.md (Placement), a
  test.

### Why `at` itself should stay width-relative

Reading `at` as % of height would break every panel and make the two
axes inconsistent; and width is the stable axis (always 360 units),
while height varies with `tall`. The intuition the question points at
is real, but it is the missing *vertical* percentage — `up` — not a
change to `at`.

## Open questions

- Name: `up` (reads as a measure from the bottom) vs `atY` vs `bottom`.
- Should top views (no horizon, no rows that mean anything) make `up`
  the house style and keep `lift` out of them entirely? The lesson list
  currently says "top views place props with `lift`" — it would say
  `up` instead.
