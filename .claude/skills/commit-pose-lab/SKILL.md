---
name: commit-pose-lab
description: Merge the artist's pose-lab saves (bases, gestures, poses) into data/bases.json, data/gestures.json and data/poses.json, commit them, delete the merged saves from the lab and republish the labs and catalogues. Use when the user asks to commit, merge or save what is in the pose lab ("commit the pose lab", "merge my pose saves").
---

# Commit the pose lab

The pose lab (https://claude.ai/artifact/631NuGY6VEftsybpaEDWUA) keeps
the artist's saves in its database, one document per name, in three
collections:

- `bases/<name>`: `{ base, savedAt }`, a whole base (desc, lean, right
  and left leg, tail) → `data/bases.json`
- `gestures/<name>`: `{ gesture, savedAt }`, a whole gesture (desc,
  chest, neck, head, mouth, right and left arm, optional lean / join) →
  `data/gestures.json`
- `poses/<base>-<gesture>`: `{ pose, savedAt }`, a pose's finding fields
  (desc, ground, hold, use, like) → `data/poses.json`; or
  `{ removed: true, savedAt }`, take the pose out of the list.

A save replaces the repo entry of the same name in the lab, so merged
saves are deleted afterwards, as with panel drafts. Read first:
`data/CLAUDE.md` and docs/design/pose-picking.md (The data,
Composition).

The rule that shapes a merge: **every pose is exactly its base and its
gesture**; nothing is per pose. A changed base or gesture changes every
pose that uses it — that is the point, and what to look at.

Older saves in `poses` hold a whole pose (`pose.spine` …), from before
the split. They are not shown in the lab. Merge one only as the base
and/or gesture change it implies (the report spells it out), and ask the
artist first if it would change other poses than the one saved.

## Steps

1. **Read the saves.** `ArtifactData` `list` of each collection
   (`bases`, `gestures`, `poses`) with the same `out_dir`, a fresh folder
   in the scratchpad; note each document's `version`. No documents: say
   so and stop.

2. **Report.** `node tools/pose-saves.mjs <out_dir>` prints per save
   `same` | `changed` (the values) | `NEW` | `REMOVE`, which poses a base
   or gesture change reaches, and problems (`!`: names, unknown base,
   gesture or tag). A save can be older than later repo work (`savedAt`
   against `git log -1 --format=%ci -- data/`): if it would undo a
   committed change, ask the artist before merging it.

3. **Merge.** `node tools/pose-saves.mjs <out_dir> --write` applies the
   new and changed bases, gestures and poses and the removals (sorted,
   repo number style); older whole-pose saves are left for you to merge
   by hand into `bases.json` / `gestures.json`. Then:
   - A **new pose** needs `desc`, `ground`, `hold`, `use` (tags only from
     `tags`) and `like` — fill what the artist left out by looking at
     it and its siblings. A pose made from `wanted` moves out of
     `wanted`; update panels' `needs` that waited for it.
   - A **new base or gesture** with no pose using it fails `npm test`:
     ask which pose(s) to add, or add the obvious one.
   - A **removed pose** used by panels (`grep -rl '"<pose>"' panels/`)
     needs a replacement in those panels first; ask.
   - `like` lists that name a removed pose: drop the name.

4. **Look.** `node tools/contact-sheet.mjs male --zoom 3` (and monkey
   when a tail or a monkey panel is involved),
   `node tools/pose-catalogue.mjs`, the base / gesture catalogue for a
   changed base or gesture, and the panels that use the reached poses
   (`grep -rl '"<pose>"' panels/` → `node tools/render-panels.mjs <ch>`).
   Read the PNGs at phone size. Log anything that looks wrong in
   `docs/issues/problem-poses.md`.

5. **Test.** `node tools/pose-gaps.mjs` if `wanted` or a pose's `use`
   changed; `npm test`; after looking at the changed renders,
   `UPDATE_SNAPSHOT=1 npm test`, then `npm test`.

6. **Commit** (author `somdip <somdip@gmail.com>`, unsigned):
   `git -c user.name=somdip -c user.email=somdip@gmail.com commit`.
   Message: `Merge pose-lab saves <names>`, then what changed in each in
   plain words (which base or gesture, which poses it reached), then the
   checks run. End with the Co-Authored-By line. Update the counts in
   CLAUDE.md (Where the work stands → Figures) if poses, bases or
   gestures were added or removed.

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
