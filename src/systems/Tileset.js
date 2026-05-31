// Tileset.js — character utilities only.
// Terrain is rendered via MPWSP01 autotiling (see TerrainAutotile.js + AutotileCatalog.js).
// Procedural ground tiles (tile_grass, checkerboard, etc.) are no longer generated.

import Phaser from 'phaser';

export const TILE_PX = 16;

export function generateTiles(_scene) {
  // Intentionally empty — overworld uses world.png / coast.png tilemap autotiles.
}

export function generateCharacters(_scene) {
  // Characters load from MpwspAssets (mpw_player / hero sheet).
}

export default { generateTiles, generateCharacters, TILE_PX };
