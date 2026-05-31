// MapFactory.js
// Hand-authored, code-generated maps for each region (no Tiled files needed).
// Each map returns: { width, height, tiles[][], collision Set, triggers[], spawn }.
//
// Tile codes: 0 grass, 1 path/dirt, 2 water (block), 3 tree (block),
//             4 rock (block), 5 sand, 6 mud (block-ish water look)

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

const BLOCKING = new Set([2, 3, 4, 6]);

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

// Carve a horizontal-then-vertical path between waypoints.
function carvePath(tiles, points, code = TILE_CODES.PATH) {
  for (let i = 0; i < points.length - 1; i++) {
    let [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    while (x0 !== x1) {
      tiles[y0][x0] = code;
      x0 += x1 > x0 ? 1 : -1;
    }
    while (y0 !== y1) {
      tiles[y0][x0] = code;
      y0 += y1 > y0 ? 1 : -1;
    }
    tiles[y1][x1] = code;
  }
}

// Add a small pond: a water core with a sandy shoreline rim, only overwriting
// plain grass so it never blocks a path or NPC.
function addPond(tiles, x0, y0, w, h) {
  for (let y = y0 - 1; y <= y0 + h; y++) {
    for (let x = x0 - 1; x <= x0 + w; x++) {
      if (tiles[y] && tiles[y][x] === TILE_CODES.GRASS) tiles[y][x] = TILE_CODES.SAND;
    }
  }
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      if (tiles[y] && tiles[y][x] !== undefined) tiles[y][x] = TILE_CODES.WATER;
    }
  }
}

function borderTrees(tiles, code = TILE_CODES.TREE) {
  const h = tiles.length;
  const w = tiles[0].length;
  for (let x = 0; x < w; x++) {
    tiles[0][x] = code;
    tiles[h - 1][x] = code;
  }
  for (let y = 0; y < h; y++) {
    tiles[y][0] = code;
    tiles[y][w - 1] = code;
  }
}

// ---- Hydro Valley --------------------------------------------------
function hydroValley() {
  const w = 26;
  const h = 16;
  const tiles = makeGrid(w, h, TILE_CODES.GRASS);
  borderTrees(tiles);

  // A river along the bottom for flavour.
  for (let x = 1; x < w - 1; x++) {
    tiles[h - 2][x] = TILE_CODES.WATER;
  }
  // sandy bank above the river
  for (let x = 1; x < w - 1; x++) {
    tiles[h - 3][x] = TILE_CODES.SAND;
  }

  // Winding main path the player follows.
  const path = [
    [3, 12],
    [3, 7],
    [7, 7],
    [7, 4],
    [12, 4],
    [12, 9],
    [17, 9],
    [17, 4],
    [22, 4],
    [22, 11]
  ];
  carvePath(tiles, path);

  // Scattered decorative trees/rocks (non-blocking grass already).
  const decos = [
    [5, 10, TILE_CODES.TREE],
    [9, 11, TILE_CODES.TREE],
    [14, 6, TILE_CODES.ROCK],
    [19, 11, TILE_CODES.TREE],
    [10, 2, TILE_CODES.TREE],
    [20, 7, TILE_CODES.ROCK]
  ];
  decos.forEach(([x, y, c]) => {
    tiles[y][x] = c;
  });

  // A calm decorative pond with a sandy shore.
  addPond(tiles, 15, 11, 3, 2);

  const triggers = [
    { x: 4, y: 11, type: 'dialogue', id: 'hv_intro_ranger', activate: 'talk', sprite: 'npc_ranger', label: 'Ranger May' },
    { x: 2, y: 9, type: 'dialogue', id: 'hv_sign_path', activate: 'talk', sprite: 'npc_sign', label: 'Sign' },
    { x: 6, y: 7, type: 'encounter', id: 'hv_evaporation', activate: 'talk', sprite: 'npc_spirit', label: 'Cloud Spirit' },
    { x: 7, y: 3, type: 'encounter', id: 'hv_condensation', activate: 'talk', sprite: 'npc_spirit', label: 'Cloud Spirit' },
    { x: 13, y: 4, type: 'encounter', id: 'hv_precipitation', activate: 'talk', sprite: 'npc_spirit', label: 'Cloud Spirit' },
    { x: 12, y: 10, type: 'encounter', id: 'hv_infiltration', activate: 'talk', sprite: 'npc_spirit', label: 'Earth Spirit' },
    { x: 18, y: 9, type: 'encounter', id: 'hv_runoff', activate: 'talk', sprite: 'npc_spirit', label: 'River Spirit' },
    { x: 23, y: 4, type: 'encounter', id: 'hv_boss_flood', activate: 'talk', sprite: 'npc_boss', label: 'Floodmaster' },
    { x: 22, y: 12, type: 'door', id: 'hv_door_locked', target: 'verdant_canopy', activate: 'talk', sprite: 'door', label: 'Gate' }
  ];

  // Spawn the player on the path near the start.
  const spawn = { x: 3, y: 12, facing: 'up' };

  return finalize(w, h, tiles, triggers, spawn);
}

// ---- Verdant Canopy ------------------------------------------------
function verdantCanopy() {
  const w = 24;
  const h = 16;
  const tiles = makeGrid(w, h, TILE_CODES.GRASS);
  borderTrees(tiles);

  // Dense forest patches.
  const forest = [
    [4, 4], [4, 5], [5, 4], [9, 6], [9, 7], [14, 4], [15, 4],
    [18, 8], [6, 11], [11, 11], [16, 11], [20, 5]
  ];
  forest.forEach(([x, y]) => (tiles[y][x] = TILE_CODES.TREE));

  const path = [
    [3, 12],
    [3, 8],
    [8, 8],
    [8, 4],
    [13, 4],
    [13, 9],
    [19, 9],
    [19, 12]
  ];
  carvePath(tiles, path);

  const triggers = [
    { x: 4, y: 11, type: 'dialogue', id: 'vc_intro_ranger', activate: 'talk', sprite: 'npc_ranger', label: 'Ranger Tan' },
    { x: 8, y: 5, type: 'encounter', id: 'vc_structure', activate: 'talk', sprite: 'npc_spirit', label: 'Forest Spirit' },
    { x: 14, y: 4, type: 'encounter', id: 'vc_adaptations', activate: 'talk', sprite: 'npc_spirit', label: 'Forest Spirit' },
    { x: 13, y: 8, type: 'encounter', id: 'vc_boss_deforestation', activate: 'talk', sprite: 'npc_boss', label: 'Clearcutter' },
    { x: 19, y: 13, type: 'door', id: 'vc_door_locked', target: 'tidewood_mangroves', activate: 'talk', sprite: 'door', label: 'Gate' },
    { x: 2, y: 13, type: 'door', id: null, target: 'hydro_valley', activate: 'talk', sprite: 'door', label: 'Back' }
  ];

  const spawn = { x: 3, y: 12, facing: 'up' };
  return finalize(w, h, tiles, triggers, spawn);
}

// ---- Tidewood Mangroves --------------------------------------------
function tidewoodMangroves() {
  const w = 24;
  const h = 16;
  const tiles = makeGrid(w, h, TILE_CODES.SAND);
  borderTrees(tiles);

  // Water and mud around the edges (the tidal coast).
  for (let x = 1; x < w - 1; x++) {
    tiles[h - 2][x] = TILE_CODES.WATER;
    tiles[h - 3][x] = TILE_CODES.MUD;
  }
  const muds = [[5, 5], [6, 5], [10, 7], [15, 6], [16, 6], [19, 9], [4, 9]];
  muds.forEach(([x, y]) => (tiles[y][x] = TILE_CODES.MUD));

  const path = [
    [3, 11],
    [3, 7],
    [8, 7],
    [8, 4],
    [13, 4],
    [13, 9],
    [18, 9],
    [18, 5]
  ];
  carvePath(tiles, path);

  const triggers = [
    { x: 4, y: 10, type: 'dialogue', id: 'tm_intro_ranger', activate: 'talk', sprite: 'npc_ranger', label: 'Ranger Siti' },
    { x: 8, y: 5, type: 'encounter', id: 'tm_adaptations', activate: 'talk', sprite: 'npc_spirit', label: 'Mangrove Spirit' },
    { x: 13, y: 5, type: 'encounter', id: 'tm_value', activate: 'talk', sprite: 'npc_spirit', label: 'Villager' },
    { x: 18, y: 6, type: 'encounter', id: 'tm_boss_storm', activate: 'talk', sprite: 'npc_boss', label: 'Storm Surge' },
    { x: 2, y: 12, type: 'door', id: null, target: 'verdant_canopy', activate: 'talk', sprite: 'door', label: 'Back' }
  ];

  const spawn = { x: 3, y: 11, facing: 'up' };
  return finalize(w, h, tiles, triggers, spawn);
}

function finalize(w, h, tiles, triggers, spawn) {
  // Trigger tiles themselves block walking (you talk from an adjacent tile),
  // except step triggers which must be walkable.
  const extraBlocked = triggers
    .filter((t) => t.activate !== 'step')
    .map((t) => `${t.x},${t.y}`);
  const collision = buildCollision(tiles, extraBlocked);
  return { width: w, height: h, tiles, collision, triggers, spawn };
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
