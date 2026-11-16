# Pipeline: from drawings to the published site

How the artist's drawings and the hand-kept JSON reach the renderer, the
labs and the reader site. Solid arrows are automatic (read on load);
dashed arrows are a step someone runs.

```mermaid
flowchart 
  subgraph art["Artist's drawings (SVG, Inkscape)"]
    PARTS_SVG["data/parts/*.svg<br/>body parts, hands"]
    HELD_SVG["data/props/held/*.svg<br/>sword, club, bow"]
    FACE_SVG["data/faces/base/&lt;species&gt;.svg<br/>data/faces/&lt;id&gt;.svg"]
    PROP_SVG["data/props/*.svg<br/>props (anchors, recolour roles)"]
    BG_SVG["panels/&lt;NN&gt;/&lt;id&gt;.svg<br/>panel backgrounds"]
  end

  subgraph hand["Hand-kept JSON"]
    SPECIES["data/species/*.json"]
    CAST["data/characters.json<br/>cast, colours"]
    POSEDATA["data/bases.json<br/>data/gestures.json<br/>data/poses.json"]
    GROUNDS["data/grounds.json"]
    PANELS["panels/&lt;NN&gt;/&lt;id&gt;.json"]
    SCENES["manuscript/scenes.md<br/>chapter titles"]
  end

  subgraph gen["Generated JSON (committed)"]
    PARTS_JSON["data/parts.json"]
    HELD_JSON["data/held.json"]
  end

  PARTS_SVG -. "import-parts" .-> PARTS_JSON
  PARTS_JSON -. "export-parts" .-> PARTS_SVG
  HELD_SVG -. "import-held" .-> HELD_JSON
  FACE_SVG -. "face-templates<br/>(refreshes guides)" .-> FACE_SVG

  subgraph load["Loaders (tools/lib.mjs)"]
    LS["loadSpecies<br/>species + parts + held"]
    LF["loadFaces<br/>composeFaces (faces-lib)"]
    LP["loadProps"]
    LA["loadAssets"]
    LSEC["loadSections"]
  end

  SPECIES --> LS
  PARTS_JSON --> LS
  HELD_JSON --> LS
  FACE_SVG --> LF
  CAST --> LF
  PROP_SVG --> LP
  LS --> LA
  LF --> LA
  LP --> LA
  CAST --> LA
  POSEDATA --> LA
  GROUNDS --> LA
  PANELS --> LSEC
  BG_SVG --> LSEC

  REND["Renderer src/<br/>compose (base × gesture) → figure → scene → SVG"]
  LA --> REND
  LSEC --> REND

  subgraph outputs["Outputs"]
    CHECK["out/: render-panels, contact /<br/>face sheets, catalogues"]
    POSELAB["out/poselab.html<br/>build-poselab"]
    PANELLAB["out/panellab.html<br/>build-panellab"]
    SITE["_site/<br/>build-site"]
  end

  REND --> CHECK
  REND --> POSELAB
  REND --> PANELLAB
  REND --> SITE
  SCENES --> SITE

  subgraph claude["claude.ai (published artifacts)"]
    PL_ART["Pose lab<br/>db: bases, gestures"]
    PNL_ART["Panel lab<br/>db: panels"]
  end

  POSELAB -. "publish" .-> PL_ART
  PANELLAB -. "publish" .-> PNL_ART
  PL_ART -. "commit-pose-lab<br/>(pose-saves)" .-> POSEDATA
  PNL_ART -. "commit-panel-lab<br/>(merge-panel-drafts)" .-> PANELS

  subgraph pub["Reader site"]
    GH["GitHub main"]
    CF["Cloudflare Pages runs build-site<br/>ramayana-7fw.pages.dev"]
  end

  art -. "commit + push" .-> GH
  hand -. "commit + push" .-> GH
  gen -. "commit + push" .-> GH
  GH -- "every push to main" --> CF
```

## Notes

- **Read on every load, with no step in between:** props
  (`data/props/*.svg`), faces (composed from the base and character
  drawings by `composeFaces`), and every hand-kept JSON. Editing one of
  these files changes the next render.
- **Imported into committed JSON:** body parts (`import-parts`, which
  `export-parts` writes back as the editable SVG) and held props
  (`import-held`). Rerun the import after editing those drawings.
- **Check tools:** `check-faces` (the face drawings), `prop-gaps`,
  `pose-gaps`, `view-gaps` (the queues in `docs/issues/`). `npm test`
  covers the data and a render snapshot.
- **The labs** are self-contained pages, with the renderer and every
  asset inlined at build time. Rebuild and republish them after renderer,
  data or panel changes. The artist's saves go to each lab's database and
  reach the repo only through the commit skills, which also delete the
  merged saves.
- **The site** is built by Cloudflare from `main`, not from a local
  `_site/`, on every push to `main` (`docs/design/panels.md`,
  Publishing): a push is a publish.
