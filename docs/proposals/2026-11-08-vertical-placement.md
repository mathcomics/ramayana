# Vertical placement: one `row`

2026-11-08, rewritten 2026-11-09 · status: implemented 2026-11-09. `shot`
and `zoom` are gone; `row` places an entry by name (`top`, `horizon`,
`back`, `mid`, `front`, `floor`, `closeup`) or by number, with `front` /
`mid` / `back` in one-point perspective toward the horizon. How it works
now: `docs/design/panels.md` (Rows). All panels were migrated (lifts of
1 head-unit or more became numeric rows at the same height and size,
smaller lifts were dropped, the `mid`-shot panels became `closeup`) and
are reviewed again, the five locked ones included (artist, 2026-11-09).

## Open

- `top`'s size: `front`'s for now; review once panels use it (14.05's
  `giant-fingers` is the first).
- The depths (front 0.08, mid 0.4, back 0.7) and the 75 % head line are
  starting values, to set by eye. `back` comes out as small as the
  `horizon` row (a man 22 % of the panel), so back-row props (huts,
  thrones) shrink noticeably against the old rows.
- Whether a number should take its size by perspective (when below the
  horizon) instead of `front`'s; `front`'s is simpler for things in the
  air and top views.
- `horizon`'s size stays a convention (strict perspective would make it
  vanish).
- A panel-wide size (the retired `zoom`, or a camera) comes back only if
  panels keep needing the same `scale` on every entry.
