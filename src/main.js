import Phaser from 'phaser';

import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import TitleScene from './scenes/TitleScene.js';
import WorldScene from './scenes/WorldScene.js';
import EncounterScene from './scenes/EncounterScene.js';
import JournalScene from './scenes/JournalScene.js';
import DialogueScene from './scenes/DialogueScene.js';
import SettingsScene from './scenes/SettingsScene.js';
import TutorialScene from './scenes/TutorialScene.js';
import EndScene from './scenes/EndScene.js';
import GameState from './systems/GameState.js';

// Art uses a 64x64 pixel tile for plenty of detail. The game renders at an
// internal resolution of 1280x960 (a 20x15 grid of 64px tiles) and is scaled
// to fit the window by Phaser's Scale Manager.
export const TILE = 64;
export const GAME_W = 1280;
export const GAME_H = 960;

// UI scenes are authored against a compact 320x240 "design" space and then
// rendered through a x4 camera zoom (UI_ZOOM) so they fill the 1280x960 frame.
// This keeps all existing UI layouts/fonts unchanged at the higher resolution.
export const VIEW_W = 320;
export const VIEW_H = 240;
export const UI_ZOOM = 4;

const config = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: GAME_W,
  height: GAME_H,
  zoom: 1,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#0b1020',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    WorldScene,
    EncounterScene,
    JournalScene,
    DialogueScene,
    SettingsScene,
    TutorialScene,
    EndScene
  ]
};

// Remove the static loading fallback once Phaser is ready to render.
const game = new Phaser.Game(config);
// Expose for debugging / automated smoke tests.
window.__GAME = game;
window.__GS = GameState;
game.events.once('ready', () => {
  const fallback = document.getElementById('loading-fallback');
  if (fallback) fallback.remove();
});

export default game;
