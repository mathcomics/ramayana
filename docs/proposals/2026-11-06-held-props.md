# Held props: weapons along a reference line

Date: 2026-11-06.
Status: **partly implemented.** The reference line and the generic shapes
are built (`docs/design/drawn-parts.md`, style bible §9). Still to do: the
artist's prop drawings laid along the line, and two-handed grips.

## Idea

A held prop is described by the pose as a straight reference line through
the grip of one hand, never by its outline:

    "prop": { "kind": "sword" | "bow", "angle": 0, "out": 0, "draw": true }

`angle` turns the line from the hand's own direction (so a wrist bend
carries the prop with it), `out` turns it out of the paper. The renderer
projects the line like a limb. Whatever is drawn is laid along it, so the
style of a weapon can change without touching any pose.

## Drawings (to do)

One SVG per prop kind in `data/props/held/<kind>.svg`, imported like the
body parts (curves kept, only moved, turned, scaled along the line):

- **sword**: the outline drawn pointing straight up, with anchors `grip`
  (where the hand closes) and `tip`. The line's length comes from them;
  a character could have its own sword (`data/characters.json`:
  `props.sword`).
- **bow**: kept as a simple arch (decided with the artist): anchors
  `grip`, `top`, `bottom` (the string ends) and the drawn arch; the string
  and arrow stay generated, from the tips to the drawing hand.
- Side and front drawings if the edge-on look (front view) needs one.

## Open points

- **Two-handed swords**: the other hand is posed by hand to sit on the
  hilt; a `grip: "both"` setting could move it there automatically (the
  other arm solved to reach the hilt).
- **Props per figure**: a panel could swap or remove a held prop
  (`"prop": null`) for a figure without a new pose.
- Arrows in flight and quivers are scene props.
