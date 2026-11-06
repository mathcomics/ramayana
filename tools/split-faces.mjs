// One-time, already run (2026-11-06; it reads the old whole-face format): split the character faces into a base face per
// species and character layers.
//
//   node tools/split-faces.mjs
//     -> data/faces/base/<species>.svg   (skin, eyes, mouths; from one character)
//     -> data/faces/<id>.svg             (rewritten: under, over, back, hair-body, …)
//
// Each character's head layer is split by colour and place: leaves in the
// character's body colour are skin (the base's), leaves matching the base's
// eyes are the base's eyes (a character whose eyes differ keeps its own as an
// `eyes` layer), mouths the same; everything before the first skin leaf goes
// in `under`, the rest in `over`. The drawings themselves are copied
// unchanged (each leaf with the transforms of its groups).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { root, json, writeOut } from './lib.mjs';
import { parse, label } from './svg.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const F = json('data/faces.json').faces;
const C = json('data/characters.json').characters;
const SOURCE = { male: 'rama', female: 'sita', monkey: 'hanuman' };
const OFFSET = 3;
const n3 = (v) => +v.toFixed(4);

// the template guide (head rectangle + drawn body) of a species and view
function templateGuide(species, view) {
  const svg = parse(readFileSync(join(root, `data/faces/templates/${species}.svg`), 'utf8')).children.find((c) => c.tag === 'svg');
  const v = svg.children.find((c) => c.tag === 'g' && label(c) === view);
  const g = v.children.find((c) => c.tag === 'g' && /guide$/.test(label(c)));
  const ser = (n) => (n.text != null ? n.text : `<${n.tag}${Object.entries(n.attrs).filter(([k]) => k !== 'id').map(([k, val]) => ` ${k}="${val}"`).join('')}${n.children.length ? `>${n.children.map(ser).join('')}</${n.tag}>` : '/>'}`);
  return g.children.filter((c) => c.tag).map(ser).join('\n      ');
}

const b = await chromium.launch();
const page = await b.newPage();
// leaves of a layer: the leaf's markup (own transform kept), its parent
// transform relative to the layer, fill, bbox
async function leaves(markup, defs = '') {
  await page.setContent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 2 2"><defs>${defs}</defs><g id="h">${markup}</g></svg>`);
  return page.evaluate(() => {
    const root = document.getElementById('h');
    const inv = root.getCTM().inverse();
    const out = [];
    for (const el of root.querySelectorAll('path,ellipse,circle,rect,polygon,polyline,line,use')) {
      const bb = el.getBBox(), r = inv.multiply(el.getCTM());
      const pts = [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]]
        .map(([x, y]) => [r.a * x + r.c * y + r.e, r.b * x + r.d * y + r.f]);
      const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
      const pm = inv.multiply(el.parentNode.getCTM());
      const cs = getComputedStyle(el);
      const c = el.cloneNode(true);
      c.removeAttribute('id');
      // inherited paint made explicit
      if (!el.getAttribute('fill') && !/fill\s*:/.test(el.getAttribute('style') || '')) c.setAttribute('fill', cs.fill);
      const ident = Math.abs(pm.a - 1) + Math.abs(pm.b) + Math.abs(pm.c) + Math.abs(pm.d - 1) + Math.abs(pm.e) + Math.abs(pm.f) < 1e-9;
      out.push({
        html: ident ? c.outerHTML : `<g transform="matrix(${[pm.a, pm.b, pm.c, pm.d, pm.e, pm.f].map((v) => +v.toFixed(6)).join(' ')})">${c.outerHTML}</g>`,
        fill: cs.fill, bb: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
      });
    }
    return out.map((l) => l.html.replace(/ xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '')).map((html, i) => ({ ...out[i], html }));
  });
}
const rgb = (hex) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
const ctr = (l) => [(l.bb[0] + l.bb[2]) / 2, (l.bb[1] + l.bb[3]) / 2];
const size = (l) => [l.bb[2] - l.bb[0], l.bb[3] - l.bb[1]];
const near = (a, b, d) => Math.hypot(a[0] - b[0], a[1] - b[1]) < d;

// ---- split every face into skin / eyes / under / over
const split = {};
for (const c of C) for (const view of ['front', 'side']) {
  const v = F[c.id][view];
  const L = await leaves(v.head, v.defs);
  const skin = (l) => l.fill === rgb(c.body);
  const first = L.findIndex(skin);
  split[`${c.id}/${view}`] = { L, skin, first };
}
// base: the source character's skin and eyes (eyes: small leaves on the face, not skin)
const base = {};
for (const [species, id] of Object.entries(SOURCE)) for (const view of ['front', 'side']) {
  const { L, skin } = split[`${id}/${view}`];
  const eyes = L.filter((l) => !skin(l) && size(l)[0] < 0.18 && size(l)[1] < 0.18 && ctr(l)[1] > -0.3 && ctr(l)[1] < 0.05
    && (view === 'front' ? Math.abs(ctr(l)[0]) > 0.08 && Math.abs(ctr(l)[0]) < 0.35 : ctr(l)[0] > 0.1 && ctr(l)[0] < 0.36));
  const sk = L.filter(skin);
  const ys = sk.flatMap((l) => [l.bb[1], l.bb[3]]);
  base[`${species}/${view}`] = { skin: sk, eyes, mouth: F[id][view].mouth || {},
    top: [0, n3(Math.min(...ys))], chin: [0, n3(Math.max(...ys))] };
}
// does a character's mouth differ from the base's? compare leaf boxes and fills
// (within 0.03 head-units and a near colour: copies moved a hair count as the same)
const col = (f) => (f.match(/\d+/g) || []).slice(0, 3).map(Number);
const sameFill = (a, b) => { const x = col(a), y = col(b); return x.length === 3 && y.length === 3 && x.every((v, i) => Math.abs(v - y[i]) < 12); };
const sameLeaves = (A, B, tol) => A.length === B.length && A.every((l, i) => sameFill(l.fill, B[i].fill) && l.bb.every((v, j) => Math.abs(v - B[i].bb[j]) < tol));
const sameMouth = async (m, n) => {
  for (const k of ['1', '2', '3']) {
    const A = await leaves(m?.[k] || ''), B = await leaves(n?.[k] || '');
    if (!sameLeaves(A, B, 0.04)) { if (process.env.DEBUG) console.log('  mouth', k, JSON.stringify(A.map((l) => [l.fill, l.bb.map((v) => +v.toFixed(3))])), JSON.stringify(B.map((l) => [l.fill, l.bb.map((v) => +v.toFixed(3))]))); return false; }
  }
  return true;
};

const report = [];
const charFiles = {};
for (const c of C) {
  const views = {};
  for (const view of ['front', 'side']) {
    const { L, skin, first } = split[`${c.id}/${view}`];
    const B = base[`${c.species}/${view}`];
    // eyes: leaves that sit where the base's eyes are
    const eyeIdx = L.map((l, i) => (!skin(l) && B.eyes.some((e) => near(ctr(l), ctr(e), 0.07) && size(l)[0] < 0.2 && size(l)[1] < 0.2) ? i : -1)).filter((i) => i >= 0);
    const own = !sameLeaves(eyeIdx.map((i) => L[i]), B.eyes, 0.012);
    const rest = L.map((l, i) => ({ l, i })).filter(({ l, i }) => !skin(l) && !eyeIdx.includes(i));
    const under = rest.filter(({ i }) => i < first).map(({ l }) => l.html);
    const over = rest.filter(({ i }) => i > first).map(({ l }) => l.html);
    const ownMouth = !(await sameMouth(F[c.id][view].mouth, B.mouth));
    const f = F[c.id][view];
    views[view] = { under, over, eyes: own ? eyeIdx.map((i) => L[i].html) : null, mouth: ownMouth ? f.mouth : null,
      back: f.back, hairBody: f.hairBody, nape: f.nape };
    report.push(`${c.id} ${view}: under ${under.length}, over ${over.length}${own ? ', own eyes' : ''}${ownMouth ? ', own mouth' : ''}`);
  }
  charFiles[c.id] = views;
}
await b.close();

// ---- write the files
const layer = (name, inner = '', extra = '') => `    <g inkscape:groupmode="layer" inkscape:label="${name}"${extra}>${inner ? `\n      ${inner}\n    ` : ''}</g>\n`;
const guideOf = (species, view, extraFace) => layer('guide', `${templateGuide(species, view)}${extraFace ? `\n      <g opacity="0.6">${extraFace}</g>` : ''}`, ' sodipodi:insensitive="true" opacity="0.7"');
const circle = (name, p, fill = '#d02020') => `<circle inkscape:label="${name}" cx="${p[0]}" cy="${p[1]}" r="0.03" fill="${fill}"/>`;
const head = (title, body, h = 5) => `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
${title}
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
     xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
     width="1200" height="${h * 200}" viewBox="-1.5 -1.2 6 ${h}">
${body}</svg>
`;
const baseFace = (B) => [...B.skin.map((l) => l.html), ...B.eyes.map((l) => l.html)].join('');

for (const species of Object.keys(SOURCE)) {
  let body = '';
  const views = [['front', 0, 0], ['side', OFFSET, 0], ['front-up', 0, OFFSET + 1], ['front-down', OFFSET, OFFSET + 1]];
  for (const [name, dx, dy] of views) {
    const view = name.startsWith('front') ? 'front' : 'side';
    const B = base[`${species}/${view}`];
    const level = name === 'front' || name === 'side';
    body += `  <g inkscape:groupmode="layer" inkscape:label="${name}"${dx || dy ? ` transform="translate(${dx} ${dy})"` : ''}>\n`;
    body += guideOf(species, view, level ? '' : baseFace(B));
    body += layer('skin', level ? B.skin.map((l) => l.html).join('\n      ') : '');
    body += layer('eyes', level ? B.eyes.map((l) => l.html).join('\n      ') : '');
    for (const k of ['1', '2', '3']) body += layer(`mouth-${k}`, level ? B.mouth[k] || '' : '');
    body += layer('anchors', level ? `${circle('top', B.top)}\n      ${circle('chin', B.chin)}` : '');
    body += '  </g>\n';
  }
  writeOut(`data/faces/base/${species}.svg`, head(`<!-- Base face: ${species} (data/faces/README.md). Shared by every ${species}
     character. Top-level layers: front, side (face looks right), and
     front-up / front-down (the front face with the head raised / lowered;
     optional, empty = the level face is used). Layer offsets are ignored.
     In each: skin (painted in the character's body colour, whatever its
     colour here), eyes, mouth-1/2/3 (the pose's mouth size), anchors (top
     = top of the head, chin; character layers follow them in up/down).
     guide: locked, ignored. Units: head-units, head centre (0,0), y down. -->`, body, 2 * OFFSET + 3));
}

for (const c of C) {
  const V = charFiles[c.id];
  let body = '';
  for (const [view, dx] of [['front', 0], ['side', OFFSET]]) {
    const v = V[view];
    const B = base[`${c.species}/${view}`];
    body += `  <g inkscape:groupmode="layer" inkscape:label="${view}"${dx ? ` transform="translate(${dx} 0)"` : ''}>\n`;
    body += guideOf(c.species, view, baseFace(B));
    body += layer('back', v.back || '');
    body += layer('hair-body', v.hairBody || '');
    body += layer('under', v.under.join('\n      '));
    if (v.eyes) body += layer('eyes', v.eyes.join('\n      '));
    if (v.mouth) for (const k of ['1', '2', '3']) body += layer(`mouth-${k}`, v.mouth[k] || '');
    body += layer('over', v.over.join('\n      '));
    body += layer('anchors', circle('nape', v.nape || [0, 0.65]));
    body += '  </g>\n';
  }
  writeOut(`data/faces/${c.id}.svg`, head(`<!-- Face of ${c.id} (data/faces/README.md): the character's own parts over
     the ${c.species} base face (data/faces/base/${c.species}.svg; skin in the
     body colour from data/characters.json). Top-level layers front, side
     (offset ignored); optional front-up / front-down with their own under /
     over (else under / over follow the base's anchors).
     In each: under (behind the base face: hair behind the head…), over
     (crown, hair, beard, marks…), back (behind the whole body), hair-body
     (long hair on the back; pinned at the nape anchor), optional eyes /
     mouth-1/2/3 (replace the base's). guide: the base face and body, locked,
     ignored. Colours as drawn. Units: head-units, head centre (0,0), y down. -->`, body));
}
console.log(report.join('\n'));
