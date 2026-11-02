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

Episodes Dutt leaves out (Tataka, Ahalya, Shabari, Kabandha, Hanuman's
childhood, …) stay out unless we decide otherwise. Those decisions go in
the "Outside Dutt" section of `scenes.md`.

## Files

```
manuscript/
  README.md        this file: canon and scene rules
  scenes.md        the list of scenes, in story order, grouped by Dutt's books
  characters.md    the ~20 identifiable characters and their signature features
```

## Scene rules

A scene is **one image**. Later, screens will group scenes (1 panel, or 2–3
stacked bands). Every scene must work without words.

- **One action.** A gesture readable from the silhouettes alone (point,
  strike, bow at feet, run, lift, fall).
- **Few figures.** 1–5 figures, about the density of the reference friezes.
  A crowd is a short row of generic figures.
- **Few props.** At most 2 props or effects per scene (fire, tree, hut,
  water band, bow, chariot…). No backgrounds; the ground colour is
  the only setting.
- **Three species.** Every figure is a human, monkey or rakshasa. Anything
  else (deer, vulture, horse, a god in the flames) is listed as a
  creature or one-off and needs its own art.
- **Named only when it matters.** In `scenes.md`, **bold** names are
  identifiable characters from `characters.md`. Anyone else is a generic
  figure, described by role (sage, queen, charioteer, monkey, rakshasa).

## Scene line format

`| id | what we see | cast | props |`

- `id` = book number + scene number (`06.04`). Keep IDs stable once art
  exists. Use suffixes such as `06.04a` to insert scenes.
- "What we see" is one short sentence in the present tense, about bodies
  and gestures only.

## Open questions

- How scenes are grouped into screens (and which scenes share one screen).
- Ground colour per scene or per book.
