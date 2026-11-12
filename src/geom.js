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
