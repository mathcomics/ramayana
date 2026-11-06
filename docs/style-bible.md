# Style Bible — Ramayana

Draft v0.1, derived from the artist's own Ramayana friezes.
This is the reference the renderer is judged against. When code and this
document disagree, fix one of them deliberately.

## 1. Guiding idea

Flat figures, few primitives, rhythm in rows, with the artist's own body
language: **filled silhouettes, thick tapered limbs, and
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
- Start with simple forms; add feature variation later.
- Seeded roughness: slight edge wobble and small thickness variation, so it
  reads as brushwork. Same seed → same image.
- Minimum feature size at render scale ≈ 2–3 px (stripes, teeth, horns).

## 5. Species

All species share one skeleton (see §6). They differ by proportions, parts
and default posture. Measurements are in head-units (h = head diameter).

**Body parts are the artist's drawings** (decided 2026-11-05): every part
(torso, neck, upper arm, forearm, hands, thigh, shin, foot) is drawn in
`data/parts/male.svg` and `data/parts/female.svg`, front and side, with bent
torsos (the hands once, in `data/parts/hands.svg`, scaled to each body's
guide hand), and placed on the skeleton as drawn (only moved, turned, mirrored,
blended between its drawn views, and its length shortened when it turns out
of the paper). The monkey uses the male parts plus a tail. The rules for
limb curves, knots, hands and the torso curl below are drawing guidance
for those files; the renderer no longer generates the shapes. See
`docs/drawn-parts.md` and, for what is still rule-based,
`docs/remaining-rules.md`. A character can have a body scale (torso, legs,
feet and tail; head, neck and arms keep their size), e.g. 0.8 for a small
generic monkey.

### 5.1 Monkey (vanara)

- Head: drawn by the artist per character (§5.6); the species gives only
  its size (guide `head.width` 1, a square).
- Neck: thin (`neckWidth` ≈ 0.24) and fairly long (`neck` ≈ 0.27).
- Torso: chest tapering to a narrow waist.
- Torso curl (all species; see `reference/sketch-torso-curl.jpg`): the
  torso is two blocks hinged at the waist. Bending forward, the upper
  block pivots on the back edge: the back turns in one smooth curve and a
  notch opens on the front, deepening with the bend (a C at ~90°).
  Arching back mirrors this. `spine.chest` sets the bend (−60…100).
- Arms: long — hanging, they reach about the knee.
- Legs: comparatively short, often deeply bent.
- Tail: long, curling upward at the tip; expressive (follows motion). It
  curls in its own plane, turned by `tail.turn` (default 35°) toward the
  far side, so the front view shows part of the curl.
- Hands (all species; see `reference/sketch-hands.jpg`), set per arm:
  - fist: a wedge widening from the wrist to a flat top with rounded
    corners, shorter than the open hand (`arm.fist` ≈ 0.65 of its length);
  - out: a blunt paddle for the fingers with a thumb (parallel sides,
    blunt end) on the side away from the body;
  - in: the same with the thumb on the side toward the body;
  - point: like out, but the single finger is longer (1.6 × the thumb)
    and the grouped fingers shorter (0.6 × the paddle), for pointing
    (added 2026-11-04).
- Feet: elongated wedges.
- Garment: the lower cloth covers the thighs only — the main identity
  colour. There is no loincloth (retired 2026-11-05): the torso is drawn
  over the tops of the thighs.
- Default posture: leaning forward, knees bent.
- Optional: mane of loose strokes around the head.
- Body colours seen: brown, dark red, white, gold, black, tan.

### 5.2 Male

Not in the reference work; first version, to be refined. Same parts and
rules as the monkey (hands, knotty limbs, torso curl), with its own
proportions in `data/species/male.json`:

- Taller: longer legs (thigh 1.5, shin 1.45) and torso; arms a bit
  shorter than the monkey's.
- Broad chest, narrow waist (front view reads as an inverted triangle).
- Slimmer limbs.
- Head guide a little narrower than the monkey's (`head.width` 0.88).
- Thighs are widest at the hip and narrow toward the knee (the monkey's
  start thin at the hip).
- No tail.

### 5.3 Female

First version, `data/species/female.json`. Like the male, with:

- Narrower shoulders, narrow waist, wider hips (front view reads as an
  hourglass).
- Slightly shorter and slimmer than the male.
- Head guide narrower still (`head.width` 0.74). Hair is part of the
  drawn face (§5.6).
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

- Bottom: the thighs, from hip to knee, in the cloth colour (`dhoti`;
  `briefs` draws the same since the loincloth was retired).
- Top: `bare` or `full` (the whole torso in the cloth colour).
- Body colour: a hex per character; it also paints the skin of the base
  face (no named body palette).
- Cloth colours: white, yellow, red.
- **Cloth patterns** (for rakshasas only): a cloth name can add a pattern
  to the colour: `red-check`, `red-diamond`, `red-stripe` (any palette
  colour works). The pattern goes on the upper body only (a `full` top);
  the dhoti stays plain. It is drawn in black (red-black), in
  head-units so it scales with the figure: check = squares, diamond =
  small diamonds, stripe = horizontal bands, all on a 0.54 head-unit
  tile.

## 5.5 Characters

`data/characters.json` defines every figure the story uses. A character
picks a species and fixes body colour (hex), outfit (top, bottom) and cloth
colour (a name from the cloth palette in the same file). Ids
like `monkey1`, `raxas_m1` and `raxas_f1` are generic types for unnamed
figures. Signature features (necklaces, crowns, top bun…) come later.


## 5.6 Drawn faces

Faces are drawn by the artist (`data/faces/`, see its README), in two
parts (decided 2026-11-06):

- **Base face**, one per species (`data/faces/base/<species>.svg`): the
  face shape and ears (`skin`), `eyes` and three mouths, front and side,
  plus optional front versions with the head raised and lowered
  (`front-up`, `front-down`). Editing it changes every character of the
  species. Its skin is painted in the character's body colour; eyes and
  mouths keep their drawn colours.
- **Character parts**, one file per character (`data/faces/<id>.svg`):
  `under` (behind the base face) and `over` (hair, crown, beard, marks),
  `back` (behind the whole body), `hair-body`; optional own `eyes` or
  mouths replace the base's (rakshasa men, sugriva/monkey1, sage1,
  dasharatha's side mouths). Colours as drawn. A guide shows the base
  face.

**Every character has both a front and a side face; there is no
generated fallback** (decided 2026-11-04). Drawings are never edited by
code: a face is placed whole on the head (moved, scaled, rotated with the
head, mirrored for facing left). In the front view, a head raised or
lowered 25° or more (as the viewer sees it: lean + chest + neck + head)
uses the base's up / down version when drawn; the character's parts
follow it by the base's `top` and `chin` anchors (moved and stretched
vertically), unless the character draws its own up / down parts. The
face is drawn over the neck and body (in side view the near arm still
crosses in front); `mouth-1/2/3` follow the pose's mouth size.

**Size guide.** A species head is only `size` and `width` (decided
2026-11-04): a plain rectangle `size` tall and `size × width` wide,
centred where the face goes. It is the only head the renderer draws itself
(on species views; contact sheets use a character). Widths: monkey 1,
male 0.88, female 0.74.

**Drawing guidance** (for the artist; the renderer no longer draws these):

- Two views only, front and side (no three-quarter); side faces look right.
- Monkey head: a rounded square, top narrower than the bottom. Male head:
  narrower at the chin. Female head: narrower still, strongly tapered to
  the chin, with rounder corners.
- Ears (monkey, male): solid loops **outside** the head, in the skin
  colour, no outline, the lower half hanging longer. Front view both
  sides, side view on the back of the head. Women: no ears showing.
- Eyes: front view two dots, side view one dot toward the front (women:
  close to the front edge). Pure white or black, whichever contrasts more
  with the skin.
- Mouth: **never closed**; three openings, `mouth-1` small, `mouth-2`
  medium, `mouth-3` wide (see `reference/sketch-mouths.jpg`): monkey an
  **arch** (flat bottom, arched top), man a **box** (a slot), woman a
  **wedge** (a V notch toward the back of the head; a triangle pointing
  down in front view). In side view the opening reaches the front edge of
  the face. No muzzle or snout.
- Male mouths are white (artist's request, 2026-11-04); sage1's are light
  grey, against his white hair and beard.
- Female hair (see `reference/sketch-female-hair.jpg`): near-black, a
  thick frame around the head that falls as broad wavy locks past the
  shoulders. Front view: the locks go in the `back` layer, behind the
  body. Side view: a cap from the forehead over the head, the hairline
  curving back above the eye, falling down the back as one mass with a
  rounded end, in the `over` layer (in front).

- **Hair in two parts** (2026-11-05): hair that frames the head is drawn in
  the face (`over` / `under`, or `back` for hair behind the body) and turns with the
  head. Long hair that lies on the back and shoulders goes in the face's
  `hair-body` layer: it is pinned at the `nape` anchor and moves with the
  upper body (turns with the chest; in the front view shortens like the
  torso), drawn just behind the torso. It stays in the face file because
  the body is shared by characters with different hair.

## 6. Figure model (shared)

- Skeleton: pelvis (root) → 2-segment spine → neck → head;
  shoulders → elbows → wrists; hips → knees → ankles; tail chain (monkey).
- Pose = joint angles relative to parent + facing (left/right) +
  view (side/front) + hand per arm. A pose says nothing about where the
  figure sits in a panel (height, ground colour): that is scene layout.
- The ankle is the exception: it sets the foot's angle from the ground,
  not from the shin (0 = flat, toes forward in side view, toward the
  viewer in front view (2026-11-06); + lifts the toes). A foot stays flat
  however the leg bends.
- **End-on parts** (drawn 2026-11-06, not used yet): each body file has an
  `end` layer with the upper arm, forearm, thigh and shin seen end-on and
  the foot with its sole toward the viewer, so a limb can later be blended
  by its own direction (`docs/remaining-rules.md`, step 5).
- Side view: far limbs behind torso, near limbs in front.
  Each arm has its own shoulder anchor in side view: near arm toward the
  front of the chest, far arm just behind centre (`shoulder.side`).
  Front view: used for crouching / flexing / confronting.
- **Out of the paper** (branch `drawn-parts`, 2026-11-04): the shoulder
  and the hip have a second angle, `out` (degrees, + = away from the body
  sideways), turning the whole arm or leg out of the paper. A limb then
  points along (cos(out)·sin θ, cos(out)·cos θ, sin(out)) (forward, down,
  sideways), θ its side-view angle. The side view shows it shortened by
  cos(out); the front view shows (sideways, down). Only lengths change,
  never widths; hands and feet keep their size. With drawn parts this
  replaces the mirroring below for the front view's arms and legs.
- **Poses are side view only; the front view is a projection** of the
  same body (decided 2026-11-04, projection 2026-11-05): the front and
  side drawings are two views of one body. The front torso is the
  artist's front drawings (straight and front-bend), picked by how far
  the upper body tips toward the viewer (lean + chest; the deepest
  drawing at 90°, turned over past 90°), with their own heights, which
  need not match the side view (decided 2026-11-06); arms and legs are
  projected with their `out` angles; the neck shows its up-down part and
  the face turns over when the head is upside down; feet keep their
  height below the ankle. Parts are drawn far to near by their depth
  toward the viewer (both views).
  - **Planned (not yet built):** when the side pose bends far forward or
    the head goes below the shoulders (e.g. `fall-headlong`), the front
    view should turn to a **back view**: the back of the head instead of
    the face. This needs a back layer per drawn face (e.g. a `back-head`
    layer in `data/faces/`, or a plain head shape) and a draw order for
    the back view (arms behind the torso, hair over the head).
- Foreshortening only by projection: a part turned out of the paper
  shortens (never widens); otherwise flat.
- Joint limits per species prevent broken anatomy.

- **Where the head looks is relative to the body** (2026-11-06): `look` is
  `front` (the way the body faces), `left` (toward the near side) or
  `right` (toward the far side). Side view: front = side face, left = front
  face (toward the viewer), right = away (side face until a back of the
  head is drawn). Front view: front = front face, left = side face looking
  picture-right, right = side face looking picture-left. So a pose turns
  its head the same way in both views.

## 7. Pose vocabulary and names

Pose names read `<base>-<what the body does>`, so a pose can be found
from a scene description:

- base: `stand`, `walk`, `run`, `leap`, `crouch`, `bend`, `crawl`, `kneel`, `lunge`, `sit`,
  `lie`, `fall`;
- the rest names what is visible (arms, then legs), never an emotion:
  `stand-hands-to-face`, not `fear`;
- poses are side view; there are no front poses (the front view is
  derived, §6).

28 poses (2026-11-04), many drawn from a pose reference sheet and still
being refined. Poses are tuned visually in the pose lab and stored as data,
alphabetically.

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
