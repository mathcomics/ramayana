# Style Bible — Ramayana

Derived from the artist's own Ramayana friezes.
This is the reference the renderer is judged against. When code and this
document disagree, fix one of them deliberately.

## 1. Guiding idea

Flat figures, few primitives, rhythm in rows, with the artist's own body
language: **filled silhouettes, thick tapered limbs, and
gesture that carries the story.** Every figure should read at phone size
from its silhouette alone.

## 2. Format

- Target: smartphone portrait webapp.
- The reader scrolls a column of full-width panels, each 0.75, 0.5 or 0.3
  of a screen tall (no full-screen panels; `docs/design/panels.md`).
- Density: about the complexity of the reference friezes. At a 3-way split,
  expect ~3–4 figures per band.
- Figures render roughly 60–150 px tall on screen. Everything must be
  legible at that size — test at 1x, never only zoomed in.

## 3. Surface

- Grounds: flat paper colours (off-white, dusty pink, sky blue; geru
  red-brown as an optional traditional theme; from the artist's scene
  layouts: sage, dry grass, dark green, stone grey). Ground colour is a
  scene parameter.
- Sky: an outdoor panel may have a flat band of sky (`sky`, a saturated
  blue) above a straight horizon a little above a third of the way up.
  Things far away are small and stand on the horizon. Arranging panels:
  `docs/design/composition.md` (from the artist's `layouts/scenes/`).
- Edges: slightly irregular; a torn or wavy paper edge is allowed as a panel
  treatment.
- No gradients, no outlines around filled shapes (a faint pencil-like halo
  is optional texture, not structure). The only shading is the flat
  two-tone of §4.

## 4. Stroke and fill

- Bodies are **solid fills**. Overlapping parts merge into one silhouette.
- **Two tones:** the left leg (thigh and its cloth, shin, foot) and the
  torso (bare skin or a full top) are filled 5% lighter than the body or
  cloth colour (each channel 5% of the way to white), so the right leg, the arms and the head stand out against
  them. Faces, hands, arms, neck and props keep their colours.
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

**Body parts are the artist's drawings**: every part
(torso, neck, upper arm, forearm, hands, thigh, shin, foot) is drawn in
`data/parts/male.svg` and `data/parts/female.svg`, front and side, with bent
torsos (the hands once, in `data/parts/hands.svg`, scaled to each body's
guide hand), and placed on the skeleton as drawn (only moved, turned, mirrored,
blended between its drawn views, and its length shortened when it turns out
of the paper). The monkey uses the male parts plus a tail. The rules for
limb curves, knots, hands and the torso curl below are drawing guidance
for those files; the renderer doesn't generate the shapes. See
`docs/design/drawn-parts.md` and, for what is still rule-based,
`docs/issues/rules-to-migrate.md`. A character can have a body scale (torso, legs,
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
  curls in its own plane, turned by `tail.turn` (default 35°) toward its
  left side, so the front view shows part of the curl.
- Hands (all species; see `reference/sketch-hands.jpg`), set per arm:
  - fist: a wedge widening from the wrist to a flat top with rounded
    corners, shorter than the open hand (`arm.fist` ≈ 0.65 of its length);
  - out: a blunt paddle for the fingers with a thumb (parallel sides,
    blunt end) on the side away from the body;
  - in: the same with the thumb on the side toward the body;
  - point: like out, but the single finger is longer (1.6 × the thumb)
    and the grouped fingers shorter (0.6 × the paddle), for pointing.
- Feet: elongated wedges.
- Garment: the lower cloth covers the thighs only — the main identity
  colour. There is no loincloth: the torso is drawn
  over the tops of the thighs.
- Default posture: leaning forward, knees bent.
- Optional: mane of loose strokes around the head.
- Body colours seen: brown, dark red, white, gold, black, tan.

### 5.2 Male

Not in the reference work. Same parts and
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
  `briefs` draws the same).
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

How the files are read and the head turned: `docs/design/faces.md`.

Faces are drawn by the artist (`data/faces/`, see its README), in two
parts:

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
generated fallback**. Drawings are never edited by
code. **The head is turned in 3D from its two drawings** (`src/headturn.js`): matching front and side elements (the
skin, hair masses, buns) become volumes, at each height an ellipse as
wide as the front drawing and as deep as the side drawing; eyes, mouths,
ears and marks are flat pieces on their surface (front ones up to a 45°
turn, side ones past it). The head tilts with lean + chest + neck + head
and turns with `spine.turn`, in both views, so the drawings show exactly in the
straight front and side views and everything else (three-quarter, up,
down, upside down, the back of the head) comes from them. Front and side
drawings must agree on heights (the importer lists where they don't).
Drawn layering wins near the front (`under` behind the face, `over` in
front), depth toward the back of the head; a part in `back` (as drawn in
the nearer view) goes behind the whole body. The face is drawn over the
neck and body (in side view the right arm still crosses in front);
`mouth-1/2/3` follow the pose's mouth size. The base's `front-up` /
`front-down` layers are not used.

**Size guide.** A species head is only `size` and `width`: a plain rectangle `size` tall and `size × width` wide,
centred where the face goes. It is the only head the renderer draws itself
(on species views; contact sheets use a character). Widths: monkey 1,
male 0.88, female 0.74.

**Drawing guidance** (for the artist; the renderer doesn't draw these):

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
- Male mouths are white (artist's request); sage1's are light
  grey, against his white hair and beard.
- Female hair (see `reference/sketch-female-hair.jpg`): near-black, a
  thick frame around the head that falls as broad wavy locks past the
  shoulders. Front view: the locks go in the `back` layer, behind the
  body. Side view: a cap from the forehead over the head, the hairline
  curving back above the eye, falling down the back as one mass with a
  rounded end, in the `over` layer (in front).

- **Hair in two parts**: hair that frames the head is drawn in
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
- **Toe turn** (`leg.toe`, degrees, + toes out away from the body): turns the foot about the vertical; the foot shows the
  blend of its front, side and sole drawings that fits where it points.
- The ankle is the exception: it sets the foot's angle from the ground,
  not from the shin (0 = flat, toes forward in side view, toward the
  viewer in front view; + lifts the toes). A foot stays flat
  however the leg bends.
- **End-on parts**: each body file has an `end` layer with
  the upper arm, forearm, thigh and shin seen end-on and the foot with its
  sole toward the viewer. A part shows the blend of its front, side and
  end drawings that fits where it points, not the view's drawing: a limb
  pointing at the viewer is its end drawing, a hand bent toward the viewer
  shows its end hand, a foot with the toes raised shows its sole in the
  front view. The wrist turn (`arm.twist`, degrees) turns the hand about
  its own axis.
- **Right and left:** limbs are the character's own right and left. The
  side view shows the right side nearer the viewer (its right limbs in
  front of the torso, the left ones behind); the front view faces the
  viewer, so the right limbs are on picture-left. (Inside the renderer
  the right side is called near, the left far.)
- Side view: left limbs behind torso, right limbs in front.
  Each arm has its own shoulder anchor in side view: right arm toward the
  front of the chest, left arm just behind centre (`shoulder.side`).
  Front view: used for crouching / flexing / confronting.
- **Out of the paper**: the shoulder
  and the hip have a second angle, `out` (degrees, + = away from the body
  sideways), turning the whole arm or leg out of the paper. A limb then
  points along (cos(out)·sin θ, cos(out)·cos θ, sin(out)) (forward, down,
  sideways), θ its side-view angle. The side view shows it shortened by
  cos(out); the front view shows (sideways, down). Only lengths change,
  never widths; hands and feet keep their size. With drawn parts this
  replaces the mirroring below for the front view's arms and legs.
  The elbow and the knee have their own out (`arm.elbowOut`,
  `leg.kneeOut`): the forearm (with the hand) then points out by
  out + elbowOut, the shin by out + kneeOut, so a forearm or shin can turn
  toward or away from the body while the upper part stays. Default 0.
- **Poses are side view only; the front view is a projection** of the
  same body: the front and
  side drawings are two views of one body. The front torso is the
  artist's front drawings (straight and front-bend), picked by how far
  the upper body tips toward the viewer (lean + chest; the deepest
  drawing at 90°, turned over past 90°), with their own heights, which
  need not match the side view; arms and legs are
  projected with their `out` angles; the neck shows its up-down part and
  the face turns over when the head is upside down; feet keep their
  height below the ankle. Parts are drawn far to near by their depth
  toward the viewer (both views).
- **The neck is always behind the head**, and is drawn 1.5 × the length
  of the drawn neck.
  - A head bent far forward or below the shoulders (e.g. `fall-forward`)
    shows its top and back in the front view, from the turned head (no
    back-head drawing needed). A full back view of the body (arms behind
    the torso) is still not built.
- Foreshortening only by projection: a part turned out of the paper
  shortens (never widens); otherwise flat.
- Joint limits per species prevent broken anatomy.

- **Where the head looks is relative to the body**: `spine.turn`, degrees
  from the body's own front, + to its right, −90 … 90. Side view: 0 =
  side face, +90 = the face toward the viewer (its right side is the near
  one), −90 = turning away (more of the back of the head). Front view: 0 =
  front face, +90 = side face looking picture-left (its right), −90 =
  looking picture-right. So the head turns to the same side of the body in
  both views.

## 7. Pose vocabulary and names

Pose names read `<base>[-<prop>]-<what the body does>`, so a pose can be
found from a scene description:

- base: `stand`, `walk`, `run`, `leap`, `crouch`, `bend`, `crawl`, `kneel`, `lunge`, `sit`,
  `lie`, `fall`;
- the rest names what is visible (arms, then legs), never an emotion:
  `stand-hands-to-face`, not `fear`;
- poses are side view; there are no front poses (the front view is
  derived, §6);
- one arm `arm`/`hand`, both `arms`/`hands`; variants as suffixes
  (`-low`, `-back`, `-high`); a held prop right after the base, only when
  the body's shape is made for it (`stand-bow-draw`, `stand-sword-up`);
  no intent words (`guard`, `throw`, `strike`); head direction and mouth
  never (they are set per figure).

Every pose has an entry in `data/pose-index.json` (what it shows, what
touches the ground, story moments, nearest poses); poses are picked by the
rules in `docs/design/pose-picking.md`.

44 poses, many drawn from pose reference sheets and still
being refined. Poses are tuned visually in the pose lab and stored as data,
alphabetically.

## 8. Identity

- Unnamed figures: varied per instance (body colour, loincloth colour,
  torso pattern, horn shape, small proportion jitter, scale, seed) within
  species ranges.
- Named characters (~12, later): fixed garment colour **plus** a signature
  silhouette feature (weapon, crown, hair, tail curl), so identity never
  depends on colour alone.

## 9. Effects and props

- **Held props** are part of the pose (`arm.prop`): a sword or a bow in a
  hand, laid along a straight reference line through the grip that turns
  with the hand. Flat, no outline, in the colours drawn:
  - the weapon's shape is the artist's drawing (`data/props/held/
    <kind>.svg`, layer `base`, or a character's own layer), laid along
    the pose's line by the line drawn with it: its ends fix where the
    drawing goes and its length is the weapon's, so a weapon's style
    changes without touching a pose;
  - sword: a slightly curved dark blade (about 2.1 head-units from the
    grip to the point), a short red crossguard and a red hilt behind the
    grip;
  - club: a thin handle and a round heavy head (about 2.1 head-units from
    the grip to the end of the head), dark brown;
  - bow: a plain arch (about 5.8 head-units tip to tip, taller than the
    figure's head-to-knee) through the grip, its belly away from the
    body, with a thin straight string; when drawn (`draw`), the string
    runs from both tips to the other hand and an arrow lies from that
    hand through the grip. In the front view the bow is seen nearly
    edge-on.
  - two-handed (`grip: both`, sword or club): the other fist sits on the
    hilt just below the holding hand.
- Scene props (throne, chariot, trees) are placed by the panel, not the
  pose (`docs/design/panels.md`).
  A scene prop is a flat drawing in a few flat colours, its openings
  (arches, windows) cut out so the ground shows through; only the main
  masses, readable at phone size (`data/props/<id>.svg`, 100 px = 1
  head-unit, bottom edge on the ground). The artist's props are used as
  drawn (the top-view hut has thin dark edges; the throne is a gold back
  on dark steps; the golden deer is one yellow silhouette). Props face
  right; a panel can mirror them. A seat is marked in the drawing
  (`anchors`), and a figure sits on it.
- Later: fire (layered yellow/orange/red flame curls with black strokes),
  mace, stones, banners.

## 10. Open questions

- Is a back view ever needed?
- Are split panels always stacked bands, or sometimes side by side?
