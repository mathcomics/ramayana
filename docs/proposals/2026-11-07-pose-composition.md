# Pose composition: bases and gestures

2026-11-07 · status: proposal (artist to decide)

The three devotion poses were one upper body on three lower bodies:
stand-palms-joined and kneel-palms-joined share their arms to the
degree, and kneel-bow carries the same gesture on a bowed spine. The
pose names already say this — `<base>-<what the arms do>` — and most of
the remaining `wanted` list is a product of a base that exists and a
gesture that exists: sit-hand-on-head and walk-hand-on-head are
stand-hand-on-head's arm on sit and walk; kneel-palms-joined was kneel ×
palms-joined; sit-slump, stand-arms-out and kneel-bow are spine-and-arm
gestures on known bases. This proposes making that factorisation usable
without changing what a pose is.

## The split

| Half | Fields | Owns |
|---|---|---|
| **base** (lower) | both legs (hip, knee, ankle, out, kneeOut, toe), `spine.lean`, tail | what carries the body: the index's `ground` |
| **gesture** (upper) | both arms (all fields, incl. `prop`), `spine.chest`, `neck`, `head`, mouth | what the body does and how the upper spine carries it |

`spine.turn` stays out of both (rule 3: where the figure looks is set per
panel). A gesture that bows (kneel-bow) also wants `lean`, which belongs
to the base — so a gesture may carry a **lean delta**, and composing
applies it with the feet pinned (hips take the delta, the pin-feet solve
in the lab, or `hip += Δlean` in a tool).

## Why composing gives a draft, not a pose

Today's session showed the joins are not mechanical:

- Arm angles are torso-relative, so the same gesture on a bowed spine
  needs compensation (palms-joined: shoulder 38 standing, 62 bowed — the
  hands stay at the chest, which is a choice, not a formula).
- The contact solves re-run per combination: palms to the midline, the
  far hand laid on the near one, feet re-grounded.
- The silhouette must be re-read at phone size every time (rule 8).

So composition is a **draft generator**: it does the mechanical 80% and
the artist finishes in the lab, exactly like today's wanted-pose flow
but starting from the right place instead of from `stand`.

## Proposed, in build order

1. **Name the gestures in the index** (data only). A `gestures` section
   in `data/pose-index.json`: each entry a name (`palms-joined`,
   `hand-on-head`, `arms-out`, `slump`, `bow`…), the pose that carries
   its reference copy (`from: "stand-palms-joined"`), its `use` tags,
   and flags the solvers need (`join: true` for palms). Costs minutes,
   lets `pose-gaps` report which base × gesture products the scenes ask
   for instead of flat pose names.

2. **A combine step.**
   - Tool: `node tools/combine-pose.mjs <base-pose> <gesture>` → a
     draft pose named `<base>-<gesture>`: legs + lean + tail from the
     base, arms + chest/neck/head + mouth from the gesture's reference
     pose, lean delta applied with hips compensated, then the solvers
     (join + overlap when flagged). Printed as JSON or written straight
     into `data/poses.json` with its index entry.
   - Lab: an "Arms from…" action — pick a pose in the gallery to take
     only its upper half into the current pose (and its mirror "Legs
     from…"). Same code, interactive.

3. **Later, only if 2 proves itself: composition as spec.** Panels name
   `pose: "kneel + palms-joined"` and the renderer composes at render
   time. Deferred on purpose: it moves the solvers into the render path
   and forfeits per-combination tuning, and kneel-bow (chest 42, elbow
   110 vs 104) shows the products are not free. If most combined drafts
   ship untouched, revisit.

## The bases, drawn

`node tools/base-catalogue.mjs` draws every distinct lower body with
stand's upper body on it (48 poses → 32 bases: 0.2 head-units over the
leg joints, plus the tool's `CURATED` merges where the artist's eye
overrules the metric — all four lunges are one stance, 2026-11-07; the
kneel family, the six sword stances, the archery stance and the narrow
stands each collapse to one). Published:
https://claude.ai/artifact/9VH3oVabnkmaxNHcwDFLzz — republish the page
after pose changes.

## What it buys now

Drafts in minutes for the products still on the wanted list
(sit-hand-on-head, walk-hand-on-head, kneel-palms variants, sit-slump,
stand-arms-out), one gesture kept consistent across bases, and a
vocabulary (base, gesture) the index, the gap tool and the panel writer
already speak informally.
