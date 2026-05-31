// Tileset.js
// Generates all in-game art at runtime as crisp 16x16 pixel-art textures
// (tiles) and character sprites — no binary image assets required. The look
// targets a GBA-era top-down RPG: textured grass, bushy trees, water with a
// shoreline, sandy paths, flowers, and outlined chibi characters.
import Phaser from 'phaser';

// --- tiny pixel helpers --------------------------------------------------
const R = (g, c, x, y, w = 1, h = 1) => {
  g.fillStyle(c, 1);
  g.fillRect(x, y, w, h);
};
const RA = (g, c, a, x, y, w = 1, h = 1) => {
  g.fillStyle(c, a);
  g.fillRect(x, y, w, h);
};

// Seeded RNG so tile noise is deterministic and reproducible.
function mulberry(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tex(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

// ========================================================================
//  TILES
// ========================================================================
function drawGrass(g, seed) {
  R(g, 0x57a64a, 0, 0, 16, 16);
  // faint horizontal banding for depth
  for (let y = 0; y < 16; y++) if (y % 4 === 1) RA(g, 0x4f9a42, 0.4, 0, y, 16, 1);
  const rnd = mulberry(seed);
  // speckle noise
  for (let i = 0; i < 26; i++) {
    const x = (rnd() * 16) | 0;
    const y = (rnd() * 16) | 0;
    R(g, rnd() < 0.5 ? 0x65b855 : 0x4b9540, x, y);
  }
  // a few grass blades / tufts
  for (let i = 0; i < 3; i++) {
    const x = 2 + ((rnd() * 12) | 0);
    const y = 5 + ((rnd() * 7) | 0);
    R(g, 0x3f8a39, x, y, 1, 2);
    R(g, 0x7cc96a, x + 1, y - 1, 1, 2);
  }
}

function drawPath(g) {
  R(g, 0xcaa66a, 0, 0, 16, 16);
  const rnd = mulberry(99);
  for (let i = 0; i < 30; i++) {
    const x = (rnd() * 16) | 0;
    const y = (rnd() * 16) | 0;
    R(g, rnd() < 0.5 ? 0xb8915a : 0xd9b878, x, y);
  }
  // a couple of little pebbles
  R(g, 0x9c7a48, 4, 6, 2, 1);
  R(g, 0x9c7a48, 11, 11, 2, 1);
}

function drawSand(g) {
  R(g, 0xe7d6a0, 0, 0, 16, 16);
  const rnd = mulberry(7);
  for (let i = 0; i < 22; i++) {
    const x = (rnd() * 16) | 0;
    const y = (rnd() * 16) | 0;
    R(g, rnd() < 0.5 ? 0xd6c184 : 0xf2e6bb, x, y);
  }
}

function drawWater(g) {
  R(g, 0x3f86cf, 0, 0, 16, 16);
  // lighter near top
  RA(g, 0x4f97df, 0.6, 0, 0, 16, 7);
  // darker near bottom
  RA(g, 0x2f6fb6, 0.5, 0, 11, 16, 5);
  // shimmer waves
  [2, 3, 8, 9, 10].forEach((x) => R(g, 0xa8cef0, x, 5));
  [5, 6, 12, 13].forEach((x) => R(g, 0x9cc7ef, x, 11));
}

function drawMud(g) {
  R(g, 0x6f5638, 0, 0, 16, 16);
  const rnd = mulberry(13);
  for (let i = 0; i < 20; i++) {
    const x = (rnd() * 16) | 0;
    const y = (rnd() * 16) | 0;
    R(g, rnd() < 0.5 ? 0x5d472d : 0x836546, x, y);
  }
  RA(g, 0x9fb6c8, 0.25, 3, 4, 4, 2);
  RA(g, 0x9fb6c8, 0.2, 9, 9, 4, 2);
}

function drawTree(g) {
  RA(g, 0x000000, 0.22, 3, 13, 10, 3); // ground shadow
  R(g, 0x6b4a2c, 7, 10, 2, 5); // trunk
  R(g, 0x553a22, 7, 10, 1, 5);
  // bushy canopy
  g.fillStyle(0x1f5a2a, 1); g.fillCircle(8, 7, 7);
  g.fillStyle(0x2f7d3a, 1); g.fillCircle(8, 7, 6);
  g.fillStyle(0x3f9a47, 1); g.fillCircle(5.5, 6, 3); g.fillCircle(10.5, 8, 3); g.fillCircle(9, 4, 2.5);
  g.fillStyle(0x63c266, 1); g.fillCircle(5.5, 5, 1.6); g.fillCircle(9, 7, 1.4);
}

function drawRock(g) {
  RA(g, 0x000000, 0.2, 3, 12, 10, 3);
  g.fillStyle(0x4c5159, 1); g.fillCircle(8, 9, 6);
  g.fillStyle(0x868c95, 1); g.fillCircle(8, 9, 5);
  g.fillStyle(0xa9aeb6, 1); g.fillCircle(6, 7, 2);
}

function drawFlower(g) {
  const flower = (cx, cy, col) => {
    R(g, col, cx, cy - 1);
    R(g, col, cx - 1, cy);
    R(g, col, cx + 1, cy);
    R(g, col, cx, cy + 1);
    R(g, 0xffe14d, cx, cy);
  };
  flower(4, 9, 0xff5d6c);
  flower(11, 5, 0xfdfdfd);
  flower(12, 12, 0xffd23f);
  R(g, 0x3f8a39, 7, 12, 1, 2);
}

export function generateTiles(scene) {
  tex(scene, 'tile_grass', 16, 16, (g) => drawGrass(g, 1));
  tex(scene, 'tile_grass2', 16, 16, (g) => drawGrass(g, 42));
  tex(scene, 'tile_grass3', 16, 16, (g) => drawGrass(g, 777));
  tex(scene, 'tile_path', 16, 16, drawPath);
  tex(scene, 'tile_sand', 16, 16, drawSand);
  tex(scene, 'tile_water', 16, 16, drawWater);
  tex(scene, 'tile_mud', 16, 16, drawMud);
  tex(scene, 'tile_tree', 16, 16, drawTree);
  tex(scene, 'tile_rock', 16, 16, drawRock);
  tex(scene, 'tile_flower', 16, 16, drawFlower);
}

// ========================================================================
//  CHARACTERS
// ========================================================================
const HERO_PAL = { hat: 0xe5403b, hatO: 0xb22d2a, shirt: 0x3f78c4, shirtO: 0x2c5790, pants: 0x35507a, skin: 0xf1c693, hair: 0x6e4a2c };
const RANGER_PAL = { hat: 0x8a6a3a, hatO: 0x6e5430, shirt: 0x3aa05a, shirtO: 0x2c7d46, pants: 0x5a4632, skin: 0xf1c693, hair: 0x3a2a1a };
const VILLAGER_PAL = { hat: 0xcf5aa0, hatO: 0xa83f80, shirt: 0xe0b341, shirtO: 0xc0972f, pants: 0x6a5b8a, skin: 0xf3cfa6, hair: 0x4a3326 };
const OUT = 0x222633;
const EYE = 0x222633;

// Draws a 16x16 outlined chibi person at x-offset `ox`.
function personFrame(g, ox, dir, step, pal) {
  RA(g, 0x000000, 0.22, ox + 4, 14, 8, 2); // shadow

  // outline blocks
  R(g, OUT, ox + 3, 2, 10, 7); // head+hat
  R(g, OUT, ox + 3, 8, 10, 5); // body
  R(g, OUT, ox + 4, 13, 8, 3); // legs base

  // hat
  R(g, pal.hat, ox + 4, 3, 8, 2);
  R(g, pal.hatO, ox + 4, 4, 8, 1);
  // face
  R(g, pal.skin, ox + 4, 5, 8, 3);
  // body / shirt
  R(g, pal.shirt, ox + 4, 9, 8, 3);
  R(g, pal.shirtO, ox + 4, 12, 8, 1);
  // arms
  R(g, pal.skin, ox + 3, 9, 1, 3);
  R(g, pal.skin, ox + 12, 9, 1, 3);

  // legs (step controls stride)
  const lx = step === 1 ? ox + 4 : ox + 5;
  const rx = step === 1 ? ox + 10 : ox + 9;
  R(g, pal.pants, lx, 13, 2, 2);
  R(g, pal.pants, rx, 13, 2, 2);
  R(g, 0x20242e, lx, 15, 2, 1);
  R(g, 0x20242e, rx, 15, 2, 1);

  // direction-specific face
  if (dir === 'down') {
    R(g, EYE, ox + 6, 6); R(g, EYE, ox + 9, 6);
  } else if (dir === 'up') {
    R(g, pal.hair, ox + 4, 5, 8, 3); // back of head
  } else if (dir === 'left') {
    R(g, pal.hair, ox + 10, 5, 2, 3);
    R(g, EYE, ox + 5, 6);
  } else if (dir === 'right') {
    R(g, pal.hair, ox + 4, 5, 2, 3);
    R(g, EYE, ox + 10, 6);
  }
}

function makeWalkSheet(scene, key, pal) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const frames = ['down0', 'down1', 'up0', 'up1', 'left0', 'left1', 'right0', 'right1'];
  frames.forEach((f, i) => personFrame(g, i * 16, f.slice(0, -1), +f.slice(-1), pal));
  g.generateTexture(key, frames.length * 16, 16);
  g.destroy();
  const t = scene.textures.get(key);
  frames.forEach((f, i) => t.add(f, 0, i * 16, 0, 16, 16));
}

// Spirit / wisp orb.
function spirit(g) {
  RA(g, 0x000000, 0.18, 5, 14, 6, 2);
  g.fillStyle(0xbfe6ff, 0.35); g.fillCircle(8, 8, 7);
  g.fillStyle(0x5db4f0, 1); g.fillCircle(8, 8, 5);
  g.fillStyle(0x9ad6ff, 1); g.fillCircle(6, 6, 2);
  g.fillStyle(0xffffff, 1); g.fillCircle(6, 6, 1);
  R(g, 0x123a5a, 6, 8); R(g, 0x123a5a, 10, 8); // eyes
  // little tail wisps
  g.fillStyle(0x5db4f0, 0.8); g.fillCircle(8, 13, 1.4);
}

// Boss guardian: larger, ominous.
function boss(g) {
  RA(g, 0x000000, 0.22, 2, 14, 12, 2);
  g.fillStyle(0x3a2a55, 1); g.fillCircle(8, 8, 7);
  g.fillStyle(0x5b4488, 1); g.fillCircle(8, 8, 6);
  g.fillStyle(0x7a5fb0, 1); g.fillCircle(6, 6, 2.4);
  // horns
  R(g, 0x2a1f40, 2, 2, 2, 3); R(g, 0x2a1f40, 12, 2, 2, 3);
  // glowing eyes
  R(g, 0xffa53d, 5, 7, 2, 2); R(g, 0xffa53d, 9, 7, 2, 2);
  R(g, 0xffd89a, 5, 7); R(g, 0xffd89a, 9, 7);
  // mouth
  R(g, 0x1a1230, 6, 11, 4, 1);
}

function sign(g) {
  RA(g, 0x000000, 0.2, 5, 14, 6, 2);
  R(g, 0x5d4023, 7, 9, 2, 6); // post
  R(g, 0x3a2716, 9, 2, 1, 8);
  R(g, 0x3a2716, 3, 2, 11, 8); // board outline
  R(g, 0xb5854a, 4, 3, 9, 6); // board
  R(g, 0x8c6238, 4, 3, 9, 1);
  // text lines
  R(g, 0x5d4023, 5, 5, 7, 1);
  R(g, 0x5d4023, 5, 7, 5, 1);
}

// Stone gate / arch.
function gateArch(g) {
  RA(g, 0x000000, 0.2, 2, 14, 12, 2);
  R(g, 0x596270, 2, 1, 4, 14); // left pillar
  R(g, 0x596270, 10, 1, 4, 14); // right pillar
  R(g, 0x6f7884, 3, 1, 2, 14); // highlights
  R(g, 0x6f7884, 11, 1, 2, 14);
  R(g, 0x4a525e, 2, 0, 12, 3); // lintel
  R(g, 0x2a2f3a, 6, 4, 4, 11); // dark doorway
  // brick lines
  RA(g, 0x3a414c, 0.6, 2, 6, 4, 1);
  RA(g, 0x3a414c, 0.6, 10, 9, 4, 1);
}

function companion(g) {
  RA(g, 0x000000, 0.2, 5, 14, 6, 2);
  // droplet body
  g.fillStyle(0x2f7fc7, 1); g.fillCircle(8, 10, 5.4);
  g.fillStyle(0x4aa3e8, 1); g.fillCircle(8, 10, 4.6);
  g.fillTriangle(8, 1, 4.2, 7, 11.8, 7); // pointed top
  g.fillStyle(0x2f7fc7, 1); g.fillTriangle(8, 1, 4.2, 7, 6, 7);
  // highlight
  g.fillStyle(0xbfe4ff, 1); g.fillCircle(6, 8, 1.4);
  // face
  R(g, 0x10324f, 6, 10); R(g, 0x10324f, 10, 10); // eyes
  RA(g, 0x10324f, 0.9, 7, 12, 3, 1); // smile
}

export function generateCharacters(scene) {
  makeWalkSheet(scene, 'hero', HERO_PAL);
  // NPCs: single-frame characters keyed to match MapFactory sprite names.
  tex(scene, 'npc_ranger', 16, 16, (g) => personFrame(g, 0, 'down', 0, RANGER_PAL));
  tex(scene, 'npc_villager', 16, 16, (g) => personFrame(g, 0, 'down', 0, VILLAGER_PAL));
  tex(scene, 'npc_spirit', 16, 16, spirit);
  tex(scene, 'npc_boss', 16, 16, boss);
  tex(scene, 'npc_sign', 16, 16, sign);
  tex(scene, 'door', 16, 16, gateArch);
  tex(scene, 'companion', 16, 16, companion);
}

export default { generateTiles, generateCharacters };
