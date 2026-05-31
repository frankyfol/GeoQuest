import Phaser from 'phaser';

import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import TitleScene from './scenes/TitleScene.js';
import WorldScene from './scenes/WorldScene.js';
import EncounterScene from './scenes/EncounterScene.js';
import JournalScene from './scenes/JournalScene.js';
import DialogueScene from './scenes/DialogueScene.js';
import SettingsScene from './scenes/SettingsScene.js';
import EndScene from './scenes/EndScene.js';
import GameState from './systems/GameState.js';

// Logical resolution: a 16px tile grid, viewport of 20x15 tiles = 320x240,
// scaled up x3 by Phaser's Scale Manager for a chunky retro look.
export const TILE = 16;
export const VIEW_W = 320;
export const VIEW_H = 240;
export const ZOOM = 3;

const config = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: VIEW_W,
  height: VIEW_H,
  zoom: ZOOM,
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
