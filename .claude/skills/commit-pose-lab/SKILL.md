---
name: commit-pose-lab
description: Merge the artist's pose-lab saves into data/poses.json and data/pose-index.json, commit them, delete the merged saves from the lab and republish the labs and catalogues. Use when the user asks to commit, merge or save what is in the pose lab ("commit the pose lab", "merge my pose saves").
---

# Commit the pose lab

The pose lab (https://claude.ai/artifact/631NuGY6VEftsybpaEDWUA) keeps
the artist's saves in its database, collection `poses`, one document per
pose: `{ pose, savedAt }`, the pose whole and named. A save replaces the
repo pose of the same name in the lab, so merged saves are deleted
afterwards, as with panel drafts. Read first: `data/CLAUDE.md` and
docs/design/pose-picking.md (Composition, naming).

The rule that shapes a merge: **every pose is its base × its gesture**.
The lower body (legs, tail, `spine.lean`) belongs to the base, the upper
body (arms, chest, neck, head, mouth) to the gesture; `spine.turn`, neck,
head and mouth stay a pose's own through a recompose. A changed lower
body is a retune of the base's reference pose (the first listed under
the base in `data/pose-index.json`), applied to every pose of that base.

## Steps

1. **Read the saves.** `ArtifactData` `list`, collection `poses`, with
   `out_dir` set to a fresh folder in the scratchpad; note each
   document's `version`. No documents: say so and stop.

2. **Report.** `node tools/pose-saves.mjs <out_dir>/poses` prints per
   save `same` | `changed` | `new`, the changed values grouped under the
   base, the gesture or the pose's own, and name/index problems. A save
   can be older than later repo work (see `savedAt` against
   `git log -1 --format=%ci -- data/poses.json`): if it would undo a
   committed change, ask the artist before merging it.

3. **Merge into `data/poses.json`** (keep its order and number style):
   - **Upper body / own values**: set them on the pose. If the pose is
     its gesture's reference and other poses share the gesture, the
     change is meant for all: `node tools/recompose.mjs --gesture <g>`.
   - **Lower body**: put the values on the **base's reference pose**,
     then `node tools/recompose.mjs --base <base>` so the family follows.
   - **New pose**: add it whole; name must be `<base>-<gesture>` with both
     in the index (a new base or gesture needs the artist's word). Add
     the name to `bases.<b>.poses` and `gestures.<g>.poses`, and a
     `poses` entry (desc, ground, hold, use, like — copy a sibling's
     shape; tags only from `tags`). A pose made from `wanted` moves out
     of `wanted`; update panels' `needs` that waited for it.
   - `node tools/recompose.mjs --all --dry`: the drift report must be
     clean (nothing but what you just intended).

4. **Look.** `node tools/contact-sheet.mjs male --zoom 3` (and the
   species the pose is used for), `node tools/pose-catalogue.mjs`, and
   the panels that use the changed poses
   (`grep -rl '"<pose>"' panels/` → `node tools/render-panels.mjs <ch>`).
   Read the PNGs at phone size. Log anything that looks wrong in
   `docs/issues/problem-poses.md`.

5. **Test.** `node tools/pose-gaps.mjs` if `wanted` changed; `npm test`
   (the index test needs every pose listed); after looking at the
   changed renders, `UPDATE_SNAPSHOT=1 npm test`, then `npm test`.

6. **Commit** (author `somdip <somdip@gmail.com>`, unsigned):
   `git -c user.name=somdip -c user.email=somdip@gmail.com commit`.
   Message: `Merge pose-lab saves <names>`, then what changed in each in
   plain words (which half, which family recomposed), then the checks
   run. End with the Co-Authored-By line. Update the pose count in
   CLAUDE.md (Where the work stands → Figures) if poses were added.

7. **Delete the merged saves.** One `ArtifactData` `batch` of `delete`s
   with `if_version` from step 1; on a mismatch re-list and merge or
   leave the newer save, and say so. Delete `same` saves too.

8. **Republish.** `node tools/build-poselab.mjs` → `Artifact` publish of
   `out/poselab.html`; `node tools/build-panellab.mjs` → publish
   `out/panellab.html` (panels render the poses); if a base or gesture
   changed, `node tools/base-catalogue.mjs` / `gesture-catalogue.mjs`
   and republish those pages (URLs in CLAUDE.md, Commands).

9. **Report** briefly: per pose what changed and what followed it, the
   renders you looked at, saves left in the lab, that nothing is pushed.
