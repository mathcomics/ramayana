# Heads at an angle: a survey of alternatives

2026-11-12 · status: **built** (2026-11-12): six drawn views, the missing ones generated once
(`tools/bake-views.mjs`); queue `docs/issues/missing-views.md`

## Decision (the artist, 2026-11-12)

A model that gets these six heads right is adequate (marked on the
turn grid for Rama):

| View | Angle | Layer in the face file |
|---|---|---|
| front | 0°, level | `front` (exists) |
| three-quarter | 30°, level | `quarter` (new) |
| side | 90°, level | `side` (exists) |
| back | 180°, level | `back-view` (new; name to settle, `back` is taken by a layer) |
| front, looking down | 0°, down 40° | `front-down` (exists, optional) |
| top of the head | 0°, down 90° | `top` (new) |

Each is drawn, base face and character parts as now, and shown exactly as
drawn: no in-betweens. Turns to the other side mirror the drawing. A head
snaps to the nearest view: yaw to 0 / ±30 / ±90 / 180, and in the front
view the nod to level / down 40 / down 90. A side-view nod stays a
rotation of the side drawing. No up views: the panels never look up more
than 5°. The two monkeys looking down from the cliff in 07.03 (46°–57°)
are front-down and top.

Mapped onto today's panels: the 25 small front nods → level front (past
about 20° → front-down); Ravana at 30° and 40° → three-quarter; the
three back views → back.

The head is drawn turned and tilted to any angle by a 3D model built from
the front and side drawings (`src/headturn.js`, `tools/face-turn.mjs`):
each shape drawn in both views becomes a stack of elliptical slices (front
width × side depth at each height), sorted by depth; shapes drawn once
(eyes, mouths, ears) are flat cards on that surface. The artist's verdict:
**fine for monkeys, fine for eye placement, not great for mouths, bad for
hair** — and each fix (hair locks, a hair cap) adds machinery without
fixing the cause. Hair is not a stack of ellipses: it is thin, non-convex
and wraps around the skull, and the slices of nested shapes (hair around
skull) sort wrongly from some angles.

## What the panels actually need

All 236 character figures in `panels/` (2026-11-12), by how the head is
drawn today:

| Head | Figures |
|---|---|
| exactly the side drawing (a tilt is a rotation of it) | 197 |
| exactly the front drawing | 3 |
| side-only characters (drawing as drawn) | 7 |
| **computed in between** | **29** |

The 29 in-betweens:

- **25 front-view figures nodding slightly**, 4°–15° up or down (the
  gesture's head and neck angles seen from the front);
- 2 three-quarter turns (05.05 Ravana 30°, 06.03 Ravana 40°);
- 3 back views (02.14 Rama 120°, 05.09 Sita 180°, 07.03 monkey1 180°);
- 2 heads bowed 46°–57° (07.03, Hanuman and monkey1 looking down from the cliff).

Nothing near 90° up or down, and no continuous turning: these are still
pictures. The 3D model serves 12 % of the heads, and almost all of those
are small front-view nods.

## The alternatives

### A. Drawn views, picked by angle (drawing substitution)

The artist draws the head at a few fixed angles; the renderer picks the
nearest and draws it as drawn — never an in-between. This is how
turnaround sheets, most 2D game sprites (4 or 8 directions), Toon Boom's
drawing substitution and Adobe Character Animator's head turner (left
profile, left quarter, frontal, right quarter, right profile, plus up and
down) work.

- Views: **front** and **side** (exist), **back** (new: mostly hair), and
  optionally **three-quarter** (new). Up / down: the existing `front-up` /
  `front-down`.
- Hair, mouths, locks over the shoulder: exactly as drawn in that view.
  A lock in front of one shoulder is simply drawn that way in each view.
- Cost: one or two more drawings per character that is ever seen from
  the front (the men, the monkeys, Sita, Surpanakha). Snapping is
  invisible in still pictures; the panel writer picks a view, not an
  angle.
- Removes: the slice model, the cards, the locks — `headturn.js`,
  `face-turn.mjs`, `face-locks.mjs` (about 500 lines).

### B. Shape tweening between drawn views

As A, plus in-between angles by morphing each outline from one drawn view
to the next, node for node (Flash shape hints, Toon Boom morphing,
Cartoon Animator's 360 head). The artist already draws matched nodes for
the locks; the same discipline per shape, per pair of neighbouring views.

- In-betweens look drawn (the outlines are the artist's, only blended),
  hair included; layering is decided per view and switches at the
  midpoint.
- Cost: matched nodes in every shape of every view; a 2D blend between
  views that differ a lot (front ↔ side) still looks mechanical — so in
  practice it wants the three-quarter view too.
- Worth it only if the story needs many angles between the drawn ones —
  the panels show it does not.

### C. A flat-part rig (2.5D parallax)

Every feature is a flat drawing pinned to a point on a simple head shape
(an ellipsoid); turning the head moves and squeezes each part by its
point's depth, and swaps the outline drawing at set angles (Cartoon
Animator, Moho, After Effects puppet rigs). This is the part of today's
model that works — the eyes are cards.

- Good for small nods: eyes, brows and mouth slide down the face as it
  lowers; the outline and hair are the drawn view, squeezed a little.
- Cost: an anchor per feature per view; hair is still one flat piece per
  view (which is fine — that is option A for hair).

### D. Mesh deformation (Live2D, Spine, Rive)

The front drawing is warped by a deformer grid to fake turns and nods up
to about 30°. Very good for small nods and expressions; needs a rig per
character in an authoring tool, and does not reach the side or the back —
those stay separate drawings.

- Matches the 25 small nods well, but brings an external tool and a rig
  per character for a nod that moves the features by at most about 0.13
  head-units (sin 15° × half a head) — 1–3 px on a phone, where heads are
  8–20 px tall.

### E. A real 3D head, drawn flat (toon shading)

A 3D model rendered with outlines and flat colours (as in cel-shaded games).
General, but the drawings would no longer be the artist's (CLAUDE.md: the
figures come from the artist's drawings); a modelling tool and a 3D
pipeline. Not recommended.

### F. Today: slices from two silhouettes, plus cards

Kept here for comparison: works for compact, convex heads (monkeys, the
skull), for features that are small cards (eyes); fails for hair (thin,
wrapped, non-convex) and for mouths (a flat card sliding on a lofted
surface, not drawn at that angle).

## Recommendation

**A, with C only for the small front nods.**

- Every head is one of the artist's drawings: front, side, back (new), and
  three-quarter where a panel needs it (two panels today). A figure's head
  turn snaps to the nearest drawn view (`turn` 0 / 45 / 90 / 135 / 180);
  side-view tilts stay rotations of the side drawing.
- The front-view nods (25 figures, 4°–15°): `front-up` / `front-down` when
  drawn and the nod is past about 10°, otherwise the level front drawing
  with its eyes, brows and mouth moved down (or up) by the nod — the one
  piece of C kept, because it is the piece that works today.
- The two heads bowed 46°–57° (07.03) use front-down and top.
- Long hair: drawn per view (front, side, back) as part of that view's
  `back` / `over` layers, with `hair-body` for the length on the body.
  The lock in front of the shoulder is just how the front and side views
  are drawn.

What it costs the artist: a back view for every character seen from the
front, a three-quarter view only when a panel asks for one. What it
removes: the slice model and everything built on it, and with it the
mismatched-heights warnings (`import-faces` `~` lines) that only exist
because the two views have to agree in 3D.

## Questions for the artist

1. Back view: draw one for every front-capable character, or only when a
   panel needs it (and until then a back view falls back to the side
   view, mirrored)?
2. Three-quarter view: draw it, or let a 30°–40° turn snap to front or
   side?
3. Small nods: is moving the features (C) enough, or should a nod snap to
   the nearest of level / `front-up` / `front-down`?
4. The hair-lock work (2026-11-12, `docs/proposals/2026-11-12-hair-locks.md`)
   and the cap cut on Sita become unnecessary under A: drop them?
