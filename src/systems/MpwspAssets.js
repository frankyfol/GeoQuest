// Loads scarloxy's MyPixelWorld Special Pack #01 (MPWSP01) into Phaser textures.
// https://scarloxy.itch.io/mpwsp01

import { TILE_CODES as T } from './MapFactory.js';

const BASE = 'assets/mpwsp01';

export const WORLD_COLS = 10;

const GRASS_FRAMES = [125, 131, 135, 146];
const PATH_FRAMES = [45, 46, 47, 48];
const WATER_FRAMES = [177, 178, 179, 180];

export function registerMpwspAssets(scene) {
  const l = scene.load;
  l.spritesheet('mpw_world', `${BASE}/tilesets/world.png`, { frameWidth: 64, frameHeight: 64 });
  l.image('mpw_sand', `${BASE}/objects/sand.png`);
  l.image('mpw_tree', `${BASE}/objects/green_tree_small.png`);
  l.image('mpw_tree_teal', `${BASE}/objects/teal_tree_small.png`);
  l.image('mpw_rock', `${BASE}/objects/grassrock1.png`);
  l.image('mpw_gate', `${BASE}/objects/gate_pillar.png`);

  const charSheet = { frameWidth: 128, frameHeight: 128 };
  l.spritesheet('mpw_player', `${BASE}/characters/player.png`, charSheet);
  l.spritesheet('mpw_ranger', `${BASE}/characters/young_guy.png`, charSheet);
  l.spritesheet('mpw_boss_water', `${BASE}/characters/water_boss.png`, charSheet);
  l.spritesheet('mpw_boss_grass', `${BASE}/characters/grass_boss.png`, charSheet);
  l.spritesheet('mpw_boss_fire', `${BASE}/characters/fire_boss.png`, charSheet);

  const monSheet = { frameWidth: 192, frameHeight: 192 };
  l.spritesheet('mpw_spirit_a', `${BASE}/monsters/Cleaf.png`, monSheet);
  l.spritesheet('mpw_spirit_b', `${BASE}/monsters/Finsta.png`, monSheet);
  l.spritesheet('mpw_spirit_c', `${BASE}/monsters/Sparchu.png`, monSheet);

  l.image('mpw_bg_forest', `${BASE}/backgrounds/forest.png`);
  l.image('mpw_bg_sand', `${BASE}/backgrounds/sand.png`);
  l.image('mpw_bg_ice', `${BASE}/backgrounds/ice.png`);
}

export function buildMpwspTextures(scene) {
  ensureGroundFrameTextures(scene);
  _cloneSheet(scene, 'mpw_player', 'hero');
  _ensureWalkAnims(scene, 'hero');

  [
    'mpw_world',
    'hero',
    'mpw_player',
    'mpw_ranger',
    'mpw_boss_water',
    'mpw_boss_grass',
    'mpw_boss_fire',
    'mpw_spirit_a',
    'mpw_spirit_b',
    'mpw_spirit_c',
    'mpw_tree',
    'mpw_tree_teal',
    'mpw_rock',
    'mpw_gate',
    'mpw_sand'
  ].forEach((k) => {
    if (scene.textures.exists(k)) {
      scene.textures.get(k).setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
  });
}

function _cloneSheet(scene, from, to) {
  if (scene.textures.exists(to)) scene.textures.remove(to);
  const src = scene.textures.get(from).getSourceImage();
  scene.textures.addSpriteSheet(to, src, { frameWidth: 128, frameHeight: 128 });
}

function _ensureWalkAnims(scene, sheetKey) {
  const dirs = [
    { name: 'down', row: 0 },
    { name: 'left', row: 1 },
    { name: 'right', row: 2 },
    { name: 'up', row: 3 }
  ];
  dirs.forEach(({ name, row }) => {
    const start = row * 4;
    const walkKey = `walk-${name}`;
    if (!scene.anims.exists(walkKey)) {
      scene.anims.create({
        key: walkKey,
        frames: scene.anims.generateFrameNumbers(sheetKey, { start, end: start + 3 }),
        frameRate: 8,
        repeat: -1
      });
    }
    const idleKey = `${name}0`;
    if (!scene.anims.exists(idleKey)) {
      scene.anims.create({
        key: idleKey,
        frames: [{ key: sheetKey, frame: start }],
        frameRate: 1
      });
    }
  });
}

export function ensureGroundFrameTextures(scene) {
  const src = scene.textures.get('mpw_world').getSourceImage();
  const all = [...new Set([...GRASS_FRAMES, ...PATH_FRAMES, ...WATER_FRAMES])];
  all.forEach((idx) => {
    const key = `mpw_world_${idx}`;
    if (scene.textures.exists(key)) return;
    const col = idx % WORLD_COLS;
    const row = Math.floor(idx / WORLD_COLS);
    const canvas = scene.textures.createCanvas(key, 64, 64);
    const ctx = canvas.getContext();
    ctx.drawImage(src, col * 64, row * 64, 64, 64, 0, 0, 64, 64);
    canvas.refresh();
  });
}

export function groundTextureKey(code, x, y) {
  const pick = (arr) => {
    const idx = arr[Math.abs((x * 92821) ^ (y * 68917)) % arr.length];
    return `mpw_world_${idx}`;
  };
  switch (code) {
    case T.PATH:
      return pick(PATH_FRAMES);
    case T.WATER:
    case T.MUD:
      return pick(WATER_FRAMES);
    case T.SAND:
      return 'mpw_sand';
    case T.TREE:
    case T.ROCK:
    default:
      return pick(GRASS_FRAMES);
  }
}

export function decorForTile(code, regionId) {
  if (code === T.TREE) {
    return regionId === 'tidewood_mangroves' ? 'mpw_tree_teal' : 'mpw_tree';
  }
  if (code === T.ROCK) return 'mpw_rock';
  return null;
}

export function spriteKeyForTrigger(trig, regionId) {
  if (trig.sprite === 'npc_ranger') return 'mpw_ranger';
  if (trig.sprite === 'npc_boss') {
    if (regionId === 'verdant_canopy') return 'mpw_boss_grass';
    if (regionId === 'tidewood_mangroves') return 'mpw_boss_fire';
    return 'mpw_boss_water';
  }
  if (trig.sprite === 'npc_spirit') {
    const spirits = ['mpw_spirit_a', 'mpw_spirit_b', 'mpw_spirit_c'];
    const h = trig.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return spirits[Math.abs(h) % spirits.length];
  }
  if (trig.sprite === 'npc_sign' || trig.sprite === 'door') return 'mpw_gate';
  return 'mpw_spirit_a';
}

export function battleBackgroundForRegion(regionId) {
  if (regionId === 'verdant_canopy') return 'mpw_bg_forest';
  if (regionId === 'tidewood_mangroves') return 'mpw_bg_ice';
  return 'mpw_bg_sand';
}

export default {
  registerMpwspAssets,
  buildMpwspTextures,
  groundTextureKey,
  decorForTile,
  ensureGroundFrameTextures,
  spriteKeyForTrigger,
  battleBackgroundForRegion
};
