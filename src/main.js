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

// 16px tiles (MPWSP01); viewport 320×240 scaled ×3.
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
  antialias: false,
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

const game = new Phaser.Game(config);
window.__GAME = game;
window.__GS = GameState;
game.events.once('ready', () => {
  const fallback = document.getElementById('loading-fallback');
  if (fallback) fallback.remove();
});

export default game;
