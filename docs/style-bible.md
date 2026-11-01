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
  or ankle. Arms and legs follow the same rule.
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
  narrower than the bottom (`head.taper` ≈ 0.8). Views:
  - front: two eye dots, ears as half-discs outside the head, open mouth
    as an arched trapezoid;
  - three-quarter: one eye toward the face side, ear as a C-curl on the
    back side (the curl's lower half hangs longer than its upper half), mouth shifted toward the face;
  - side: eye near the top front, C-curl ear, mouth toward the front.
  - No muzzle or snout: nothing sticks out of the square.
  - The open mouth is always a round arch over a flat bottom, and always
    stays inside the face (the renderer clips it to the head silhouette).
- Torso: chest tapering to a narrow waist.
- Arms: long — hanging, they reach about the knee.
- Legs: comparatively short, often deeply bent.
- Tail: long, curling upward at the tip; expressive (follows motion).
- Hands: spiral/curled fist, or splayed reaching fingers.
- Feet: elongated wedges.
- Garment: triangular loincloth at the hip — the main identity colour.
- Default posture: leaning forward, knees bent.
- Optional: mane of loose strokes around the head.
- Body colours seen: brown, dark red, white, gold, black, tan.

### 5.2 Rakshasa

- Head: round, two small horns; shouting mouth shown as a ring of teeth.
- Torso: block or barrel, carrying a pattern — horizontal stripes, zigzag,
  or triangles; typically red on black.
- Limbs: thin, long, black; curled fists.
- Default posture: wide crouched stance, weight low, elbows out.
- Female variant: streaming hair, striped dress shape, wider hips.
- Scale varies freely (small and large rakshasas in one scene).

### 5.3 Human

Not yet present in the reference work — to be designed.
Starting proposal: the Warli hourglass torso redone as a filled silhouette
(inverted-triangle chest, triangle/dhoti hips), upright default posture,
slimmer limbs than rakshasas, no tail, no horns. Women: hair bun or
streaming hair, sari/skirt silhouette.

## 6. Figure model (shared)

- Skeleton: pelvis (root) → 2-segment spine → neck → head;
  shoulders → elbows → wrists; hips → knees → ankles; tail chain (monkey).
- Pose = joint angles relative to parent + facing (left/right) +
  view (side/front) + grounded/airborne.
- Side view: far limbs behind torso, near limbs in front.
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

- Human anatomy: confirm the hourglass approach.
- Is a back view ever needed?
- Are split panels always stacked bands, or sometimes side by side?
