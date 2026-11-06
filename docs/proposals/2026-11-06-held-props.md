# Held props: weapons along a reference line

Date: 2026-11-06.
Status: **implemented** (reference lines, weapon drawings, import,
two-handed grip: `docs/design/drawn-parts.md`, style bible §9). Open
points below remain.

## Idea

A held prop is described by the pose as a straight reference line through
the grip of one hand, never by its outline:

    "prop": { "kind": "sword" | "bow", "angle": 0, "out": 0, "draw": true }

`angle` turns the line from the hand's own direction (so a wrist bend
carries the prop with it), `out` turns it out of the paper. The renderer
projects the line like a limb. Whatever is drawn is laid along it, so the
style of a weapon can change without touching any pose.

## Built

- One file per weapon (`data/props/held/sword.svg`, `club.svg`,
  `bow.svg`), each with a `base` layer and optional per-character layers;
  each drawing carries its line, whose ends are the references and whose
  length is the weapon's. Clubs use the sword poses.
- Two-handed grips: `grip: "both"` solves the other arm to the hilt.

## Open points

- **Props per figure**: a panel could swap or remove a held prop
  (`"prop": null`) for a figure without a new pose.
- Arrows in flight and quivers are scene props.
