# Prototype: turn a drawn face in 3D from its front and side drawings.
# Volumes: an element paired between front and side (same layer kind, best
# overlap in height) becomes a lofted volume: at each height an ellipse that
# fills the front drawing's width and the side drawing's depth (exact in the
# two drawn views, round in between). Unpaired / small elements are flat
# cards (front ones in the face plane, side ones in the side plane) at the
# depth their partner view gives; a card switches front <-> side at 45°.
import json, subprocess, sys, os, numpy as np
from PIL import Image
import tempfile; S = tempfile.mkdtemp()
data = json.load(open(sys.argv[1])); skin_col = sys.argv[2]; out = sys.argv[3]
R = 1.3; MPX = 200                      # mask range ±R head-units, px per hu
N = int(2 * R * MPX)

def mask(svg):
    f = f'{S}/_m.svg'; open(f, 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{N}" height="{N}" viewBox="{-R} {-R} {2*R} {2*R}">{svg}</svg>')
    subprocess.run(['rsvg-convert', f, '-o', f'{S}/_m.png'], check=True)
    a = np.array(Image.open(f'{S}/_m.png').convert('RGBA'))[:, :, 3] > 127
    return a
def col(c, layer):
    if layer == 'skin': return skin_col
    return c if c and c.startswith('#') else '#000000'

els = {v: [] for v in data}
for v, L in data.items():
    for e in L:
        m = mask(e['svg'])
        if not m.any(): continue
        ys, xs = np.nonzero(m)
        els[v].append(dict(layer=e['layer'], kind=('base' if e['layer'] in ('skin', 'eyes', 'mouth-2') else 'char'), fill=col(e['fill'], e['layer']), m=m,
                           area=m.sum(), y0=ys.min(), y1=ys.max(), cx=xs.mean(), cy=ys.mean()))
# pair: same layer group, best height overlap; only large-ish elements become volumes
def grp(e): return {'skin': 'skin', 'eyes': 'eyes', 'mouth-2': 'mouth'}.get(e['layer'], 'char')
pairs, used = [], set()
for a in sorted(els['front'], key=lambda e: -e['area']):
    best = None
    for j, b in enumerate(els['side']):
        if j in used or grp(b) != grp(a): continue
        ov = min(a['y1'], b['y1']) - max(a['y0'], b['y0']); un = max(a['y1'], b['y1']) - min(a['y0'], b['y0'])
        iou = ov / un if un > 0 else 0
        if iou > 0.4 and (best is None or iou > best[0]): best = (iou, j)
    if best: used.add(best[1]); pairs.append((a, els['side'][best[1]]))
    else: pairs.append((a, None))
side_only = [b for j, b in enumerate(els['side']) if j not in used]
SMALL = 0.06 * MPX * MPX * 0.5    # under this front area: card, not volume
vols, cards = [], []
skin_done = False
for a, b in pairs:                      # only the largest skin element is the head volume
    if b is not None and ((grp(a) == 'skin' and not skin_done) or grp(a) == 'char') and a['area'] > SMALL:
        vols.append((a, b)); skin_done = skin_done or grp(a) == 'skin'
    else: cards.append(('front', a, b))
for b in side_only: cards.append(('side', b, None))
print('volumes', [(a['layer'], b['layer']) for a, b in vols], 'cards', [(k, a['layer']) for k, a, b in cards])

def intervals(m):          # per row: min, max column (nan where empty)
    any_ = m.any(1); lo = np.where(any_, m.argmax(1), -1); hi = np.where(any_, m.shape[1] - 1 - m[:, ::-1].argmax(1), -1)
    to = lambda i: (i + 0.5) / MPX - R
    return np.where(any_, to(lo), np.nan), np.where(any_, to(hi), np.nan)
V = []
for a, b in vols:
    x0, x1 = intervals(a['m']); z0, z1 = intervals(b['m'])
    V.append(dict(layer=a['layer'], fill=a['fill'], xc=(x0 + x1) / 2, ax=(x1 - x0) / 2 + 0.5 / MPX, zc=(z0 + z1) / 2, az=(z1 - z0) / 2 + 0.5 / MPX))
# card depth: front cards at the partner's side depth (mean x of the side element), else at the skin volume's
# front surface (eyes, mouth) or middle (ears); side cards at the near side (x of the front partner or +0.15)
skinV = next(v for v in V if v['layer'] == 'skin')
def rowz(cy, which):
    r = int(cy); return skinV['zc'][r] + (skinV['az'][r] if which == 'front' else 0)
C = []
for kind, a, b in cards:
    d = dict(fill=a['fill'], m=a['m'], plane=kind)
    if kind == 'front':
        # on the head volume's front surface at the card's centre (ears, outside it: its middle depth)
        r = int(a['cy']); x = (a['cx'] + 0.5) / MPX - R
        k = 1 - ((x - skinV['xc'][r]) / skinV['ax'][r]) ** 2
        d['depth'] = float(np.nan_to_num(skinV['zc'][r] + (skinV['az'][r] * np.sqrt(k) if k > 0 else 0)))
        if b is not None: C.append(dict(fill=b['fill'], m=b['m'], plane='side', depth=None, pair=True))
    else: d['depth'] = None
    C.append(d)
# side cards: plane at the near side X; eyes at the front eye's |x|
eyeX = np.mean([abs((e['cx'] + 0.5) / MPX - R) for e in els['front'] if grp(e) == 'eyes'] or [0.15])

PX = 100; M = int(2 * R * PX)
us = (np.arange(M) + 0.5) / PX - R
U, Vv = np.meshgrid(us, us)
def rot(yaw, pitch):
    cy, sy, cp, sp = np.cos(yaw), np.sin(yaw), np.cos(pitch), np.sin(pitch)
    Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])          # X,Y,Z -> u,.,w  (yaw 90: face (Z) to picture-right)
    Rx = np.array([[1, 0, 0], [0, cp, -sp], [0, sp, cp]])           # pitch +: face up
    return Rx @ Ry
def hexrgb(h): h = h.lstrip('#'); return [int(h[i:i + 2], 16) for i in (0, 2, 4)]

def render(yaw_d, pitch_d, bg=(242, 236, 225)):
    Rm = rot(np.radians(yaw_d), np.radians(pitch_d)); Ri = Rm.T
    img = np.zeros((M, M, 3), np.uint8); img[:] = bg
    zbuf = np.full((M, M), -1e9)
    ws = np.arange(R, -R, -0.015)
    # volumes: march each ray front to back
    for vol in sorted(V, key=lambda v: {'back': 0, 'under': 1, 'skin': 2, 'over': 3}.get(v['layer'], 2)):
        hit = np.full((M, M), -1e9)
        for w in ws:
            P = Ri @ np.stack([U.ravel(), Vv.ravel(), np.full(U.size, w)])
            x, y, z = P
            r = np.clip(((y + R) * MPX).astype(int), 0, N - 1)
            ax, az, xc, zc = vol['ax'][r], vol['az'][r], vol['xc'][r], vol['zc'][r]
            ins = ((x - xc) / ax) ** 2 + ((z - zc) / az) ** 2 <= 1
            ins = np.nan_to_num(ins, nan=False).astype(bool).reshape(M, M)
            new = ins & (hit < -1e8); hit[new] = w
        facing = np.cos(np.radians(yaw_d)) * np.cos(np.radians(pitch_d))   # +1 face toward the viewer, -1 back of the head
        bias = {'under': -0.15 * facing, 'back': -0.3 * facing, 'skin': 0, 'over': 0.15}.get(vol['layer'], 0)
        hb = np.where(hit > -1e8, hit + bias, -1e9)
        sel = hb > zbuf; zbuf[sel] = hb[sel]; img[sel] = hexrgb(vol['fill'])
    # cards: front ones in planes Z = depth, side ones in planes X = eyeX (near side, picture side by yaw)
    fw = abs(np.cos(np.radians(yaw_d))) >= abs(np.sin(np.radians(yaw_d)))
    for c in C:
        if c['plane'] == 'front' and not fw: continue
        if c['plane'] == 'side' and fw: continue
        if c['plane'] == 'front':
            # P = (x, y, d): u,v = Rm[:2] @ P  -> solve for x, y
            d = c['depth']; A = Rm[:2, :2]; bvec = Rm[:2, 2] * d
            inv = np.linalg.inv(A); q = inv @ (np.stack([U.ravel(), Vv.ravel()]) - bvec[:, None]); x, y = q
            P = np.stack([x, y, np.full_like(x, d)]); mx, my = x, y
        else:
            Xs = eyeX * np.sign(np.sin(np.radians(yaw_d)) or 1) * -1   # the side toward the viewer
            A = Rm[:2, 1:]; bvec = Rm[:2, 0] * Xs
            inv = np.linalg.inv(A); q = inv @ (np.stack([U.ravel(), Vv.ravel()]) - bvec[:, None]); y, z = q
            P = np.stack([np.full_like(y, Xs), y, z]); mx = z if np.sin(np.radians(yaw_d)) >= 0 else -z; my = y
            mx = z; my = y
        wv = (Rm[2] @ P).reshape(M, M)
        ix = np.clip(((mx + R) * MPX).astype(int), 0, N - 1).reshape(M, M); iy = np.clip(((my + R) * MPX).astype(int), 0, N - 1).reshape(M, M)
        on = c['m'][iy, ix] & (wv >= zbuf - 0.12)
        img[on] = hexrgb(c['fill']); zbuf[on] = np.maximum(zbuf[on], wv[on])
    return img

yaws = [0, 30, 60, 90, 120, 150, 180]; pitches = [40, 20, 0, -20, -40]
cell = M
sheet = Image.new('RGB', (cell * len(yaws), cell * len(pitches)), (242, 236, 225))
for i, p in enumerate(pitches):
    for j, y in enumerate(yaws):
        sheet.paste(Image.fromarray(render(y, p)), (j * cell, i * cell))
sheet.save(out); print(out, sheet.size)
