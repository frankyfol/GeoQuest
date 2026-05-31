/**
 * Builds Phaser tilemap indices from MapFactory logical grids.
 */
import { TILE_CODES as T } from './MapFactory.js';
import {
  TERRAIN_PRIORITY,
  coastTileIndex,
  worldBlobIndex,
  shoreTerrainForLand,
  COAST_DEEP_WATER
} from './AutotileCatalog.js';

const IS_WATER = (c) => c === T.WATER || c === T.MUD;
const IS_LAND = (c) => !IS_WATER(c) && c !== T.TREE && c !== T.ROCK;

function inBounds(tiles, x, y) {
  return y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length;
}

function getCode(tiles, x, y) {
  if (!inBounds(tiles, x, y)) return T.TREE;
  return tiles[y][x];
}

/** Land type used for autotile matching (trees/rocks keep underlying grass). */
function baseLandCode(tiles, x, y) {
  const c = getCode(tiles, x, y);
  if (c === T.TREE || c === T.ROCK) {
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nc = getCode(tiles, x + dx, y + dy);
      if (IS_LAND(nc)) return nc;
    }
    return T.GRASS;
  }
  return c;
}

function isSameTerrain(tiles, x, y, terrain) {
  if (!inBounds(tiles, x, y)) return false;
  if (IS_WATER(terrain)) return IS_WATER(getCode(tiles, x, y));
  if (IS_WATER(getCode(tiles, x, y))) return false;
  return baseLandCode(tiles, x, y) === terrain;
}

function cardinalMask(tiles, x, y, terrain) {
  const n = isSameTerrain(tiles, x, y - 1, terrain) ? 1 : 0;
  const e = isSameTerrain(tiles, x + 1, y, terrain) ? 2 : 0;
  const s = isSameTerrain(tiles, x, y + 1, terrain) ? 4 : 0;
  const w = isSameTerrain(tiles, x - 1, y, terrain) ? 8 : 0;
  return n | e | s | w;
}

function pickShoreTerrain(tiles, x, y) {
  let best = T.GRASS;
  let bestPri = -1;
  for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
    const nc = getCode(tiles, x + dx, y + dy);
    if (!IS_LAND(nc)) continue;
    const pri = TERRAIN_PRIORITY.indexOf(nc);
    if (pri > bestPri) {
      bestPri = pri;
      best = nc;
    }
  }
  return shoreTerrainForLand(best);
}

function coastSideFromLand(n, e, s, w) {
  if (n && e && s && w) return 'center';
  if (n && e && !s && !w) return 'topleft';
  if (n && w && !s && !e) return 'topright';
  if (s && e && !n && !w) return 'bottomleft';
  if (s && w && !n && !e) return 'bottomright';
  if (n && !e && !s && !w) return 'top';
  if (s && !n && !e && !w) return 'bottom';
  if (w && !n && !e && !s) return 'left';
  if (e && !n && !s && !w) return 'right';
  if (n && s && !e && !w) return 'top';
  if (e && w && !n && !s) return 'left';
  return null;
}

function pickCoastIndex(tiles, x, y) {
  const n = IS_LAND(getCode(tiles, x, y - 1));
  const e = IS_LAND(getCode(tiles, x + 1, y));
  const s = IS_LAND(getCode(tiles, x, y + 1));
  const w = IS_LAND(getCode(tiles, x - 1, y));
  const shore = pickShoreTerrain(tiles, x, y);
  const side = coastSideFromLand(n, e, s, w);

  if (!side) return COAST_DEEP_WATER;
  if (side === 'center') {
    const inner = shore === 'sand' ? 'sand_i' : 'grass_i';
    return coastTileIndex(inner, 'center');
  }
  return coastTileIndex(shore, side);
}

function pickWorldIndex(tiles, x, y) {
  const code = baseLandCode(tiles, x, y);
  if (IS_WATER(code)) return -1;
  if (code === T.TREE || code === T.ROCK) {
    const mask = cardinalMask(tiles, x, y, T.GRASS);
    return worldBlobIndex(T.GRASS, mask);
  }
  const terrain = code === T.PATH ? T.PATH : code === T.SAND ? T.SAND : T.GRASS;
  const mask = cardinalMask(tiles, x, y, terrain);
  return worldBlobIndex(terrain, mask);
}

/**
 * @returns {{ ground: number[][], water: (number|null)[][] }}
 */
export function buildTerrainTileLayers(tiles) {
  const h = tiles.length;
  const w = tiles[0].length;
  const ground = [];
  const water = [];

  for (let y = 0; y < h; y++) {
    const gRow = [];
    const wRow = [];
    for (let x = 0; x < w; x++) {
      const code = getCode(tiles, x, y);
      if (IS_WATER(code)) {
        gRow.push(worldBlobIndex(T.GRASS, 15));
        wRow.push(pickCoastIndex(tiles, x, y));
      } else {
        gRow.push(pickWorldIndex(tiles, x, y));
        wRow.push(null);
      }
    }
    ground.push(gRow);
    water.push(wRow);
  }
  return { ground, water };
}

export function isDecorTile(code) {
  return code === T.TREE || code === T.ROCK;
}

export default { buildTerrainTileLayers, isDecorTile };
