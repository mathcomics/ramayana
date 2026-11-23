# Ramayana

The Ramayana, told as **wordless** illustrated panels, easy to read on a
phone, scrolling down one chapter at a time.

**Read it:** https://ramayana.lilboox.com

## The idea

This is a work of art made by a human and an AI together. The book is
one goal; the other is to find out, by making it, what the AI is good
at, where it struggles, and how the two can complement each other and
help each other work.

The AI takes on three roles:

- **Manuscript writer.** Chooses which episodes of the epic are told,
  divides them into chapters and story beats, keeps the cast and the
  canon consistent, and checks that every moment can be told without
  words.
- **Panel writer.** Turns each chapter into a sequence of panels: who
  is in each one, what they are doing, which way they face, how near
  they stand. It follows the compositions the artist has approved and
  learns from each correction.
- **Data editor.** Looks after the poses and puts the drawings in
  place so they can be used in any panel. It never alters the artist's
  drawings; it reports what needs fixing for the artist.

Alongside these it builds the tools: the renderer that draws the
panels, the pages where the artist edits poses and panels, and the
catalogues and read-backs it uses to check its own work.

The artist refines the parts and the panels. Some faces, bodies and
poses were first attempted by the AI; the artist redraws and adjusts
them, and reviews the panels. Corrections become
written lessons that later panels are held to.

## How it works

The art is not drawn panel by panel. The parts (faces, bodies, hands,
weapons, props) and the poses are made once, and a small deterministic
renderer assembles every panel from a short description of the scene.

```
panel (JSON) → layout → figure geometry → SVG
```

A panel says *who* is in the scene, *what pose* they are in, *which way*
they face and *where* they are (near or far, on the steps, on a throne).
It never holds coordinates. This is panel 05.04, Ravana on his throne:

```json
{
  "scene": "Lanka: Ravana on his throne, from the front, far",
  "tall": 1,
  "ground": "yellow",
  "figures": [
    { "prop": "throne-lanka", "at": 0.5, "depth": "mid" },
    { "character": "ravana", "pose": "chair-armrest", "view": "front",
      "on": "throne-lanka", "scale": 1.05 }
  ]
}
```

`chair-armrest` is a pose made of a base (`chair`) and a gesture
(`armrest`). The full panel language is in
[docs/design/panels.md](docs/design/panels.md).

- **Figures** are built from drawings: body parts (`data/parts/`),
  each character's drawn face, up to six views of the head (`data/faces/`), and held
  weapons (`data/props/held/`).
- **Poses** are any lower body (a *base*: legs, lean, tail) with any upper
  body (a *gesture*: arms, chest, head), in `data/bases.json` and
  `data/gestures.json`. Retuning one base changes every pose that uses it.
- **The renderer is deterministic.** The same panel always draws the same
  picture, and any variety (brush roughness, crowds) is seeded.
- **No dependencies.** Plain Node.js with ES modules: no npm packages,
  no build step, and tests use Node's built-in runner.

## Quick start

Needs [Node.js](https://nodejs.org/) 18 or later. PNG output also needs
`rsvg-convert` (librsvg) or [`resvg`](https://github.com/linebender/resvg).

```sh
git clone https://github.com/mathcomics/ramayana.git
cd ramayana
npm test                              # unit, data and render-snapshot tests
node tools/build-site.mjs             # the reader site → _site/index.html
node tools/render-panels.mjs 05       # chapter 5's panels → out/panels/05-the-golden-deer.png
node tools/contact-sheet.mjs monkey   # every pose on a monkey → out/contact-monkey.png
```

Open `_site/index.html` in a browser to read the story locally.

## Repository map

| Folder | What is in it |
|---|---|
| [src/](src/) | The renderer: skeleton and pose composition, drawn parts, figures, panels and SVG output |
| [data/](data/) | The artist's drawings (faces, parts, props) and the pose, character and species data |
| [panels/](panels/) | One JSON file per panel, one folder per chapter |
| [manuscript/](manuscript/) | The story: canon, cast and the 18 chapter briefs the panels follow ([its README](manuscript/README.md)) |
| [tools/](tools/) | The site builder, panel and pose renderers, catalogues, importers for the drawings, and the lab pages |
| [test/](test/) | `npm test`: unit tests, data integrity and a render snapshot |
| [docs/](docs/) | Design documents, proposals and open issues ([how they are organised](docs/README.md)) |

## Learn more

- [docs/design/engine.md](docs/design/engine.md): the renderer, its file
  layout, commands, tests, the figure model and the labs in detail
- [docs/design/style-bible.md](docs/design/style-bible.md): the visual
  rules every render is judged against
- [docs/design/pipeline.md](docs/design/pipeline.md): how drawings and
  JSON reach the renderer and the site (a diagram)
- [docs/design/panels.md](docs/design/panels.md): the panel language
- [manuscript/scenes.md](manuscript/scenes.md): the story, chapter by
  chapter

## How the sessions are set up

The code and the panel drafts are written with
[Claude Code](https://claude.com/claude-code). Each of the three roles
has its own `CLAUDE.md`, in [manuscript/](manuscript/CLAUDE.md),
[panels/](panels/CLAUDE.md) and [data/](data/CLAUDE.md), saying what it
owns and what it must read first; `.claude/skills/` holds the repeated
procedures. The top `CLAUDE.md` is the most current picture of where
the work stands. The pose lab and panel lab mentioned there are private
editing pages for the artist.

Two rules hold for every change:

- A visual change needs a render someone has looked at at real phone
  size, and a matching rule in the style bible.
- Nothing is traced or copied from third-party artwork. Everything comes
  from the style bible and the artist's own drawings.

## Contributing

Collaboration guidelines are coming soon. Until then, issues are
welcome. Please open one before a pull request. See
[CONTRIBUTING.md](CONTRIBUTING.md).

## License

- **Code** (`src/`, `tools/`, `test/`): [MIT](LICENSE).
- **Art and story** (`data/`, `panels/`, `manuscript/`, `docs/`, and
  everything rendered from them, including the site):
  [CC BY-NC-SA 4.0](LICENSE-ART.md).

The Ramayana itself is public domain. This project's telling follows
Romesh C. Dutt's 1899 condensation (see
[manuscript/README.md](manuscript/README.md)).
