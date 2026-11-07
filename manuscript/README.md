# Manuscript

The story side of the project. **The app has no text, only images.** The
manuscript is the list of scenes that the art engine will draw, plus the
named cast.

## Canon

**Romesh C. Dutt, *The Ramayana: The Epic of Rama, Prince of India*
(1899)** is canon. It condenses Valmiki's roughly 24,000 couplets into about
2,000, in 12 books. Dutt kept the main cantos and translated them whole
or nearly whole, then joined them with short prose links. Both the verse
and the prose links count as canon.

- Read online: https://ancient-buddhist-texts.net/English-Texts/Ramayana/index.htm
  (public domain; one page per book, plus PDF/EPUB)
- Detail lookup only, when Dutt summarises a scene we draw:
  Griffith's full verse translation, https://www.gutenberg.org/ebooks/24869,
  or Shastri's prose, https://www.wisdomlib.org/hinduism/book/the-ramayana-of-valmiki

**Our telling is narrower than Dutt in the early books and wider in
the war:** it starts with the princes' childhood, shrinks books I–V to a
few sections, includes Surpanakha and Khara's army, gives the war four
sections, and ends with the flight home (15.06).

Episodes Dutt leaves out (Tataka, Ahalya, Shabari, Kabandha, Hanuman's
childhood, …) stay out unless we decide otherwise. Those decisions go in
the "Outside Dutt" section of `scenes.md`.

## Files

```
manuscript/
  README.md            this file: canon and scene rules
  scenes.md            the list of scenes, in story order, grouped in sections
  characters.md        who is identifiable; their looks live in data/characters.json
  pending-changes.md   panel-side changes not yet applied here: read it first,
                       apply each entry to scenes.md / characters.md, delete it
```

## Scene rules

A scene is **one panel**. Scenes are grouped into **sections**: one chain
of events, about 10–15 panels (not strict), the first usually setting the
scene. A panel is `full` (a whole portrait screen) or `half`, or its size
is decided later. Full panels use the height: **back (high)** and
**front (low)**. Every scene must work without words.

- **One action.** A gesture readable from the silhouettes alone (point,
  strike, bow at feet, run, lift, fall).
- **Few figures.** 1–5 figures, about the density of the reference friezes.
  A crowd is a short row of generic figures.
- **Few props.** At most 2 props or effects per scene (fire, tree, hut,
  water band, bow, chariot…).
- **Setting as outline.** The ground colour is the main setting. A panel
  may add a simple outline in the back (palace on the horizon, river and
  boat, tree line, Lanka's towers). A top view is allowed for an
  establishing panel (03.01).
- **Three species.** Every figure is a monkey, male or female
  (`data/species/`). Humans and rakshasas are both male or female figures;
  a rakshasa is set apart by its character type (body colour, outfit).
  Anything
  else (deer, vulture, horse, a god in the flames) is listed as a
  creature or one-off and needs its own art.
- **Named only when it matters.** In `scenes.md`, **bold** names are
  identifiable characters from `characters.md`. Anyone else is a generic
  figure, described by role (sage, queen, charioteer, monkey, rakshasa),
  drawn with a generic type from `data/characters.json` (`monkey1`,
  `raxas_m1`, `raxas_f1`, …).

## Scene line format

`| id | size | what we see | cast | props |`

- `id` = section number + panel number (`06.04`). Keep IDs stable once art
  exists. Use suffixes such as `06.04a` to insert scenes.
- `size` = `full`, `half`, or blank (decide later).
- "What we see" is one short sentence in the present tense, about bodies
  and gestures only; full panels say what is in the back and the front.

## Open questions

- Size of the panels still left blank.
- Ground colour per scene or per book.
