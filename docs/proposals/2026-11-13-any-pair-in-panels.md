# Any base with any gesture in a panel

2026-11-13 · status: **implemented** (2026-11-13), in
`design/pose-picking.md` (Any pair is a pose) and `design/panels.md`
(`pose`). The reviewed list this kept was dropped on 2026-11-14: its
finding fields moved onto the bases and gestures, and there is no list
of poses any more.

## The problem

A pose is exactly its base and its gesture (`src/compose.js`); nothing
in it is per pose. Yet a panel could only name a pose listed in
`data/poses.json`, so a panel that wanted a known gesture on a known
base had either to list a new pose (finding fields and all) or rebuild
the gesture joint by joint with `adjust`. At the time, 71 of the 259
posed figures carried an upper-body `adjust`; 57 poses were listed out
of 27 × 50 = 1350 possible pairs.

## The change

- **A panel's `pose` may be any `<base>-<gesture>`.** A name not in
  `data/poses.json` is composed when the panel is drawn, with the same
  solves as a listed pose (a gesture's lean on the base's planted feet,
  joined palms, the two-handed grip), and cached per asset set. An
  unknown base or gesture is a panel issue naming the half that is
  wrong; the figure falls back to `step-hang` as before.
- **`data/poses.json` stays the reviewed, findable list**: the poses
  that have been looked at, carry finding fields (`desc`, `ground`,
  `hold`, `use`, `like`) and are offered when picking (catalogue, gap
  report, the future pose picker and spec writer). It is no longer the
  gate on what a panel may draw.
- **Promotion:** a pair used by two or more panels is listed, with its
  finding fields, so it is reviewed and can be found — as an `adjust`
  repeated twice becomes a pose. `tools/pose-gaps.mjs` reports the
  unlisted pairs in use, with their panels, as candidates.
- **Checks:** every panel is already in the render snapshot, so an
  unlisted pair is drawn and guarded like any other figure; a panel
  issue (unknown half) shows in `render-panels` and the panel lab.
- **The panel lab**'s reference lists the bases and the gestures beside
  the listed poses.

## Risks

An unlisted pair has not been looked at as a pose: a gesture that tips
the body on a base that already leans back, joined palms the arms can't
reach from a crouch. The panel render is where that shows, as it does
for an `adjust` today.

## Open

- Going through the 71 upper-body `adjust`s: those that rebuild an
  existing gesture become a plain pair name.
- A pose picker in the panel lab with a base and a gesture chooser.
