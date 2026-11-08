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
few chapters, includes Surpanakha and Khara's army, gives the war six
chapters (the bridge, then five of fighting and rescue, 10–15), and
ends with the flight home (chapter 16).

Episodes Dutt leaves out (Tataka, Ahalya, Shabari, Kabandha, Hanuman's
childhood, …) stay out unless we decide otherwise. Those decisions go in
the "Outside Dutt" section of `scenes.md`.

## Files

```
manuscript/
  README.md            this file: canon and brief rules
  scenes.md            chapter briefs in story order, with the
                       continuity-and-motifs list at the top
  characters.md        who is identifiable; their looks live in data/characters.json
  pending-changes.md   panel-side changes not yet applied here: read it first,
                       apply each entry to scenes.md / characters.md, delete it
```

## Chapter briefs

The manuscript writes one **brief** per chapter, not one line per
panel. A brief is: a one-line arc, the chapter's visual narrative in
**2–3 beats** (a chapter can more or less hope to cover that many and
no more; artist, 2026-11-08), a "Must show" note (the objects and
images the story cannot do without, especially ones that return in
other chapters), and a "Not shown" note (what is deliberately left
out, and why).

A **beat** is one movement of the story, told in one or a few bullets,
each bullet a gesture or movement that works as a wordless image. The
panel side (`panels/`) breaks
beats into panels and owns panel ids, sizes, shots and order, judged
against `docs/design/panel-writing.md` and the artist's reviews; a
beat may become one panel or several (establishing a new place and its
key figure is always a short sequence). The manuscript never writes
panel ids, sizes or counts. Where a brief and accepted panels tell the
story differently, the panels win and the brief is updated.

Beat rules (the wordless test, at story level):

- **One action per bullet**, readable from the silhouettes alone
  (point, strike, bow at feet, run, lift, fall).
- **No orders, refusals, bargains or explanations.** No creature turns
  into another on panel: a disguise thrown off is fine, a
  transformation is not. The only allowed "word" is a pointed
  direction.
- **No chariots, no horses on the ground** (artist, 2026-11-08).
  Battles and journeys are on foot — monkeys leap, rakshasas fly, and
  **Ravana** carries Sita off in his own arms (5–6). The story's one
  chariot is the swan-drawn Pushpaka, flying them home (18).
- **Few figures, few props.** 1–5 figures and at most 2 props or
  effects per image, about the density of the reference friezes. A
  crowd is a short row of generic figures.
- **Setting as outline.** The ground colour is the main setting; a
  simple outline in the back (palace on the horizon, river and boat,
  tree line, Lanka's towers) or a top view for an establishing image.
- **Three species.** Every figure is a monkey, male or female
  (`data/species/`). Humans and rakshasas are both male or female
  figures; a rakshasa is set apart by its character type (body colour,
  outfit). Anything else (deer, vulture, a giant, a god in the flames)
  is a creature or one-off and needs its own art.
- **Named only when it matters.** **Bold** names are identifiable
  characters from `characters.md`; everyone else is a generic figure,
  described by role (sage, queen, charioteer, monkey, rakshasa).

**Continuity is the manuscript's job.** The panel writer works one
chapter at a time; `scenes.md` opens with the continuity-and-motifs
list — returning places, objects that travel, mirrored compositions —
that every chapter must respect.

## Open questions

- Ground colour per scene or per book.
