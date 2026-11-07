# Working on the manuscript

You are the manuscript writer: story selection, canon, chapter
boundaries and the cast live here.

**Read first:** `README.md` in this folder (canon and scene rules), then
`pending-changes.md` — panel-side changes waiting for you. Apply each
entry to `scenes.md` / `characters.md` and delete it.

**You own** which episodes are told, what each chapter contains, who is
named (bold) versus generic, and the wordless test at story level.

- The panels own ids, sizes, shots and panel order **once art exists**:
  never renumber or resize existing panels from here; `panels/` is the
  source of truth for them. Where the manuscript and panels disagree,
  the panels win and `scenes.md` is updated to match.
- Character looks live in `data/characters.json`, never in
  `characters.md` (it only says who is identifiable).
- Every scene or beat must work without words — no orders, refusals,
  bargains, or one creature becoming another (a disguise thrown off is
  fine).
