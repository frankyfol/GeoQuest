// Procedural helpers for organic, non-rectangular overworld maps.
const T = { GRASS: 0, PATH: 1, WATER: 2, TREE: 3, ROCK: 4, SAND: 5, MUD: 6 };

export function noise2d(x, y, seed = 0) {
  const n = Math.sin((x + seed * 17) * 12.9898 + (y + seed * 31) * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function inBounds(tiles, x, y) {
  return y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length;
}

function setTile(tiles, x, y, code) {
  if (inBounds(tiles, x, y)) tiles[y][x] = code;
}

function stampDisc(tiles, cx, cy, radius, code, { clearOnly = false, allowed = null } = {}) {
  const r = Math.ceil(radius);
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if (!inBounds(tiles, x, y)) continue;
      if ((x - cx) ** 2 + (y - cy) ** 2 > radius * radius) continue;
      if (clearOnly) {
        if (allowed && allowed.has(tiles[y][x])) tiles[y][x] = T.GRASS;
      } else if (code !== null) {
        setTile(tiles, x, y, code);
      }
    }
  }
}

function bresenham(x0, y0, x1, y1) {
  const pts = [];
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;
  while (true) {
    pts.push([x, y]);
    if (x === x1 && y === y1) break;
    const e2 = err * 2;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  return pts;
}

/** Irregular island edge — trees instead of a rectangular border. */
export function applyOrganicBorder(tiles, seed = 0, margin = 0.12) {
  const h = tiles.length;
  const w = tiles[0].length;
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const rx = w * (0.48 - margin);
  const ry = h * (0.46 - margin);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      const d = nx * nx + ny * ny;
      const n = noise2d(x, y, seed) * 0.42;
      if (d > 1.05 + n) {
        tiles[y][x] = T.TREE;
      } else if (d > 0.78 + n * 0.55 && noise2d(x + 11, y + 7, seed + 3) > 0.38) {
        tiles[y][x] = T.TREE;
      }
    }
  }
}

/** Soft filled ellipse with wobbly radius (ponds, beaches, forests). */
export function stampBlob(tiles, cx, cy, radius, code, seed = 0, strength = 1) {
  const r = Math.ceil(radius) + 2;
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if (!inBounds(tiles, x, y)) continue;
      const wobble =
        1 +
        (noise2d(x, y, seed) - 0.5) * 0.35 +
        (noise2d(x * 2, y * 2, seed + 9) - 0.5) * 0.2;
      const dx = (x - cx) / (radius * wobble);
      const dy = (y - cy) / (radius * wobble * 0.92);
      if (dx * dx + dy * dy <= strength) setTile(tiles, x, y, code);
    }
  }
}

/** Sand (or other) ring around a water blob. */
export function ringBlob(tiles, cx, cy, innerR, outerR, code, seed = 0) {
  const r = Math.ceil(outerR) + 1;
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if (!inBounds(tiles, x, y)) continue;
      const wobble = 1 + (noise2d(x, y, seed) - 0.5) * 0.25;
      const dx = (x - cx) / (innerR * wobble);
      const dy = (y - cy) / (innerR * wobble * 0.9);
      const dOut = (x - cx) / (outerR * wobble);
      const dOutY = (y - cy) / (outerR * wobble * 0.9);
      const inner = dx * dx + dy * dy;
      const outer = dOut * dOut + dOutY * dOutY;
      if (outer <= 1 && inner > 1) setTile(tiles, x, y, code);
    }
  }
}

/** Curved path with variable width (not L-shaped corridors). */
export function carveOrganicPath(tiles, points, width = 2, code = T.PATH) {
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const line = bresenham(x0, y0, x1, y1);
    line.forEach(([x, y], idx) => {
      const wobble = width + (noise2d(x, y, idx + i) > 0.72 ? 1 : 0);
      stampDisc(tiles, x, y, wobble * 0.55, code);
    });
  }
  points.forEach(([x, y]) => stampDisc(tiles, x, y, width * 0.6, code));
}

/** Clear blocking tiles along a route so paths stay walkable. */
export function clearCorridor(tiles, points, radius = 2, allowed = new Set([T.TREE, T.ROCK])) {
  points.forEach(([px, py], i) => {
    const seg = i < points.length - 1 ? bresenham(px, py, points[i + 1][0], points[i + 1][1]) : [[px, py]];
    seg.forEach(([x, y]) => {
      stampDisc(tiles, x, y, radius, null, { clearOnly: true, allowed });
    });
  });
}

/** River / stream following waypoints; sandy banks on grass. */
export function paintRiver(tiles, points, width = 2, seed = 0) {
  for (let i = 0; i < points.length - 1; i++) {
    const line = bresenham(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    line.forEach(([x, y]) => {
      const w = width + (noise2d(x, y, seed + i) > 0.8 ? 0.5 : 0);
      stampDisc(tiles, x, y, w, T.WATER);
      for (let oy = -2; oy <= 2; oy++) {
        for (let ox = -2; ox <= 2; ox++) {
          const tx = x + ox;
          const ty = y + oy;
          if (!inBounds(tiles, tx, ty)) continue;
          const dist = Math.hypot(ox, oy);
          if (dist > w + 1.2 && dist < w + 2.4 && tiles[ty][tx] === T.GRASS) {
            tiles[ty][tx] = T.SAND;
          }
        }
      }
    });
  }
}

/** Dense tree clusters (forest groves, not a grid). */
export function scatterClusters(tiles, clusters, seed = 0) {
  clusters.forEach(({ cx, cy, radius, density = 0.55 }, ci) => {
    const r = Math.ceil(radius);
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (!inBounds(tiles, x, y)) continue;
        if (tiles[y][x] !== T.GRASS && tiles[y][x] !== T.PATH) continue;
        const dx = (x - cx) / radius;
        const dy = (y - cy) / radius;
        if (dx * dx + dy * dy > 1) continue;
        const n = noise2d(x, y, seed + ci * 19);
        if (n > 1 - density) {
          tiles[y][x] = n > 0.92 - density * 0.15 ? T.ROCK : T.TREE;
        }
      }
    }
  });
}

export default {
  noise2d,
  applyOrganicBorder,
  stampBlob,
  ringBlob,
  carveOrganicPath,
  clearCorridor,
  paintRiver,
  scatterClusters
};
