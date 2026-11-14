---
name: commit-pose-lab
description: Merge the artist's pose-lab saves (bases and gestures) into data/bases.json and data/gestures.json, commit them, delete the merged saves from the lab and republish the labs and catalogues. Use when the user asks to commit, merge or save what is in the pose lab ("commit the pose lab", "merge my pose saves").
---

# Commit the pose lab

The pose lab (https://claude.ai/artifact/631NuGY6VEftsybpaEDWUA) keeps
the artist's saves in its database, one document per name, in two
collections:

- `bases/<name>`: `{ base, savedAt }`, a whole base (desc, ground, use,
  lean, right and left leg, tail) → `data/bases.json`
- `gestures/<name>`: `{ gesture, savedAt }`, a whole gesture (desc,
  hold, use, chest, neck, head, mouth, right and left arm, optional
  lean / join) → `data/gestures.json`

There are no pose saves: a pose is any `<base>-<gesture>`, and there is
no list of poses (2026-11-14). A document left in a `poses` collection
is from before that; the report names it, and what it says goes onto
its base or gesture by hand.

A save replaces the repo entry of the same name in the lab, so merged
saves are deleted afterwards, as with panel drafts. Read first:
`data/CLAUDE.md` and docs/design/pose-picking.md (The data,
Composition).

The rule that shapes a merge: **every pose is exactly its base and its
gesture**; nothing is per pose. A changed base or gesture changes every
pose that uses it — that is the point, and what to look at.

## Steps

1. **Read the saves.** `ArtifactData` `list` of each collection
   (`bases`, `gestures`, and `poses` for leftovers) with the same `out_dir`, a fresh folder
   in the scratchpad; note each document's `version`. No documents: say
   so and stop.

2. **Report.** `node tools/pose-saves.mjs <out_dir>` prints per save
   `same` | `changed` (the values) | `NEW`, which of the panels' poses a
   base or gesture change reaches, and problems (`!`: names, no desc,
   unknown tag). A save can be older than later repo work (`savedAt`
   against `git log -1 --format=%ci -- data/`): if it would undo a
   committed change, ask the artist before merging it.

3. **Merge.** `node tools/pose-saves.mjs <out_dir> --write` applies the
   new and changed bases and gestures (sorted, repo number style). Then:
   - A **new base** needs `desc`, `ground` and `use`; a **new gesture**
     `desc`, `hold` and `use` (tags only from `tags` in
     `data/poses.json`) — fill what the artist left out by looking at
     it. A wanted pose whose base and gesture now exist leaves
     `wanted`; update panels' `needs` that waited for it.

4. **Look.** `node tools/contact-sheet.mjs male --zoom 3` (and monkey
   when a tail or a monkey panel is involved),
   `node tools/pose-catalogue.mjs`, the base / gesture catalogue for a
   changed base or gesture, and the panels that use the reached poses
   (the report lists them; `grep -rl '"<pose>"' panels/` →
   `node tools/render-panels.mjs <ch>`).
   Read the PNGs at phone size. Log anything that looks wrong in
   `docs/issues/problem-poses.md`.

5. **Test.** `node tools/pose-gaps.mjs` if `wanted` or a `use`
   changed; `npm test`; after looking at the changed renders,
   `UPDATE_SNAPSHOT=1 npm test`, then `npm test`.

6. **Commit** (author `somdip <somdip@gmail.com>`, unsigned):
   `git -c user.name=somdip -c user.email=somdip@gmail.com commit`.
   Message: `Merge pose-lab saves <names>`, then what changed in each in
   plain words (which base or gesture, which poses it reached), then the
   checks run. End with the Co-Authored-By line. Update the counts in
   CLAUDE.md (Where the work stands → Figures) if bases or gestures were
   added or removed.

7. **Delete the merged saves.** One `ArtifactData` `batch` of `delete`s
   with `if_version` from step 1; on a mismatch re-list and merge or
   leave the newer save, and say so. Delete `same` saves too.

8. **Republish.** `node tools/build-poselab.mjs` → `Artifact` publish of
   `out/poselab.html`; `node tools/build-panellab.mjs` → publish
   `out/panellab.html` (panels render the poses); if a base or gesture
   changed, `node tools/base-catalogue.mjs` / `gesture-catalogue.mjs`
   and republish those pages (URLs in CLAUDE.md, Commands).

9. **Report** briefly: per save what changed and which poses followed,
   the renders you looked at, saves left in the lab, that nothing is
   pushed.
