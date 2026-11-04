// Small 2D geometry helpers.
// Coordinate frame: SVG-style, y points down. Units are head-units.
//
// Angle convention (degrees): an absolute angle θ is measured from
// straight DOWN, positive rotating toward FORWARD (+x, the facing
// direction). So θ=0 is down, θ=90 forward, θ=180 up, θ=-90 back.

export const RAD = Math.PI / 180;

export function dir(theta) {
  return [Math.sin(theta * RAD), Math.cos(theta * RAD)];
}

export const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const mul = (a, s) => [a[0] * s, a[1] * s];
export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// Rotate a point (in a y-down frame) clockwise by phi degrees.
export function rot(p, phi) {
  const c = Math.cos(phi * RAD), s = Math.sin(phi * RAD);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
}

// Sample a quadratic bezier p0 -> p2 with control p1 (excludes p0).
export function quad(p0, p1, p2, n = 10) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([
      u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    ]);
  }
  return out;
}

export function circlePts(c, r, n = 20) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]);
  }
  return out;
}

// Rounded rectangle centred at origin, half sizes hw/hh, corner radius r.
export function roundRectPts(hw, hh, r, n = 5) {
  const pts = [];
  const corners = [
    [hw - r, -hh + r, -90],
    [hw - r, hh - r, 0],
    [-hw + r, hh - r, 90],
    [-hw + r, -hh + r, 180],
  ];
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= n; i++) {
      const a = (a0 + (i / n) * 90) * RAD;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  }
  return pts;
}

const f = (v) => (Math.round(v * 1000) / 1000).toString();

export function pathD(pts, close = true) {
  if (!pts.length) return '';
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) d += `L${f(pts[i][0])} ${f(pts[i][1])}`;
  return close ? d + 'Z' : d;
}

export function bbox(ptsList) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const pts of ptsList) for (const [x, y] of pts) {
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return { x0, y0, x1, y1 };
}
