---
name: commit-panel-lab
description: Merge the artist's panel-lab drafts into panels/, commit them, delete the merged drafts from the lab and republish it. Use when the user asks to commit, merge or save what is in the panel lab ("more saves, please commit", "commit the panel lab").
---

# Commit the panel lab

The panel lab (https://claude.ai/artifact/RrHEPbeEDjq9T5WGRJKhDG) keeps
the artist's drafts in its database, collection `panels`, one document
per panel: `{ id, panel, section, savedAt }`. A draft always overrides
the repo panel in the lab, so merged drafts must be deleted afterwards
(docs/design/panels.md, Panel lab). The user asking is the go-ahead for
every draft, including locked reference panels (those with `tags`).

## Steps

1. **Read the drafts.** `ArtifactData` `list`, collection `panels`, with
   `out_dir` set to a fresh folder in the scratchpad. Note each
   document's `version` from the result: the deletes are pinned to it.
   No documents: say so and stop.

2. **Merge.** `node tools/merge-panel-drafts.mjs <out_dir>/panels`
   (add `--dry` to look first). Per draft it prints `same` (nothing to
   merge), `changed`, `new` (an inserted panel, letter id like `05.01a`:
   docs/design/panels.md, Ids) or `skip`. It keeps each file's key order
   and carries `tags` over. Then `git diff panels` and read it.

3. **Check each changed panel.**
   - `node tools/render-panels.mjs <chapter>` for every touched chapter;
     **look at each changed panel's PNG** (out/panels/<section>/<id>.png).
   - Every issue other than a placeholder must be fixed: a committed
     panel renders clean (`npm test` checks). Fix it the smallest way
     that keeps what the artist drew — e.g. an `on` that points at a
     prop the draft removed: drop the `on`, and confirm the PNG is
     byte-identical to the draft's render.
   - Retired fields the tool flags (`size`, `shot`, `zoom`, `props`):
     convert them as docs/design/panels.md says.
   - A `needs` line the draft has made stale (the prop is now drawn and
     used, the thing is gone): remove it. A `scene` description that no
     longer matches the picture: tell the user, offer to update it.
   - Mention anything surprising (a character swapped, a reference panel
     changed) in the summary; don't undo the artist's choices.

4. **Regenerate and test.** `node tools/prop-gaps.mjs` and
   `node tools/pose-gaps.mjs` if needs or props changed;
   `npm test` — the snapshot lists the changed panels; after looking,
   `UPDATE_SNAPSHOT=1 npm test`, then `npm test` again.

5. **Commit** (author `somdip <141280921+somdipdatta@users.noreply.github.com>`, unsigned):
   `git -c user.name=somdip -c user.email=141280921+somdipdatta@users.noreply.github.com commit`.
   Message: `Merge panel-lab drafts <ids>`, then one line per panel
   saying what the artist changed in plain words, and any fix you made.
   Note drafts that were `same`. End with the Co-Authored-By line.

6. **Delete the merged drafts.** One `ArtifactData` `batch` of `delete`s,
   each with `if_version` = the version read in step 1 — so a draft the
   artist saved again meanwhile fails the batch instead of being lost.
   On a version mismatch: re-list, merge the newer draft too (back to
   step 2) or leave it and say so. Delete `same` drafts as well.

7. **Republish the lab.** `node tools/build-panellab.mjs`, then the
   `Artifact` tool with `file_path` `out/panellab.html` (the lab's URL is
   above; if the publish is refused for an unread live version, read the
   saved copy it names, confirm it differs only in generated data, and
   publish again).

8. **Report** briefly: per panel what changed, any fix you made, what
   was `same`, drafts left in the lab (and why), that nothing is pushed.
