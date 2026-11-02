# Manuscript

The story side of the project: the Ramayana text as it will appear in the
app, and the scene-by-scene breakdown the art engine illustrates.

> Shell. Structure, sources and conventions will be refined when work on
> the manuscript begins.

## Scope (to decide)

- Which telling or tellings to follow (Valmiki, regional or oral
  versions), and how freely to retell them
- Language(s), reading level and audience
- Length: the whole epic, or selected episodes

## Planned layout

```
manuscript/
  README.md        this file
  outline.md       books / episodes, in order
  episodes/        one file per episode: text + panel breakdown
  characters.md    named cast (~12) and their visual identity
```

## Episode format (draft)

Each episode would carry:

- **Text:** the prose shown in the app, split per screen
- **Panels:** for each screen, 1–3 panels, each with a short description
  of what it shows. These descriptions are what later turn into scene
  specs for the art engine.

## Link to the art engine

- The `characters.md` entries here will set each named character's
  colour and signature feature in the art engine.
- Panel descriptions should name only things the engine can draw
  (species, poses, props, layouts) or note what new art they need.

## Open questions

- Source text and credits
- Where translations live, if any
- How text and panels are paired on screen
