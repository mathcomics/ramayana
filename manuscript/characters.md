# Characters

The identifiable characters, and the generic types for everyone else.
How each one looks (species, body colour, outfit, cloth, face) is defined
in [`data/characters.json`](../data/characters.json) and its face art;
this file only says who exists and where they appear in the story.

## Identifiable (12)

| Character | id | Species | Role in the story |
|---|---|---|---|
| **Rama** | `rama` | male | hero, all chapters |
| **Sita** | `sita` | female | all chapters |
| **Lakshman** | `lakshman` | male | always near Rama |
| **Dasharatha** | `dasharatha` | male | chapters 1–2 |
| **Kausalya** | `kausalya` | female | chapter 1 (side face only) |
| **Kaikeyi** | `kaikeyi` | female | chapters 1–2 (side face only) |
| **Surpanakha** | `surpanakha` | female (rakshasi) | chapters 3–5; a rakshasi throughout, no fair form |
| **Hanuman** | `hanuman` | monkey | chapters 6–17 |
| **Sugriva** | `sugriva` | monkey | chapters 7–17 |
| **Ravana** | `ravana` | male (rakshasa) | chapters 5–6, 10–12, 14, 17 |
| **Indrajit** | `indrajit` | male (rakshasa) | chapters 11, 13, 15–16 |
| **Vibhishana** | `vibhishana` | male (rakshasa) | chapter 5 (at court), 12–18 |

## Generic types

| Type | Species | Used for |
|---|---|---|
| `monkey1` | monkey | any monkey, incl. Bali, Angad, Tara (Tara in red cloth), the old healer (ch 15) |
| `raxas_m1`, `raxas_m2`, `raxas_m3` | male | rakshasa warriors, Khara; `raxas_m2` in orange is Ravana's ascetic disguise (ch 5); `raxas_m3` has maroon skin and white eyes |
| `raxas_f1`, `raxas_f2` | female | rakshasis: the grove guards (`raxas_f3` is the kind one, ch 10) |

Generic men (`male1`, `male2`) and the sage exist. Children (the four
boys) and wedding guests would be needed only if the growing-up ladder
and the wedding return to chapter 1.

## Creatures and one-offs (not species models)

- Kumbhakarna: a giant, much larger than the others (ch 14), whole
  or only partly in the panel (head, hand, arm).
- The golden deer (ch 5): in canon it is Maricha in disguise; in this
  telling it is never shown as anything but a deer.
- Forest deer and birds (ch 3).
- Jatayu the vulture (ch 3, 6): drawn (`vulture-fly`, `-swoop`,
  `-fall`, `-stand`; lying still a placeholder).
- The Ocean, rising from the waves before Rama's bow (ch 12).
- The Pushpaka, the swan-drawn flying chariot (ch 18) — the story's
  only chariot; **Ravana** flies by himself, holding Sita (ch 5–6).

## Props

The objects each chapter cannot do without are in its brief's "Must
show" line, and the recurring ones (the ring, the
jewel bundle, the two thrones, Rama's bow) in the continuity list at
the top of `scenes.md`. Prop art itself is tracked on the panel side:
`node tools/prop-gaps.mjs` → `docs/issues/missing-props.md`.
