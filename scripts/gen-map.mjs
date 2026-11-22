// Generates src/data/nepalMap.generated.ts — simplified SVG paths for Nepal's 7 provinces.
//
// Source: the `nepali-geo-pro-max` package (MIT), which ships the official post-May-2020
// "चुच्चे" boundary of Nepal (includes Kalapani, Lipulekh and Limpiyadhura in Darchula).
// We read the package's data file as TEXT and parse the embedded JSON literal; we never
// execute the package's code.
//
// Run: node scripts/gen-map.mjs   (output is committed, so this only needs re-running when
// the source data or the simplification settings change)

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcFile = resolve(root, 'node_modules/nepali-geo-pro-max/dist/geo/provinces.js');
const text = readFileSync(srcFile, 'utf8');
const marker = 'NEPAL_PROVINCES_GEO = ';
const start = text.indexOf(marker);
if (start < 0) throw new Error('province data literal not found');
// Find the matching closing brace of the JSON literal.
let i = start + marker.length, depth = 0, end = -1, inStr = false;
for (let k = i; k < text.length; k++) {
  const ch = text[k];
  if (inStr) { if (ch === '\\') k++; else if (ch === '"') inStr = false; continue; }
  if (ch === '"') inStr = true;
  else if (ch === '{') depth++;
  else if (ch === '}') { depth--; if (depth === 0) { end = k + 1; break; } }
}
const geo = JSON.parse(text.slice(i, end));

// --- projection: equirectangular, longitude scaled by cos(mean latitude) ---
const LAT0 = 28.3, kx = Math.cos((LAT0 * Math.PI) / 180);
const allPts = geo.features.flatMap((f) => f.geometry.coordinates.flat(2));
const minLon = Math.min(...allPts.map((p) => p[0])), maxLon = Math.max(...allPts.map((p) => p[0]));
const minLat = Math.min(...allPts.map((p) => p[1])), maxLat = Math.max(...allPts.map((p) => p[1]));
const W = 1000, PAD = 12;
const scale = (W - 2 * PAD) / ((maxLon - minLon) * kx);
const H = Math.round((maxLat - minLat) * scale + 2 * PAD);
const project = ([lon, lat]) => [PAD + (lon - minLon) * kx * scale, PAD + (maxLat - lat) * scale];

// --- Douglas–Peucker simplification ---
function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    let maxD = 0, idx = -1;
    for (let k = a + 1; k < b; k++) {
      const d = Math.abs(dy * pts[k][0] - dx * pts[k][1] + bx * ay - by * ax) / len;
      if (d > maxD) { maxD = d; idx = k; }
    }
    if (maxD > tol) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, k) => keep[k]);
}
// Closed rings start and end on the same point, which defeats DP; split at the farthest vertex.
function dpRing(ring, tol) {
  const pts = ring.slice(0, -1);
  let far = 0, best = -1;
  for (let k = 1; k < pts.length; k++) {
    const d = Math.hypot(pts[k][0] - pts[0][0], pts[k][1] - pts[0][1]);
    if (d > best) { best = d; far = k; }
  }
  const a = dp(pts.slice(0, far + 1), tol), b = dp([...pts.slice(far), pts[0]], tol);
  return [...a, ...b.slice(1, -1)];
}
const area = (r) => Math.abs(r.reduce((s, p, k) => { const q = r[(k + 1) % r.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);
const centroid = (r) => {
  let a = 0, cx = 0, cy = 0;
  for (let k = 0; k < r.length; k++) {
    const p = r[k], q = r[(k + 1) % r.length], c = p[0] * q[1] - q[0] * p[1];
    a += c; cx += (p[0] + q[0]) * c; cy += (p[1] + q[1]) * c;
  }
  return [cx / (3 * a), cy / (3 * a)];
};

// Each province in the source is a MultiPolygon of its DISTRICTS. Dissolve them into one
// outline: shared district borders appear twice in opposite directions, so cancel those
// edges and chain what remains into rings.
function signedArea(r) {
  let s = 0;
  for (let i = 0; i < r.length - 1; i++) s += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1];
  return s / 2;
}
function dissolve(rawPolys) {
  const k = (p) => `${p[0]},${p[1]}`;
  // Snap to ~100 m so near-identical vertices from neighbouring districts coincide.
  const snap = (v) => Math.round(v * 1000) / 1000;
  const polys = rawPolys.map((poly) => poly.map((ring) => ring.map(([x, y]) => [snap(x), snap(y)])
    .filter((p, i, a) => i === 0 || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]))
    // Normalise winding (counter-clockwise) — the source mixes orientations, which stops
    // shared borders from cancelling.
    .map((ring) => (signedArea(ring) < 0 ? ring.slice().reverse() : ring)));
  // Fix T-junctions first: if a vertex of one district lies on an edge of its neighbour,
  // split that edge there so the shared border has identical vertices on both sides.
  const verts = [...new Map(polys.flatMap((poly) => poly.flat()).map((p) => [k(p), p])).values()];
  const splitEdge = (a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], len2 = dx * dx + dy * dy;
    if (!len2) return [a, b];
    const on = [];
    for (const v of verts) {
      const t = ((v[0] - a[0]) * dx + (v[1] - a[1]) * dy) / len2;
      if (t <= 1e-9 || t >= 1 - 1e-9) continue;
      const cross = (v[0] - a[0]) * dy - (v[1] - a[1]) * dx;
      if (Math.abs(cross) / Math.sqrt(len2) < 2e-4) on.push([t, v]);
    }
    return [a, ...on.sort((x, y) => x[0] - y[0]).map((x) => x[1]), b];
  };
  const edges = new Map(); // "a>b" -> [a, b]
  for (const poly of polys) for (const ring of poly) {
    for (let i = 0; i < ring.length - 1; i++) {
      const pts = splitEdge(ring[i], ring[i + 1]);
      for (let j = 0; j < pts.length - 1; j++) edges.set(`${k(pts[j])}>${k(pts[j + 1])}`, [pts[j], pts[j + 1]]);
    }
  }
  const next = new Map(); // start point -> list of edges
  for (const [key, [a, b]] of edges) {
    if (edges.has(`${k(b)}>${k(a)}`)) continue; // internal border
    if (!next.has(k(a))) next.set(k(a), []);
    next.get(k(a)).push([a, b]);
  }
  const rings = [];
  for (const [start, list] of next) {
    while (list.length) {
      const ring = [];
      let [a, b] = list.pop();
      ring.push(a);
      let guard = 0;
      while (k(b) !== start && guard++ < 100000) {
        ring.push(b);
        const cand = next.get(k(b));
        if (!cand || !cand.length) break;
        [a, b] = cand.pop();
      }
      ring.push(ring[0]);
      rings.push(ring);
    }
  }
  return rings;
}

const toD = (rings) => rings.map((r) => 'M' + r.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L') + 'Z').join('');
const out = {};
for (const f of geo.features) {
  const id = f.properties.id; // P1..P7
  const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
  // Fill: the district polygons themselves (they tile the province exactly — no gaps).
  const fill = polys.map((p) => dpRing(p[0].map(project), 0.9)).filter((r) => r.length > 3);
  // Border: the dissolved outline. T-junctions in the source leave tiny slivers; keep the main ring.
  const outline = dissolve(polys)
    .map((r) => dpRing(r.map(project), 0.9))
    .filter((r) => r.length > 3)
    .sort((a, b) => area(b) - area(a))
    .slice(0, 1);
  const [cx, cy] = centroid(outline[0]);
  out[id] = { fill: toD(fill), line: toD(outline), cx: +cx.toFixed(1), cy: +cy.toFixed(1), points: fill.reduce((s, r) => s + r.length, 0) + outline[0].length };
}

// Places we pin on the map (lon, lat).
const places = {
  kathmandu: [85.324, 27.7172],
  everest: [86.925, 27.9881],
  lumbini: [83.276, 27.4833],
  biratnagar: [87.2718, 26.4525],
  janakpur: [85.9263, 26.7288],
  hetauda: [85.0322, 27.4284],
  pokhara: [83.9856, 28.2096],
  deukhuri: [82.55, 27.92],
  birendranagar: [81.6339, 28.6019],
  godawari: [80.62, 28.88],
  limpiyadhura: [80.6, 30.42],
};
const placeXY = Object.fromEntries(Object.entries(places).map(([k, v]) => { const [x, y] = project(v); return [k, [+x.toFixed(1), +y.toFixed(1)]]; }));

const header = `// AUTO-GENERATED by scripts/gen-map.mjs — do not edit by hand.
// Province outlines: official post-2020 (चुच्चे) boundary via the MIT-licensed
// "nepali-geo-pro-max" package. Simplified for display; not for surveying.\n`;
writeFileSync(
  resolve(root, 'src/data/nepalMap.generated.ts'),
  header +
    `export const MAP_W = ${W};\nexport const MAP_H = ${H};\n` +
    `export const PROVINCE_SHAPES: Record<string, { fill: string; line: string; cx: number; cy: number }> = ${JSON.stringify(
      Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { fill: v.fill, line: v.line, cx: v.cx, cy: v.cy }])),
    )};\n` +
    `export const PLACE_XY: Record<string, [number, number]> = ${JSON.stringify(placeXY)};\n`,
);
console.log(`map: ${W}x${H}`, Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.points])));
