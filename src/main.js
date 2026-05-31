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

// 64px tiles on a 20×15 grid → 1280×960 world. UI scenes use 320×240 + 4× zoom.
export const TILE = 64;
export const GAME_W = 1280;
export const GAME_H = 960;
export const VIEW_W = 320;
export const VIEW_H = 240;
export const UI_ZOOM = 4;

const config = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: GAME_W,
  height: GAME_H,
  zoom: 1,
  pixelArt: false,
  roundPixels: false,
  antialias: true,
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
