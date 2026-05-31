/**
 * MPWSP01 autotile indices (16×16). See docs/AUTOTILE_MAPPING.md.
 */
import { TILE_CODES as T } from './MapFactory.js';

export const TILE_PX = 16;
export const WORLD_COLS = 40;
export const WORLD_ROWS = 84;
export const COAST_COLS = 96;
export const COAST_ROWS = 48;

/** Lower number = drawn earlier / lower priority when blending. */
export const TERRAIN_PRIORITY = [T.WATER, T.SAND, T.GRASS, T.PATH, T.MUD];

export const COAST_TERRAIN = {
  grass: 0,
  grass_i: 1,
  sand_i: 2,
  sand: 3,
  rock: 4,
  rock_i: 5,
  ice: 6,
  ice_i: 7
};

export const COAST_SIDES = {
  topleft: [0, 0],
  top: [1, 0],
  topright: [2, 0],
  left: [0, 1],
  right: [2, 1],
  bottomleft: [0, 2],
  bottom: [1, 2],
  bottomright: [2, 2],
  center: [1, 1]
};

/** 4×4 blob positions for cardinal bitmask N=1,E=2,S=4,W=8 (RPG Maker–style). */
export const BLOB16 = [
  12, 13, 14, 15,
   8,  9, 10, 11,
   4,  5,  6,  7,
   0,  1,  2,  3
];

/** 16px top-left of each land wang blob in world.png */
export const WORLD_BLOB_ORIGIN = {
  [T.SAND]: { col: 0, row: 0 },
  [T.PATH]: { col: 12, row: 0 },
  [T.GRASS]: { col: 0, row: 48 }
};

/** Open-water fill (deep) on coast.png */
export const COAST_DEEP_WATER = 9 * COAST_COLS + 12;

export function coastTileIndex(terrainKey, side, animRow = 0) {
  const t = COAST_TERRAIN[terrainKey] ?? COAST_TERRAIN.grass;
  const sideDef = COAST_SIDES[side] ?? COAST_SIDES.center;
  const col = t * 3 + sideDef[0];
  const row = sideDef[1] + animRow * 3;
  return row * COAST_COLS + col;
}

export function worldBlobIndex(terrainCode, cardinalMask) {
  const origin = WORLD_BLOB_ORIGIN[terrainCode] ?? WORLD_BLOB_ORIGIN[T.GRASS];
  const local = BLOB16[cardinalMask & 15];
  const lx = local % 4;
  const ly = (local / 4) | 0;
  return (origin.row + ly) * WORLD_COLS + (origin.col + lx);
}

export function shoreTerrainForLand(code) {
  if (code === T.SAND) return 'sand';
  if (code === T.PATH) return 'rock';
  return 'grass';
}

export default {
  TILE_PX,
  WORLD_COLS,
  COAST_COLS,
  TERRAIN_PRIORITY,
  coastTileIndex,
  worldBlobIndex,
  shoreTerrainForLand,
  COAST_DEEP_WATER
};
