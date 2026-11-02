# Style Bible — Warli-inspired Ramayana

Draft v0.1, derived from the artist's own Ramayana friezes (not strict Warli).
This is the reference the renderer is judged against. When code and this
document disagree, fix one of them deliberately.

## 1. Guiding idea

Warli's grammar (flat figures, few primitives, rhythm in rows) with the
artist's own body language: **filled silhouettes, thick tapered limbs, and
gesture that carries the story.** Every figure should read at phone size
from its silhouette alone.

## 2. Format

- Target: smartphone portrait webapp.
- A screen is one panel, or split into 2 or 3 panels (default: stacked
  horizontal bands).
- Density: about the complexity of the reference friezes. At a 3-way split,
  expect ~3–4 figures per band.
- Figures render roughly 60–150 px tall on screen. Everything must be
  legible at that size — test at 1x, never only zoomed in.

## 3. Surface

- Grounds: flat paper colours (off-white, dusty pink, sky blue; geru
  red-brown as an optional traditional theme). Ground colour is a scene
  parameter.
- Edges: slightly irregular; a torn or wavy paper edge is allowed as a panel
  treatment.
- No gradients, no shading, no outlines around filled shapes (a faint
  pencil-like halo is optional texture, not structure).

## 4. Stroke and fill

- Bodies are **solid fills**. Overlapping parts merge into one silhouette.
- Limbs are tapered: thicker at the body, thinner at hands and feet.
- Joints are rounded, never sharp elbows of geometry.
- **Straight against curve** (all species; simplified from Michael Mattesi's
  force drawing). Each limb segment has one straight edge and one curved
  edge, and the curve flips sides at the joint. Rule as implemented: the
  upper segment curves on the *outer* side of the joint's bend, the lower
  segment on the *inner* side. Leg: curved thigh-front, curved calf-back.
  Arm: curved triceps (back of upper arm), curved forearm-front.
  See `reference/sketch-limbs-and-heads.jpg`.
- **Knotty joints** (all species): the upper segment runs full width into
  the elbow or knee, and the lower segment starts thinner (`knot` × joint
  width, ~0.55), swells along its curved side, then tapers to the wrist
  or ankle. The upper segment likewise starts thin at the shoulder or hip
  and swells to full width at the joint. Arms and legs follow the same rule.
- Eyes and ear curls are pure white or pure black, whichever contrasts
  more with the body colour (chosen automatically, never set by hand).
- Start with simple forms; add feature variation later.
- Seeded roughness: slight edge wobble and small thickness variation, so it
  reads as brushwork. Same seed → same image.
- Minimum feature size at render scale ≈ 2–3 px (stripes, teeth, horns).

## 5. Species

All species share one skeleton (see §6). They differ by proportions, parts
and default posture. Measurements are in head-units (h = head diameter).

### 5.1 Monkey (vanara)

- Head: **always a rounded square, from any side**, tapered so the top is
  narrower than the bottom (`head.taper` ≈ 0.8). Two views only: front
  and side (no three-quarter).
  - Ears: solid loops always **outside** the head, same colour as the body,
    no outline; the lower half hangs longer than the upper. Front view:
    both sides. Side view: on the back of the head.
  - Eyes: front view two dots, side view one dot toward the front.
  - Mouth: **never closed**; three openings (1 small, 2 medium, 3 wide).
    The shape depends on the species (`mouth`; see
    `reference/sketch-mouths.jpg`): monkey **arch** (flat bottom, arched
    top), male **box** (a rectangular slot), female **wedge** (a V notch
    pointing to the back of the head). In front view the box is a
    rectangle and the wedge a triangle pointing down.
    In side view the opening runs out to the front edge of the face.
    The mouth never sticks out of the head; no muzzle or snout.
- Neck: thin (`neckWidth` ≈ 0.24) and fairly long (`neck` ≈ 0.27).
- Torso: chest tapering to a narrow waist.
- Torso curl (all species; see `reference/sketch-torso-curl.jpg`): the
  torso is two blocks hinged at the waist. Bending forward, the upper
  block pivots on the back edge: the back turns in one smooth curve and a
  notch opens on the front, deepening with the bend (a C at ~90°).
  Arching back mirrors this. `spine.chest` sets the bend (−60…100).
- Arms: long — hanging, they reach about the knee.
- Legs: comparatively short, often deeply bent.
- Tail: long, curling upward at the tip; expressive (follows motion).
- Hands (all species; see `reference/sketch-hands.jpg`), set per arm:
  - fist: a wedge widening from the wrist to a flat top with rounded
    corners, shorter than the open hand (`arm.fist` ≈ 0.65 of its length);
  - out: a blunt paddle for the fingers with a thumb (parallel sides,
    blunt end) on the side away from the body;
  - in: the same with the thumb on the side toward the body.
- Feet: elongated wedges.
- Garment: loincloth — the main identity colour. Shape is derived, not
  drawn: the span across both upper legs, clipped to the torso outline,
  so it follows the legs (one band across the crotch in front view).
- Default posture: leaning forward, knees bent.
- Optional: mane of loose strokes around the head.
- Body colours seen: brown, dark red, white, gold, black, tan.

### 5.2 Male

Not in the reference work; first version, to be refined. Same parts and
rules as the monkey (head, ears outside, mouths, hands, knotty limbs,
torso curl), with its own proportions in `data/species/male.json`:

- Taller: longer legs (thigh 1.5, shin 1.45) and torso; arms a bit
  shorter than the monkey's.
- Broad chest, narrow waist (front view reads as an inverted triangle).
- Slimmer limbs; smaller ears.
- Head tapers the opposite way to the monkey's: narrower at the chin
  (`head.taper` ≈ 1.22, i.e. the top is wider than the bottom), and is a
  little narrower overall (`head.width` ≈ 0.88).
- Thighs are widest at the hip and narrow toward the knee (the monkey's
  start thin at the hip).
- No tail.

### 5.3 Female

First version, `data/species/female.json`. Like the male, with:

- Long flowing hair (`head.hair`; see `reference/sketch-female-hair.jpg`),
  near-black. Front view: a cap over the head and two wavy locks falling
  past the shoulders, drawn **behind the whole body**. Side view: a rounded
  cap over the top of the head down to the forehead, the hairline curving
  back above the eye, covering the back of the head and falls down
  the back as one wavy mass with a rounded end, drawn **in front**. No ears.
- Narrower shoulders, narrow waist, wider hips (front view reads as an
  hourglass).
- Slightly shorter and slimmer than the male.
- Head narrower than the male's and strongly tapered to the chin, with
  rounder corners (`head.width` ≈ 0.74, `taper` ≈ 1.42).
- Hair is a **thick frame**: it sits `hair.thickness` (≈ 0.26) outside the
  head's outline on top and sides, then falls as broad locks
  (`hair.lockWidth` ≈ 0.8 in side view) to `hair.length` below the head
  centre, with a narrow gap at the neck in front view. Waves are short and
  close together (`hair.waves`).
- A dhoti with a full top reads as a sari.

### Only three species

Monkey, male and female cover every figure. Rakshasas are not a separate
species: they are male or female figures, set apart by character
definitions (colours, outfit, later props and markings). There are no
female monkeys.

All species share the same poses (`data/poses.json`). A species changes how
a pose looks, never the pose.

## 5.4 Outfit and colours

Outfit and colours are chosen when a figure is drawn; they are not part of
the pose.

- Bottom: `briefs` (the loincloth only) or `dhoti` (both thighs, from hip
  to knee, in the cloth colour).
- Top: `bare` or `full` (the whole torso in the cloth colour).
- Body colours: brown, dark red, tan.
- Cloth colours: white, yellow, red.

## 5.5 Characters

`data/characters.json` defines every figure the story uses. A character
picks a species and fixes body colour, outfit (top, bottom) and cloth
colour. Colour names resolve through the palette in the same file. Ids
like `monkey1`, `raxas_m1` and `raxas_f1` are generic types for unnamed
figures. Signature features (necklaces, crowns, top bun…) come later.

## 6. Figure model (shared)

- Skeleton: pelvis (root) → 2-segment spine → neck → head;
  shoulders → elbows → wrists; hips → knees → ankles; tail chain (monkey).
- Pose = joint angles relative to parent + facing (left/right) +
  view (side/front) + hand per arm. A pose says nothing about where the
  figure sits in a panel (height, ground colour): that is scene layout.
- Side view: far limbs behind torso, near limbs in front.
  Each arm has its own shoulder anchor in side view: near arm toward the
  front of the chest, far arm just behind centre (`shoulder.side`).
  Front view: used for crouching / flexing / confronting.
- No foreshortening. Flat, as in Warli.
- Joint limits per species prevent broken anatomy.

## 7. Pose vocabulary (initial)

stand · walk · run (2 phases) · leap · tumble · crouch-fight · flex ·
point · throw · carry-overhead · kneel · sit · dance

Poses are tuned visually in the pose lab and stored as data.

## 8. Identity

- Unnamed figures: varied per instance (body colour, loincloth colour,
  torso pattern, horn shape, small proportion jitter, scale, seed) within
  species ranges.
- Named characters (~12, later): fixed garment colour **plus** a signature
  silhouette feature (weapon, crown, hair, tail curl), so identity never
  depends on colour alone.

## 9. Effects and props (later)

- Fire: layered yellow/orange/red flame curls with black strokes.
- Props library: bow, arrow, mace, stones, banners, etc.

## 10. Open questions

- Is a back view ever needed?
- Are split panels always stacked bands, or sometimes side by side?
