---
name: flip-panel
description: Mirror one or more panels left to right (every figure and prop faces the other way, positions mirrored). Use when the artist asks to flip, mirror or reverse a panel ("flip 18.01 left to right", "mirror 17.07").
---

# Flip a panel left to right

`node tools/flip-panel.mjs <id> [<id> …]` (`--dry` prints the result
without writing). Per entry it:

- mirrors `at`: a number becomes 1 − at, a slot its mirror (`left` ↔
  `right`, `center-left` ↔ `center-right`), a relation `left-of` ↔
  `right-of` (`before` / `behind` follow the facing by themselves);
- turns `facing` right ↔ left (left out it is right, so it becomes
  `left`), figures and props alike;
- changes the sign of the across part of `nudge` and of `rotate`;
- swaps a foreground's `[left, right]` heights.

It keeps what mirroring by facing already handles: the character's own
right and left (`hands`, `adjust`, held props), the head `turn`, `on`
anchors (a mirrored prop carries its anchors), `depth`, `scale`, `view`.

## Steps

1. **Locked panels.** A panel with `tags` is an approved reference panel
   (`panels/CLAUDE.md`): flip it only when the artist asks for that panel
   by id. The tool says so when it flips one.
2. **Flip**: `node tools/flip-panel.mjs <ids>`.
3. **Look**: `node tools/render-panels.mjs <chapter>`, then read each
   flipped PNG next to the old one (copy the old PNGs aside first). It
   should be the old picture mirrored.
4. **Check** `node tools/describe-panel.mjs <chapter> --problems`. The
   one known difference: a `repeat` with an even count is not symmetric
   about its middle entry (the extra copy goes to the same side), so a
   mirrored row can shift by one spacing and lose a copy off the edge —
   the read-back says "outside the panel". Set that entry's `at` back to
   its old value (an even row of the same things looks the same either
   way), or shift it until every copy is in.
5. **The scene text** says left / right rarely; when it does, fix it.
6. **Test and commit**: `npm test`; after looking,
   `UPDATE_SNAPSHOT=1 npm test`. Commit (author
   `somdip <somdip@gmail.com>`, unsigned), then rebuild and republish the
   panel lab (`node tools/build-panellab.mjs`, the lab URL in the root
   CLAUDE.md). A lab draft of a flipped panel overrides the flip: merge
   or delete it first.
