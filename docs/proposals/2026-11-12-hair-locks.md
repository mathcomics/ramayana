# Hair locks: left and right locks, in front of or behind the shoulder

2026-11-12 · status: **superseded** (2026-11-12) by drawn head views
(`docs/proposals/2026-11-12-head-rendering-survey.md`): a lock in front of
the shoulder is drawn that way in each view; the lock code was removed

Only Sita and Surpanakha keep a front view among the women (the others are
`sideOnly`), so only their long hair has to read well from any direction.
Today it does not, quite:

- The head turn (`src/headturn.js`) pairs a front element with a side
  element and lofts them into a volume of ellipse rows. That is right for
  a skull or a bun, but a long lock is a thin, flat ribbon: at the
  in-between angles it swells into a rounded blob.
- The long hair below the head (`hair-body`) is one shape, pinned at the
  nape and turned with the chest. Both locks always fall the same way, and
  always behind.

## 1. Two drawn locks, node for node

The artist draws each lock in **both** views, as its own path:

| Layer | Front view | Side view (face looking right) |
|---|---|---|
| `lock-right` | the character's right lock (picture-left in front view) | the near lock |
| `lock-left` | the character's left lock (picture-right) | the far lock, where it shows |

Same number of nodes in front and side, in the same order, with the same
segment types (a curve node pairs with a curve node, its handles with its
handles). Node *i* of the front path and node *i* of the side path are
the same point on the hair:

- front gives its **x** (across) and **y**,
- side gives its **z** (forward / back) and **y**.

So every node becomes one 3D point, `(x_front, y, z_side)`, with y the mean
of the two drawings. The importer rejects a lock whose node counts or
segment types differ and warns when a node's two y's differ by more than
0.03 head-units (a drawing slip).

The renderer then rotates the 3D lock like any rigid point set and
projects it. Unlike the lofted volumes, this is **exact at both drawn
angles** (0° shows the front drawing, 90° the side drawing, node for
node), and in between the lock stays a ribbon instead of swelling. The
back of the head (past 90°) needs nothing extra: the same points, seen
from behind.

## 2. Two bones: scalp and shoulders

A lock hangs from the head but lies on the shoulders and back. Each node
moves with the **head** near the scalp and with the **chest** lower down,
blended by height (from the drawn neck line to the shoulder line). A head
turn swings the top of the lock while the ends stay on the body, so the
hair no longer slides off the shoulders when the head turns and the chest
does not. This replaces today's `hair-body` pin for these two characters.

## 3. One lock in front of the shoulder, one behind

A character always wears her hair the same way: **one lock falls in front**
(over the shoulder, onto the chest) and **the other down the back**. Which
is which is part of the drawing, not a choice per panel: the character's
file has one lock layer per side, e.g.

    lock-right-front   lock-left-back

(or the mirror, `lock-left-front` with `lock-right-back`), each drawn in
both views node for node. The importer reports a side with both versions
drawn. Draw order:

| Lock | Front view | Side view |
|---|---|---|
| back | behind the torso (with `back`) | just over the torso's back edge |
| front | over the torso, under the arms | near (right): over the torso, under the near arm; far (left): behind the torso |

Facing left only mirrors the figure, so near is always the character's
right lock, in either facing: with `lock-right-front` the lock on the
chest is the one toward the reader in side view.

## 4. What stays

- The skull hair, bun or parting stays in `under` / `over`, lofted as now.
- `hair-body` remains for any character without locks; a character with
  locks drops it.
- Side-only characters need none of this: their side drawing is shown as
  drawn.

## Order of work

1. Importer: read the lock layers, check node counts and segment types,
   build the 3D nodes (`data/faces.json`, `locks`).
2. Renderer: project the locks with the head and chest rotations and the
   two-bone blend; draw order as above. Snapshot unchanged for everyone
   without locks.
3. Locks drawn in panels too (they are drawn only in the pose lab while
   the drawing is a mock: `locks: true` in the render options).
4. Sita first (lock-right-front, lock-left-back), checked on the face sheet at
   0°, 30°, 60°, 90° and from behind; then Surpanakha.

Drawings are the artist's own; photographs serve only as a reminder of
the idea (one lock forward, one back) and are not traced.
