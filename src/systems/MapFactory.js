// MapFactory.js — organic, hand-tuned region layouts (no rectangular boxes).
import {
  applyOrganicBorder,
  stampBlob,
  ringBlob,
  carveOrganicPath,
  clearCorridor,
  paintRiver,
  scatterClusters
} from './MapTerrain.js';

export const TILE_CODES = {
  GRASS: 0,
  PATH: 1,
  WATER: 2,
  TREE: 3,
  ROCK: 4,
  SAND: 5,
  MUD: 6
};

export const TILE_COLORS = {
  0: 0x3f8f3f,
  1: 0xc2a866,
  2: 0x2b6cb0,
  3: 0x1f5c1f,
  4: 0x8a8d93,
  5: 0xd8c98a,
  6: 0x6b5436
};

const T = TILE_CODES;
const BLOCKING = new Set([T.WATER, T.TREE, T.ROCK, T.MUD]);

function makeGrid(w, h, fill) {
  const grid = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) row.push(fill);
    grid.push(row);
  }
  return grid;
}

function buildCollision(tiles, extraBlocked) {
  const set = new Set();
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      if (BLOCKING.has(tiles[y][x])) set.add(`${x},${y}`);
    }
  }
  if (extraBlocked) extraBlocked.forEach((k) => set.add(k));
  return set;
}

function finalize(w, h, tiles, triggers, spawn) {
  const extraBlocked = triggers
    .filter((t) => t.activate !== 'step')
    .map((t) => `${t.x},${t.y}`);
  const collision = buildCollision(tiles, extraBlocked);
  return { width: w, height: h, tiles, collision, triggers, spawn };
}

// ---- Hydro Valley --------------------------------------------------
function hydroValley() {
  const w = 34;
  const h = 22;
  const tiles = makeGrid(w, h, T.GRASS);
  const seed = 11;

  applyOrganicBorder(tiles, seed, 0.1);

  // Sandy cove + curving river to the sea (bottom-left).
  stampBlob(tiles, 7, h - 4, 5.5, T.SAND, seed + 1);
  paintRiver(
    tiles,
    [
      [5, h - 3],
      [9, h - 4],
      [13, h - 3],
      [16, h - 5],
      [20, h - 4],
      [24, h - 6]
    ],
    2,
    seed + 2
  );

  // Central pond with beach ring.
  stampBlob(tiles, 23, 9, 3.2, T.WATER, seed + 3);
  ringBlob(tiles, 23, 9, 3.4, 5.2, T.SAND, seed + 3);

  scatterClusters(
    tiles,
    [
      { cx: 8, cy: 5, radius: 4, density: 0.62 },
      { cx: 27, cy: 5, radius: 3.5, density: 0.58 },
      { cx: 29, cy: 14, radius: 3, density: 0.5 },
      { cx: 12, cy: 15, radius: 2.5, density: 0.45 }
    ],
    seed + 4
  );

  const route = [
    [6, 19],
    [6, 16],
    [9, 15],
    [12, 13],
    [11, 10],
    [14, 8],
    [17, 9],
    [21, 10],
    [24, 9],
    [27, 7],
    [29, 11],
    [30, 16]
  ];
  carveOrganicPath(tiles, route, 2.2, T.PATH);
  clearCorridor(tiles, route, 2.4);

  const triggers = [
    { x: 7, y: 17, type: 'dialogue', id: 'hv_intro_ranger', activate: 'talk', sprite: 'npc_ranger', label: 'Ranger May' },
    { x: 5, y: 13, type: 'dialogue', id: 'hv_sign_path', activate: 'talk', sprite: 'npc_sign', label: 'Sign' },
    { x: 10, y: 14, type: 'encounter', id: 'hv_evaporation', activate: 'talk', sprite: 'npc_spirit', label: 'Cloud Spirit' },
    { x: 14, y: 7, type: 'encounter', id: 'hv_condensation', activate: 'talk', sprite: 'npc_spirit', label: 'Cloud Spirit' },
    { x: 18, y: 8, type: 'encounter', id: 'hv_precipitation', activate: 'talk', sprite: 'npc_spirit', label: 'Cloud Spirit' },
    { x: 22, y: 10, type: 'encounter', id: 'hv_infiltration', activate: 'talk', sprite: 'npc_spirit', label: 'Earth Spirit' },
    { x: 25, y: 9, type: 'encounter', id: 'hv_runoff', activate: 'talk', sprite: 'npc_spirit', label: 'River Spirit' },
    { x: 28, y: 7, type: 'encounter', id: 'hv_boss_flood', activate: 'talk', sprite: 'npc_boss', label: 'Floodmaster' },
    { x: 30, y: 15, type: 'door', id: 'hv_door_locked', target: 'verdant_canopy', activate: 'talk', sprite: 'door', label: 'Gate' }
  ];

  const spawn = { x: 6, y: 19, facing: 'up' };
  return finalize(w, h, tiles, triggers, spawn);
}

// ---- Verdant Canopy ------------------------------------------------
function verdantCanopy() {
  const w = 32;
  const h = 22;
  const tiles = makeGrid(w, h, T.GRASS);
  const seed = 22;

  applyOrganicBorder(tiles, seed, 0.08);

  // Misty pool + fern grove clusters.
  stampBlob(tiles, 20, 11, 2.8, T.WATER, seed + 1);
  ringBlob(tiles, 20, 11, 3, 4.5, T.MUD, seed + 1);

  scatterClusters(
    tiles,
    [
      { cx: 9, cy: 6, radius: 5, density: 0.7 },
      { cx: 16, cy: 4, radius: 4, density: 0.65 },
      { cx: 24, cy: 8, radius: 4.5, density: 0.68 },
      { cx: 11, cy: 14, radius: 3.5, density: 0.6 },
      { cx: 26, cy: 15, radius: 3, density: 0.55 }
    ],
    seed + 2
  );

  const route = [
    [5, 19],
    [5, 15],
    [8, 14],
    [11, 11],
    [10, 8],
    [14, 6],
    [18, 7],
    [22, 9],
    [25, 12],
    [27, 17]
  ];
  carveOrganicPath(tiles, route, 2, T.PATH);
  clearCorridor(tiles, route, 2.3);

  const triggers = [
    { x: 6, y: 17, type: 'dialogue', id: 'vc_intro_ranger', activate: 'talk', sprite: 'npc_ranger', label: 'Ranger Tan' },
    { x: 11, y: 10, type: 'encounter', id: 'vc_structure', activate: 'talk', sprite: 'npc_spirit', label: 'Forest Spirit' },
    { x: 15, y: 6, type: 'encounter', id: 'vc_adaptations', activate: 'talk', sprite: 'npc_spirit', label: 'Forest Spirit' },
    { x: 23, y: 9, type: 'encounter', id: 'vc_boss_deforestation', activate: 'talk', sprite: 'npc_boss', label: 'Clearcutter' },
    { x: 27, y: 16, type: 'door', id: 'vc_door_locked', target: 'tidewood_mangroves', activate: 'talk', sprite: 'door', label: 'Gate' },
    { x: 4, y: 19, type: 'door', id: null, target: 'hydro_valley', activate: 'talk', sprite: 'door', label: 'Back' }
  ];

  const spawn = { x: 5, y: 19, facing: 'up' };
  return finalize(w, h, tiles, triggers, spawn);
}

// ---- Tidewood Mangroves --------------------------------------------
function tidewoodMangroves() {
  const w = 32;
  const h = 22;
  const tiles = makeGrid(w, h, T.SAND);
  const seed = 33;

  applyOrganicBorder(tiles, seed, 0.09);

  // Tidal lagoon (irregular, not a straight strip).
  stampBlob(tiles, 10, h - 4, 6, T.WATER, seed + 1);
  stampBlob(tiles, 22, h - 5, 4.5, T.WATER, seed + 2);
  ringBlob(tiles, 10, h - 4, 6.2, 8, T.MUD, seed + 1);
  paintRiver(
    tiles,
    [
      [6, h - 5],
      [14, h - 6],
      [20, h - 5],
      [26, h - 7]
    ],
    1.8,
    seed + 3
  );

  // Inland grass clearing.
  stampBlob(tiles, 18, 10, 5, T.GRASS, seed + 4);
  stampBlob(tiles, 12, 8, 3.5, T.GRASS, seed + 5);

  scatterClusters(
    tiles,
    [
      { cx: 8, cy: 6, radius: 3, density: 0.5 },
      { cx: 25, cy: 7, radius: 3.5, density: 0.52 },
      { cx: 15, cy: 16, radius: 2.5, density: 0.48 }
    ],
    seed + 6
  );

  const route = [
    [5, 18],
    [5, 14],
    [9, 13],
    [13, 11],
    [16, 9],
    [19, 7],
    [23, 8],
    [26, 11],
    [28, 15]
  ];
  carveOrganicPath(tiles, route, 2, T.PATH);
  clearCorridor(tiles, route, 2.3);

  const triggers = [
    { x: 6, y: 16, type: 'dialogue', id: 'tm_intro_ranger', activate: 'talk', sprite: 'npc_ranger', label: 'Ranger Siti' },
    { x: 13, y: 10, type: 'encounter', id: 'tm_adaptations', activate: 'talk', sprite: 'npc_spirit', label: 'Mangrove Spirit' },
    { x: 18, y: 8, type: 'encounter', id: 'tm_value', activate: 'talk', sprite: 'npc_spirit', label: 'Villager' },
    { x: 25, y: 9, type: 'encounter', id: 'tm_boss_storm', activate: 'talk', sprite: 'npc_boss', label: 'Storm Surge' },
    { x: 4, y: 18, type: 'door', id: null, target: 'verdant_canopy', activate: 'talk', sprite: 'door', label: 'Back' }
  ];

  const spawn = { x: 5, y: 18, facing: 'up' };
  return finalize(w, h, tiles, triggers, spawn);
}

const BUILDERS = {
  hydro_valley: hydroValley,
  verdant_canopy: verdantCanopy,
  tidewood_mangroves: tidewoodMangroves
};

export function buildMap(regionId) {
  const builder = BUILDERS[regionId] || hydroValley;
  return builder();
}

export default { buildMap, TILE_CODES, TILE_COLORS };
