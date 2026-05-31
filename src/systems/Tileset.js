// Tileset.js
// Generates all in-game art at runtime as crisp 64x64 pixel-art textures
// (tiles) and character sprites — no binary image assets required. The larger
// 64px canvas allows much finer detail than a 16px grid: layered tree foliage,
// shaded water, expressive characters, etc.
import Phaser from 'phaser';

export const TILE_PX = 64;

// --- pixel helpers -------------------------------------------------------
const R = (g, c, x, y, w = 1, h = 1) => {
  g.fillStyle(c, 1);
  g.fillRect(x, y, w, h);
};
const RA = (g, c, a, x, y, w = 1, h = 1) => {
  g.fillStyle(c, a);
  g.fillRect(x, y, w, h);
};
const circle = (g, c, x, y, r, a = 1) => {
  g.fillStyle(c, a);
  g.fillCircle(x, y, r);
};

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
//  TILES (64x64)
// ========================================================================
function drawGrass(g, seed) {
  // vertical gradient base
  R(g, 0x5cab4e, 0, 0, 64, 64);
  RA(g, 0x66ba57, 0.5, 0, 0, 64, 26);
  RA(g, 0x4e9a42, 0.45, 0, 42, 64, 22);
  const rnd = mulberry(seed);
  // speckle noise
  for (let i = 0; i < 120; i++) {
    const x = (rnd() * 64) | 0;
    const y = (rnd() * 64) | 0;
    R(g, rnd() < 0.5 ? 0x6cc25c : 0x499038, x, y, 1, 1);
  }
  // grass blades
  for (let i = 0; i < 14; i++) {
    const x = 4 + ((rnd() * 56) | 0);
    const y = 14 + ((rnd() * 44) | 0);
    const h = 4 + ((rnd() * 4) | 0);
    R(g, 0x3c8636, x, y, 2, h);
    R(g, 0x82d36e, x + (rnd() < 0.5 ? -1 : 2), y - 2, 1, h);
  }
}

function drawPath(g) {
  R(g, 0xcaa667, 0, 0, 64, 64);
  RA(g, 0xd7b87c, 0.5, 0, 0, 64, 18);
  const rnd = mulberry(99);
  for (let i = 0; i < 130; i++) {
    const x = (rnd() * 64) | 0;
    const y = (rnd() * 64) | 0;
    R(g, rnd() < 0.5 ? 0xb8915a : 0xdcbd84, x, y, 1, 1);
  }
  // a few pebbles
  for (const [px, py, pr] of [[16, 22, 3], [44, 40, 4], [28, 52, 2]]) {
    circle(g, 0x9c7a48, px, py, pr);
    circle(g, 0xb89a68, px - 1, py - 1, pr - 1.5);
  }
}

function drawSand(g) {
  R(g, 0xe8d8a3, 0, 0, 64, 64);
  RA(g, 0xf2e6bb, 0.5, 0, 0, 64, 18);
  const rnd = mulberry(7);
  for (let i = 0; i < 90; i++) {
    const x = (rnd() * 64) | 0;
    const y = (rnd() * 64) | 0;
    R(g, rnd() < 0.5 ? 0xd6c184 : 0xf6edca, x, y, 1, 1);
  }
  // faint dune ripples
  RA(g, 0xd2bd80, 0.5, 8, 30, 26, 1);
  RA(g, 0xd2bd80, 0.5, 30, 46, 24, 1);
}

function drawWater(g) {
  // vertical gradient
  for (let y = 0; y < 64; y++) {
    const t = y / 63;
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0x59a0e6),
      Phaser.Display.Color.ValueToColor(0x2f6fb6),
      63,
      y
    );
    R(g, Phaser.Display.Color.GetColor(c.r, c.g, c.b), 0, y, 64, 1);
  }
  // wave highlights
  const waves = [[8, 12, 16], [36, 12, 14], [20, 30, 18], [40, 46, 16], [10, 52, 12]];
  waves.forEach(([x, y, w]) => {
    RA(g, 0xbfdcf6, 0.8, x, y, w, 1);
    RA(g, 0x9cc7ef, 0.6, x + 2, y + 2, w - 4, 1);
  });
  // sparkles
  RA(g, 0xffffff, 0.85, 50, 20, 2, 2);
  RA(g, 0xffffff, 0.7, 16, 40, 2, 2);
}

function drawMud(g) {
  R(g, 0x6f5638, 0, 0, 64, 64);
  const rnd = mulberry(13);
  for (let i = 0; i < 90; i++) {
    const x = (rnd() * 64) | 0;
    const y = (rnd() * 64) | 0;
    R(g, rnd() < 0.5 ? 0x5b4530 : 0x856848, x, y, 1, 1);
  }
  // wet sheen puddles
  RA(g, 0x9fb6c8, 0.3, 12, 16, 16, 6);
  RA(g, 0x9fb6c8, 0.25, 36, 40, 18, 7);
  RA(g, 0xc8d8e4, 0.3, 14, 17, 8, 2);
}

function drawTree(g) {
  // shadow
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(32, 56, 44, 14);
  // trunk
  R(g, 0x6b4a2c, 28, 40, 8, 18);
  R(g, 0x53391f, 28, 40, 3, 18);
  R(g, 0x7d5a38, 33, 40, 2, 18);
  // canopy: outline + layered foliage
  circle(g, 0x1f5a2a, 32, 26, 24);
  circle(g, 0x2f7d3a, 32, 26, 21);
  [[22, 20, 11], [42, 22, 10], [32, 14, 10], [24, 32, 9], [42, 34, 9]].forEach(([x, y, r]) => circle(g, 0x3f9a47, x, y, r));
  [[24, 17, 5], [38, 19, 4], [30, 26, 5]].forEach(([x, y, r]) => circle(g, 0x57b85a, x, y, r));
  [[22, 14, 2.5], [36, 16, 2]].forEach(([x, y, r]) => circle(g, 0x7cd07b, x, y, r));
}

function drawRock(g) {
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(32, 52, 40, 12);
  circle(g, 0x4c5159, 32, 36, 22);
  circle(g, 0x868c95, 32, 36, 19);
  // facets
  g.fillStyle(0xa9aeb6, 1);
  g.fillTriangle(20, 30, 34, 24, 30, 40);
  g.fillStyle(0x6e747e, 1);
  g.fillTriangle(34, 24, 48, 34, 40, 46);
  circle(g, 0xc2c7ce, 26, 28, 3);
}

function drawFlower(g) {
  const flower = (cx, cy, col) => {
    circle(g, 0x3c8636, cx, cy + 6, 1.6); // stem base
    R(g, 0x3c8636, cx - 1, cy + 2, 2, 8);
    [[0, -5], [5, 0], [0, 5], [-5, 0], [4, -4], [-4, -4], [4, 4], [-4, 4]].forEach(([dx, dy]) =>
      circle(g, col, cx + dx, cy + dy, 2.6)
    );
    circle(g, 0xffe14d, cx, cy, 2.6);
  };
  flower(16, 30, 0xff5d6c);
  flower(44, 20, 0xfdfdfd);
  flower(46, 46, 0xffb23f);
  flower(24, 50, 0xc77dff);
}

export function generateTiles(scene) {
  tex(scene, 'tile_grass', 64, 64, (g) => drawGrass(g, 1));
  tex(scene, 'tile_grass2', 64, 64, (g) => drawGrass(g, 42));
  tex(scene, 'tile_grass3', 64, 64, (g) => drawGrass(g, 777));
  tex(scene, 'tile_path', 64, 64, drawPath);
  tex(scene, 'tile_sand', 64, 64, drawSand);
  tex(scene, 'tile_water', 64, 64, drawWater);
  tex(scene, 'tile_mud', 64, 64, drawMud);
  tex(scene, 'tile_tree', 64, 64, drawTree);
  tex(scene, 'tile_rock', 64, 64, drawRock);
  tex(scene, 'tile_flower', 64, 64, drawFlower);
}

// ========================================================================
//  CHARACTERS (64x64)
// ========================================================================
const HERO_PAL = { hat: 0xe5403b, hatO: 0xb22d2a, shirt: 0x3f78c4, shirtO: 0x2c5790, pants: 0x35507a, skin: 0xf1c693, skinO: 0xd9a978, hair: 0x6e4a2c, shoe: 0x20242e };
const RANGER_PAL = { hat: 0x8a6a3a, hatO: 0x6e5430, shirt: 0x3aa05a, shirtO: 0x2c7d46, pants: 0x5a4632, skin: 0xf1c693, skinO: 0xd9a978, hair: 0x3a2a1a, shoe: 0x2c241c };
const VILLAGER_PAL = { hat: 0xcf5aa0, hatO: 0xa83f80, shirt: 0xe0b341, shirtO: 0xc0972f, pants: 0x6a5b8a, skin: 0xf3cfa6, skinO: 0xdcae84, hair: 0x4a3326, shoe: 0x3a2f22 };
const OUT = 0x222633;
const EYE = 0x1c2030;

// Draws a 64x64 outlined chibi person at x-offset `ox`.
function personFrame(g, ox, dir, step, pal) {
  // shadow
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(ox + 32, 58, 34, 9);

  // legs (stride depends on step)
  const spread = step === 1 ? 6 : 2;
  const lx = ox + 22 - spread;
  const rx = ox + 36 + spread;
  R(g, OUT, lx - 1, 47, 11, 15);
  R(g, OUT, rx - 1, 47, 11, 15);
  R(g, pal.pants, lx, 48, 9, 11);
  R(g, pal.pants, rx, 48, 9, 11);
  R(g, pal.shoe, lx, 58, 9, 4);
  R(g, pal.shoe, rx, 58, 9, 4);

  // body
  R(g, OUT, ox + 14, 30, 36, 22);
  R(g, pal.shirt, ox + 16, 32, 32, 18);
  RA(g, pal.shirtO, 1, ox + 16, 44, 32, 6);
  RA(g, 0xffffff, 0.12, ox + 19, 33, 10, 12); // subtle sheen
  // arms
  R(g, OUT, ox + 10, 31, 8, 18);
  R(g, OUT, ox + 46, 31, 8, 18);
  R(g, pal.shirt, ox + 11, 32, 6, 13);
  R(g, pal.shirt, ox + 47, 32, 6, 13);
  R(g, pal.skin, ox + 11, 44, 6, 5);
  R(g, pal.skin, ox + 47, 44, 6, 5);

  // head
  R(g, OUT, ox + 14, 6, 36, 28);
  R(g, pal.skin, ox + 16, 8, 32, 24);
  RA(g, pal.skinO, 1, ox + 16, 28, 32, 4); // chin shade
  // hat
  R(g, pal.hat, ox + 14, 6, 36, 10);
  RA(g, pal.hatO, 1, ox + 14, 13, 36, 4); // brim
  RA(g, 0xffffff, 0.18, ox + 18, 8, 12, 3); // hat shine

  // direction-specific features
  if (dir === 'down') {
    R(g, EYE, ox + 22, 20, 4, 5); R(g, EYE, ox + 38, 20, 4, 5);
    R(g, 0xffffff, ox + 22, 20, 2, 2); R(g, 0xffffff, ox + 38, 20, 2, 2);
    RA(g, 0xe2937a, 0.6, ox + 19, 26, 4, 2); RA(g, 0xe2937a, 0.6, ox + 41, 26, 4, 2); // cheeks
    RA(g, pal.skinO, 1, ox + 29, 24, 6, 2); // nose hint
  } else if (dir === 'up') {
    R(g, pal.hair, ox + 16, 16, 32, 14); // back of head hair
    RA(g, 0x000000, 0.12, ox + 16, 16, 32, 3);
  } else if (dir === 'left') {
    R(g, pal.hair, ox + 40, 16, 8, 14);
    R(g, EYE, ox + 22, 20, 4, 5);
    R(g, 0xffffff, ox + 22, 20, 2, 2);
    RA(g, pal.skinO, 1, ox + 17, 22, 4, 6); // nose/profile
  } else if (dir === 'right') {
    R(g, pal.hair, ox + 16, 16, 8, 14);
    R(g, EYE, ox + 38, 20, 4, 5);
    R(g, 0xffffff, ox + 38, 20, 2, 2);
    RA(g, pal.skinO, 1, ox + 43, 22, 4, 6);
  }
}

function makeWalkSheet(scene, key, pal) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const frames = ['down0', 'down1', 'up0', 'up1', 'left0', 'left1', 'right0', 'right1'];
  frames.forEach((f, i) => personFrame(g, i * 64, f.slice(0, -1), +f.slice(-1), pal));
  g.generateTexture(key, frames.length * 64, 64);
  g.destroy();
  const t = scene.textures.get(key);
  frames.forEach((f, i) => t.add(f, 0, i * 64, 0, 64, 64));
}

function spirit(g) {
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(32, 56, 26, 8);
  // outer glow
  circle(g, 0xbfe6ff, 32, 30, 28, 0.18);
  circle(g, 0xbfe6ff, 32, 30, 22, 0.28);
  // body with shading
  circle(g, 0x3f93d6, 32, 30, 19);
  circle(g, 0x5db4f0, 30, 28, 16);
  circle(g, 0x9ad6ff, 26, 24, 8);
  circle(g, 0xffffff, 24, 22, 3.5);
  // eyes + smile
  R(g, 0x123a5a, 26, 30, 3, 5); R(g, 0x123a5a, 37, 30, 3, 5);
  R(g, 0xffffff, 26, 30, 1.5, 2); R(g, 0xffffff, 37, 30, 1.5, 2);
  g.lineStyle(2, 0x123a5a, 0.9);
  g.beginPath(); g.arc(32, 36, 5, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160), false); g.strokePath();
  // floating wisps
  circle(g, 0x5db4f0, 32, 50, 4, 0.8);
  circle(g, 0x5db4f0, 32, 57, 2.5, 0.6);
}

function boss(g) {
  g.fillStyle(0x000000, 0.24);
  g.fillEllipse(32, 58, 40, 10);
  // horns
  g.fillStyle(0x2a1f40, 1);
  g.fillTriangle(10, 8, 20, 26, 6, 28);
  g.fillTriangle(54, 8, 44, 26, 58, 28);
  // body
  circle(g, 0x2a1f40, 32, 32, 26);
  circle(g, 0x4b3570, 32, 32, 23);
  circle(g, 0x6a4fa0, 28, 28, 14);
  circle(g, 0x8a6fc0, 24, 24, 6);
  // glowing eyes
  circle(g, 0xffa53d, 24, 32, 6, 0.4);
  circle(g, 0xffa53d, 40, 32, 6, 0.4);
  R(g, 0xffd89a, 21, 30, 6, 5); R(g, 0xffd89a, 37, 30, 6, 5);
  R(g, 0xff7a1e, 23, 32, 3, 3); R(g, 0xff7a1e, 39, 32, 3, 3);
  // jagged mouth
  g.fillStyle(0x140d26, 1);
  g.fillRect(22, 42, 20, 4);
  g.fillStyle(0xffffff, 1);
  for (let i = 0; i < 4; i++) g.fillTriangle(23 + i * 5, 42, 26 + i * 5, 42, 24.5 + i * 5, 46);
}

function sign(g) {
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(32, 58, 22, 7);
  R(g, 0x5d4023, 29, 34, 6, 24); // post
  R(g, 0x4a3019, 29, 34, 2, 24);
  // board
  R(g, 0x3a2716, 12, 8, 40, 30);
  R(g, 0xb5854a, 15, 11, 34, 24);
  R(g, 0x9c6e3a, 15, 11, 34, 4);
  // wood grain + text lines
  RA(g, 0x8c6238, 0.6, 17, 18, 30, 1);
  R(g, 0x5d4023, 19, 16, 26, 3);
  R(g, 0x5d4023, 19, 23, 18, 3);
  R(g, 0x5d4023, 19, 29, 22, 3);
}

function gateArch(g) {
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(32, 60, 44, 9);
  // pillars
  R(g, 0x596270, 8, 6, 16, 56);
  R(g, 0x596270, 40, 6, 16, 56);
  R(g, 0x6f7884, 10, 6, 5, 56);
  R(g, 0x6f7884, 42, 6, 5, 56);
  R(g, 0x474e59, 20, 6, 4, 56);
  R(g, 0x474e59, 52, 6, 4, 56);
  // lintel
  R(g, 0x4a525e, 6, 2, 52, 12);
  R(g, 0x6f7884, 8, 2, 48, 3);
  // doorway
  R(g, 0x262b36, 24, 16, 16, 46);
  // brick seams
  for (let y = 16; y < 60; y += 11) { RA(g, 0x3a414c, 0.7, 8, y, 16, 1); RA(g, 0x3a414c, 0.7, 40, y, 16, 1); }
}

function companion(g) {
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(32, 58, 26, 8);
  // droplet body
  circle(g, 0x2f7fc7, 32, 38, 21);
  circle(g, 0x4aa3e8, 32, 38, 18);
  g.fillStyle(0x2f7fc7, 1); g.fillTriangle(32, 6, 16, 32, 48, 32);
  g.fillStyle(0x4aa3e8, 1); g.fillTriangle(32, 12, 20, 32, 44, 32);
  // shine
  circle(g, 0xbfe4ff, 24, 30, 5);
  circle(g, 0xffffff, 22, 28, 2);
  // face
  R(g, 0x10324f, 25, 38, 4, 6); R(g, 0x10324f, 39, 38, 4, 6);
  R(g, 0xffffff, 25, 38, 2, 2); R(g, 0xffffff, 39, 38, 2, 2);
  g.lineStyle(2, 0x10324f, 0.95);
  g.beginPath(); g.arc(32, 45, 5, Phaser.Math.DegToRad(15), Phaser.Math.DegToRad(165), false); g.strokePath();
  RA(g, 0x7fc4ff, 0.5, 24, 47, 4, 2); RA(g, 0x7fc4ff, 0.5, 36, 47, 4, 2); // cheeks
}

export function generateCharacters(scene) {
  makeWalkSheet(scene, 'hero', HERO_PAL);
  tex(scene, 'npc_ranger', 64, 64, (g) => personFrame(g, 0, 'down', 0, RANGER_PAL));
  tex(scene, 'npc_villager', 64, 64, (g) => personFrame(g, 0, 'down', 0, VILLAGER_PAL));
  tex(scene, 'npc_spirit', 64, 64, spirit);
  tex(scene, 'npc_boss', 64, 64, boss);
  tex(scene, 'npc_sign', 64, 64, sign);
  tex(scene, 'door', 64, 64, gateArch);
  tex(scene, 'companion', 64, 64, companion);
}

export default { generateTiles, generateCharacters, TILE_PX };
