// The panel read-back (tools/describe-panel.mjs): a panel's layout as
// text, with the checks the artist's reviews keep failing panels on —
// contact (feet on what they stand on), faces covered or cut by the frame,
// figures in the air. Works from renderPanel's `layout` (src/scene.js), so
// it sees exactly what is drawn; props are measured from their drawings.
import { renderPanel, findPose, PANEL_W, HEAD_TOP, MAN, HORIZON } from '../src/scene.js';
import { buildShapes } from '../src/figure.js';
import { parse } from './svg.mjs';
import { pathPolys, parseTransform, mm, ap } from './svg-geom.mjs';

const TOUCH = 0.35;            // head-units: a foot this close to a surface touches it
const f2 = (v) => (Math.round(v * 100) / 100).toFixed(2);
const f1 = (v) => (Math.round(v * 10) / 10).toFixed(1);

// ---- prop outlines, in the drawing's head-units (cached per drawing) ------
const outlineCache = new WeakMap();
const SKIP = /^(defs|clipPath|mask|linearGradient|radialGradient|pattern|filter|title|desc|metadata|style|symbol|text)$/;
export function propOutline(def) {
  if (!def?.svg) return null;
  if (outlineCache.has(def)) return outlineCache.get(def);
  const polys = [];
  const style = (n, k) => n.attrs[k] ?? n.attrs.style?.match(new RegExp(`(?:^|;)\\s*${k}\\s*:\\s*([^;]+)`))?.[1]?.trim();
  const walk = (n, M) => {
    if (n.text != null || SKIP.test(n.tag)) return;
    if (style(n, 'display') === 'none' || style(n, 'visibility') === 'hidden' || Number(style(n, 'opacity') ?? 1) === 0) return;
    const T = n.attrs.transform ? mm(M, parseTransform(n.attrs.transform)) : M;
    const a = (k) => Number(n.attrs[k] ?? 0);
    const filled = style(n, 'fill') !== 'none';
    const stroked = (style(n, 'stroke') ?? 'none') !== 'none';
    const sw = stroked ? Number(String(style(n, 'stroke-width') ?? 1).replace(/px$/, '')) || 1 : 0;
    let local = [];
    if (filled || stroked) {
      if (n.tag === 'path' && n.attrs.d) { try { local = pathPolys(n.attrs.d, 2); } catch { local = []; } }
      else if (n.tag === 'line') local = [[[a('x1'), a('y1')], [a('x2'), a('y2')]]];
      else if (n.tag === 'rect') local = [[[a('x'), a('y')], [a('x') + a('width'), a('y')], [a('x') + a('width'), a('y') + a('height')], [a('x'), a('y') + a('height')]]];
      else if (n.tag === 'circle' || n.tag === 'ellipse') {
        const rx = n.tag === 'circle' ? a('r') : a('rx'), ry = n.tag === 'circle' ? a('r') : a('ry');
        local = [Array.from({ length: 16 }, (_, i) => [a('cx') + rx * Math.cos(i * Math.PI / 8), a('cy') + ry * Math.sin(i * Math.PI / 8)])];
      } else if ((n.tag === 'polygon' || n.tag === 'polyline') && n.attrs.points) {
        const v = n.attrs.points.trim().split(/[\s,]+/).map(Number), pts = [];
        for (let i = 0; i + 1 < v.length; i += 2) pts.push([v[i], v[i + 1]]);
        local = [pts];
      }
    }
    for (const p of local) {
      if (filled && p.length > 2) polys.push(p.map((q) => ap(T, q)));
      // a stroke: each segment a band as wide as the line
      if (stroked) for (let i = 1; i < p.length; i++) {
        const [x1, y1] = p[i - 1], [x2, y2] = p[i], len = Math.hypot(x2 - x1, y2 - y1);
        if (!len) continue;
        const nx = (-(y2 - y1) / len) * sw / 2, ny = ((x2 - x1) / len) * sw / 2;
        polys.push([[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]].map((q) => ap(T, q)));
      }
    }
    for (const c of n.children || []) walk(c, T);
  };
  walk(parse(def.svg), [1, 0, 0, 1, 0, 0]);
  outlineCache.set(def, polys);
  return polys;
}

// ---- polygon helpers (panel units, y down) ----------------------------------
const inside = (poly, [x, y]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
// the highest point (least y) of the outline straight above or below x
const topAt = (polys, x) => {
  let best = null;
  for (const p of polys) for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [x1, y1] = p[j], [x2, y2] = p[i];
    if ((x1 <= x && x <= x2) || (x2 <= x && x <= x1)) {
      const y = x1 === x2 ? Math.min(y1, y2) : y1 + ((y2 - y1) * (x - x1)) / (x2 - x1);
      if (best == null || y < best) best = y;
    }
  }
  return best;
};
const boxOf = (polys) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of polys) for (const [x, y] of p) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { x0, y0, x1, y1 };
};
const mean = (pts) => [pts.reduce((s, q) => s + q[0], 0) / pts.length, pts.reduce((s, q) => s + q[1], 0) / pts.length];

// sample points over a head outline: the centre and two rings
function faceSamples(poly) {
  const c = mean(poly), out = [c];
  for (const k of [0.4, 0.75]) for (let i = 0; i < poly.length; i += Math.max(1, Math.floor(poly.length / 10)))
    out.push([c[0] + (poly[i][0] - c[0]) * k, c[1] + (poly[i][1] - c[1]) * k]);
  return out;
}

// ---- an entry's drawn shapes in the panel -----------------------------------
function shapesOf(L) {
  if (L.kind === 'figure') {
    const shapes = L.built.shapes.filter((s) => s.pts?.length > 2 && s.role !== 'prop' && !s.hairBody && (!L.headOnly || s.headPart));
    return shapes.map((s) => ({ part: s.headPart ? 'head' : s.part, role: s.role, pts: s.pts.map(L.toPanel) }));
  }
  if (L.kind === 'prop') {
    const o = propOutline(L.def);
    const [w, h] = L.size;
    const local = L.def ? o || [] : [[[0, 0], [w, 0], [w, h], [0, h]]];   // a placeholder is its box
    return local.map((p) => ({ part: L.prop, pts: p.map(L.toPanel) }));
  }
  return [];
}

// ---- the panel ---------------------------------------------------------------
export function describePanel(id, def, assets, data) {
  const r = renderPanel(def, assets, { id });
  const W = PANEL_W, H = r.h, hz = r.horizon ?? HORIZON;
  const horizonY = H * (1 - hz);
  const topView = def.camera === 'top' || (def.tags || []).includes('topview') || (def.figures || []).some((e) => /-top(-|$)/.test(e.prop || ''));
  const L = r.layout;
  for (const l of L) { l.shapes = shapesOf(l); l.box = l.kind === 'band' ? null : boxOf(l.shapes.map((s) => s.pts)); }
  const counts = {};
  for (const l of L) counts[l.name] = (counts[l.name] || 0) + 1;
  const seen = {};
  for (const l of L) { seen[l.name] = (seen[l.name] || 0) + 1; l.label = counts[l.name] > 1 ? `${l.name}#${seen[l.name]}` : l.name; }
  const shareX = (x) => f2(x / W), shareY = (y) => f2(1 - y / H);
  const hu = (l, px) => px / l.unit;

  const lines = [];
  const head = [`${id} · tall ${def.tall ?? 1.5} (${W}×${H})`, `ground ${def.ground ?? 'default'}`];
  if (def.sky) head.push(`sky ${def.sky}`);
  head.push(`horizon ${f2(hz)}`);
  if (def.mode) head.push(def.mode);
  if (topView) head.push('top view');
  if (def.tags) head.push(`tags ${def.tags.join(', ')} (locked)`);
  lines.push(head.join(' · '));
  if (def.scene) lines.push(`  "${def.scene}"`);
  for (const m of r.issues) lines.push(`  ${/placeholder/.test(m) ? '·' : '!'} renderer: ${m}`);
  const ids = (def.figures || []).map((e) => e.id).filter(Boolean);
  for (const d of new Set(ids.filter((x, i) => ids.indexOf(x) !== i))) lines.push(`  ! id "${d}" is used by ${ids.filter((x) => x === d).length} entries: relations and "on" find only the first`);

  // what covers a point: entries drawn after `l`
  const coverer = (l, pt) => {
    for (let j = L.length - 1; j > l.k; j--) {
      const c = L[j];
      if (c.kind === 'band') { if (pt[1] > c.lineY(pt[0])) return { by: c, part: 'band' }; continue; }
      if (pt[0] < c.box.x0 || pt[0] > c.box.x1 || pt[1] < c.box.y0 || pt[1] > c.box.y1) continue;
      const s = c.shapes.find((sh) => inside(sh.pts, pt));
      if (s) return { by: c, part: s.part };
    }
    return null;
  };
  const edgesCut = (b) => [b.x0 < -0.5 && 'left', b.x1 > W + 0.5 && 'right', b.y0 < -0.5 && 'top', b.y1 > H + 0.5 && 'bottom'].filter(Boolean);
  const out = (b) => b.x1 < 0 || b.x0 > W || b.y1 < 0 || b.y0 > H;

  // the surface under a point: a band's line, another entry's top (props, and
  // figures only when the point sits on them); returns { name, gap } in the
  // entry's head-units, + = the point above it
  const surfaceUnder = (l, [x, y]) => {
    let best = null;
    for (const c of L) {
      if (c === l) continue;
      let top = null;
      if (c.kind === 'band') top = c.lineY(x);
      else if (c.kind === 'prop' && c.box.x0 <= x && x <= c.box.x1) top = topAt(c.shapes.map((s) => s.pts), x);
      if (top == null) continue;
      const gap = hu(l, top - y);
      if (gap > -TOUCH * 3 && (best == null || Math.abs(gap) < Math.abs(best.gap))) best = { c, gap };
    }
    return best;
  };

  for (const l of L) {
    const e = l.entry, notes = [];
    if (l.kind === 'band') {
      lines.push(`  ${l.k + 1} ${l.label} · band of ground from the bottom edge to ${f2(l.line[0])} at the left, ${f2(l.line[1])} at the right · ${e.color}`);
      continue;
    }
    const b = l.box;
    const where = `x ${shareX(b.x0)}–${shareX(b.x1)}, y ${shareY(b.y1)}–${shareY(b.y0)}`;
    const dep = e.depth ?? e.row ?? 'front';
    const place = e.on ? `on ${e.on}${e.depth != null ? `, depth ${e.depth}` : ''}` : `depth ${dep}`;
    const extra = [e.scale != null && `scale ${e.scale}`, l.rot && `rotate ${l.rot}`, e.nudge != null && `nudge ${JSON.stringify(e.nudge)}`].filter(Boolean).join(', ');

    if (l.kind === 'prop') {
      const [w, h] = l.size;
      lines.push(`  ${l.k + 1} ${l.label}${l.label !== e.prop ? ` (${e.prop})` : ''} · prop ${f1(w * (e.scale ?? 1))}×${f1(h * (e.scale ?? 1))} hu${l.def ? '' : ', placeholder box'}${e.facing === 'left' ? ', mirrored' : ''} · ${where} · ${place}${extra ? ' · ' + extra : ''}${l.copy ? ' · repeat copy' : ''}`);
      const cut = edgesCut(b);
      if (out(b)) notes.push('! outside the panel: not drawn');
      else if (cut.length) notes.push(`· cut by the ${cut.join(', ')} edge${cut.length > 1 ? 's' : ''}`);
      if (!e.on && dep !== 'top' && dep !== 'floor' && dep !== 'closeup' && !l.rot && !out(b)) {
        const s = surfaceUnder(l, [(b.x0 + b.x1) / 2, b.y1]);
        if (s && Math.abs(s.gap) <= TOUCH && s.c.kind !== 'band') notes.push(`· stands on ${s.c.label} (by position, not "on")`);
      }
    } else {
      const sp = l.species, bs = (l.pose || '').split('-'), base = data.bases[bs[0]], ges = data.gestures[bs.slice(1).join('-')];
      const tall = MAN * l.unit;
      const what = [base?.desc, ges?.desc].filter(Boolean).join('; ');
      const view = l.headOnly ? 'head alone' : `${l.view} view`;
      const look = [];
      const turn = e.turn;
      if (typeof turn === 'number') look.push(Math.abs(turn) >= 135 ? 'head turned to look back' : Math.abs(turn) >= 45 ? 'head turned to the reader' : `head turned ${turn}°`);
      const tilt = e.adjust?.['spine.head'];
      if (typeof tilt === 'number') look.push(tilt > 0 ? `looks down ${tilt}°` : `looks up ${-tilt}°`);
      const mouth = e.mouth ?? ges?.mouth;
      lines.push(`  ${l.k + 1} ${l.label}${l.label !== l.character ? ` (${l.character})` : ''} · ${l.pose}${what ? ` — ${what}` : ''}`);
      lines.push(`      ${view}, faces ${l.facing < 0 ? 'left' : 'right'}${look.length ? ', ' + look.join(', ') : ''}${mouth ? `, mouth ${mouth}` : ''} · ${where} · ${l.headOnly ? `head ${Math.round(l.unit)} px` : `${Math.round(tall)} px tall, head ${f1(l.unit)} px`} · ${place}${extra ? ' · ' + extra : ''}`);

      const headShape = l.shapes.find((s) => s.part === 'head');
      // the face: covered by what is drawn after it, by its own arm, cut by the frame
      if (headShape) {
        const pts = faceSamples(headShape.pts);
        const inFrame = pts.filter(([x, y]) => x >= 0 && x <= W && y >= 0 && y <= H);
        if (!inFrame.length) notes.push(l.headOnly ? '! the head is outside the panel' : '? the head is out of frame');
        else if (inFrame.length < pts.length * 0.8) notes.push(`? the face is cut by the ${edgesCut(boxOf([headShape.pts])).join(', ')} edge`);
        const by = {};
        for (const p of inFrame) { const c = coverer(l, p); if (c) { const k = `${c.by.label}${c.part !== 'band' && c.by.kind === 'figure' ? `'s ${c.part}` : ''}`; by[k] = (by[k] || 0) + 1; } }
        for (const [k, n] of Object.entries(by)) if (n >= inFrame.length * 0.25)
          notes.push(`! the face is ${Math.round((100 * n) / inFrame.length)}% covered by ${k} (drawn after it)`);
        // its own arm in front of its own face (drawn after the head)
        const hi = l.shapes.indexOf(headShape);
        const own = l.shapes.slice(hi + 1).filter((s) => /arm|hand/.test(s.part || ''));
        const n = pts.filter((p) => own.some((s) => inside(s.pts, p))).length;
        if (n >= pts.length * 0.25) notes.push(`! its own arm covers ${Math.round((100 * n) / pts.length)}% of its face`);
      }
      if (!l.headOnly) {
        const cut = edgesCut(b);
        if (out(b)) notes.push('! outside the panel: not drawn');
        else if (cut.includes('bottom') && !l.rot) {
          const J = l.built.joints, lm = [['the neck', J.spine?.neck], ['the chest', J.spine?.neck && J.spine?.waist && [(J.spine.neck[0] + J.spine.waist[0]) / 2, (J.spine.neck[1] + J.spine.waist[1]) / 2]], ['the waist', J.spine?.waist], ['the hips', J.spine?.pelvis], ['the knees', J.near?.Kn], ['the feet', J.near?.A]]
            .filter(([, q]) => q).map(([n, q]) => [n, l.toPanel(q)[1]]);
          const lastIn = lm.filter(([, y]) => y <= H).pop();
          notes.push(`· cut by the bottom edge${lastIn ? `: shows down to ${lastIn[0]}` : ' above the neck'}${cut.length > 1 ? `; also the ${cut.filter((c) => c !== 'bottom').join(', ')} edge` : ''}`);
        } else if (cut.length) notes.push(`· cut by the ${cut.join(', ')} edge${cut.length > 1 ? 's' : ''}`);

        // what it stands on
        const feet = l.shapes.filter((s) => /-foot$/.test(s.part || '')).map((s) => s.pts.reduce((m, q) => (q[1] > m[1] ? q : m)));
        const [on, anchor = 'seat'] = String(e.on ?? '').split('#');
        const target = e.on && L.find((c) => c.name === on);
        const footNote = (s) => (s == null ? 'over nothing' : Math.abs(s) <= TOUCH ? 'on it' : s > 0 ? `${f1(s)} hu above it` : `${f1(-s)} hu inside it`);
        if (target?.kind === 'prop' && !/^(seat|face|inside|hand)/.test(anchor) && feet.length) {
          const gaps = feet.map(([x, y]) => { const t = topAt(target.shapes.map((s) => s.pts), x); return t == null ? null : hu(l, t - y); });
          if (!gaps.some((g) => g != null && Math.abs(g) <= TOUCH)) {
            const lifted = Array.isArray(e.nudge) && e.nudge[1] > 0;
            const instead = feet.map((q) => surfaceUnder(l, q)).find((s) => s && s.c !== target && Math.abs(s.gap) <= TOUCH);
            notes.push(`${lifted ? '?' : '!'} "on" ${e.on}, but no foot touches it: ${gaps.map((g, i) => `${feet.length > 1 ? ['one foot', 'the other'][i] : 'the foot'} ${footNote(g)}`).join(', ')}` +
              (instead ? ` — it stands on ${instead.c.label} instead` : lifted ? ` (lifted by nudge ${JSON.stringify(e.nudge)})` : ''));
          }
        } else if (target?.kind === 'band') {
          const dy = Array.isArray(e.nudge) ? e.nudge[1] : 0;
          if (dy) notes.push(`· ${dy > 0 ? `${f1(dy)} hu above` : `sunk ${f1(-dy)} hu behind`} the band's line`);
        } else if (!e.on && feet.length && dep !== 'top' && dep !== 'closeup' && !topView && Math.abs(l.rot) < 60) {
          const low = feet.reduce((m, q) => (q[1] > m[1] ? q : m));
          const s = feet.map((q) => surfaceUnder(l, q)).filter(Boolean).sort((a, c) => Math.abs(a.gap) - Math.abs(c.gap))[0];
          if (low[1] >= H - 1) notes.push('· the feet at or below the bottom edge');
          else if (s && Math.abs(s.gap) <= TOUCH) notes.push(`· stands on ${s.c.label}${s.c.kind === 'band' ? '' : ' (by position, not "on")'}`);
          else if (dep !== 'horizon') {
            // perspective: the depth its size says, against the depth its feet are at
            const tSize = 1 - (l.unit * MAN) / (HEAD_TOP * H);       // the depth whose man is this big
            const groundOfSize = H * (1 - tSize * hz);                  // that depth's ground line
            const lift = hu(l, groundOfSize - low[1]);
            const under = s ? `, ${s.c.label} ${f1(s.gap)} hu below` : ', nothing under it';
            if (low[1] < horizonY && lift > TOUCH) notes.push(`? in the air: feet above the horizon, ${f1(lift)} hu over the ground for its size${under}`);
            else if (lift > 1.5) notes.push(`? in the air: ${f1(lift)} hu over the ground for its size (depth ${f2(tSize)})${under}`);
            else if (lift < -1.5) notes.push(`? small for where it stands: its size is depth ${f2(tSize)}, its feet ${f1(-lift)} hu lower — reads as sunk or far`);
          }
        }

        // who it faces (side view): the nearest figure ahead of it
        if (l.view === 'side') {
          const ahead = L.filter((c) => c !== l && c.kind === 'figure' && !c.headOnly && Math.sign(((c.box.x0 + c.box.x1) - (b.x0 + b.x1)) / 2) === l.facing)
            .map((c) => ({ c, d: l.facing > 0 ? c.box.x0 - b.x1 : b.x0 - c.box.x1 }))
            .sort((a, c) => a.d - c.d)[0];
          const edge = l.facing > 0 ? W - b.x1 : b.x0;
          if (ahead) notes.push(`· faces ${ahead.c.label}, ${ahead.d > 0 ? `${f1(hu(l, ahead.d))} hu away` : 'overlapping'}${ahead.c.facing === -l.facing ? ', who faces it' : ahead.c.view === 'front' ? '' : ', who faces away'}`);
          else if (edge < hu(l, 0) + l.unit * 1.5) notes.push(`· faces the ${l.facing > 0 ? 'right' : 'left'} edge, ${f1(hu(l, Math.max(0, edge)))} hu from it`);
        }
      }
    }
    for (const n of notes) lines.push(`      ${n}`);
  }
  return lines;
}

// ---- catalogues: what the drawings and the pose data hold -------------------
export function describeProps(assets) {
  const out = ['prop · size w×h head-units at scale 1 (a man is 6.1 tall) · anchors [x, y] from the top-left · recolour roles'];
  for (const [id, d] of Object.entries(assets.props.props)) {
    const a = Object.entries(d.anchors || {}).map(([k, v]) => `${k} [${f1(v[0])}, ${f1(v[1])}]${/^(face|inside)$/.test(k) ? ` d ${f1(v[2])}` : ''}`);
    out.push(`${id} · ${f1(d.size[0])}×${f1(d.size[1])}${a.length ? ` · ${a.join(', ')}` : ''}${d.recolor ? ` · recolour ${Object.keys(d.recolor).join(', ')}` : ''}`);
  }
  return out;
}

export function describePoses(assets, data) {
  const S = assets.species.male;
  const measure = (name) => {
    const p = findPose(assets, name).pose;
    if (!p) return null;
    const b = buildShapes(S, p, undefined, 'side');
    const J = b.joints;
    return { h: -b.bbox.y0, w: b.bbox.x1 - b.bbox.x0, stance: J.near?.A && J.far?.A ? Math.abs(J.near.A[0] - J.far.A[0]) : 0,
      reach: Math.max(...[J.near, J.far].filter((a) => a?.Wr && a?.sh).map((a) => Math.hypot(a.Wr[0] - a.sh[0], a.Wr[1] - a.sh[1]))),
      handsUp: Math.max(...[J.near, J.far].filter((a) => a?.Wr && a?.sh).map((a) => a.sh[1] - a.Wr[1])) };
  };
  const out = ['BASES (with arms hanging) · height and stance (feet apart) in head-units, a man standing is 6.1 tall'];
  for (const [k, v] of Object.entries(data.bases)) {
    const m = measure(`${k}-hang`);
    out.push(`${k} — ${v.desc || ''}${m ? ` · ${f1(m.h)} tall, feet ${f1(m.stance)} apart` : ''}${v.ground && v.ground !== 'feet' ? ` · rests on ${v.ground}` : ''}${v.use?.length ? ` · for ${v.use.join(', ')}` : ''}`);
  }
  out.push('', 'GESTURES (on the step base) · reach: farthest hand from its shoulder; hands up: + above the shoulder, in head-units');
  for (const [k, v] of Object.entries(data.gestures)) {
    const m = measure(`step-${k}`);
    out.push(`${k} — ${v.desc || ''}${m ? ` · reach ${f1(m.reach)}, hands up ${f1(m.handsUp)}` : ''}${v.hold?.length ? ` · holds in ${v.hold.join(', ')}` : ''} · mouth ${v.mouth ?? 1}${v.use?.length ? ` · for ${v.use.join(', ')}` : ''}`);
  }
  return out;
}
