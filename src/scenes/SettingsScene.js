import Phaser from 'phaser';
import GameState from '../systems/GameState.js';
import Audio from '../systems/AudioManager.js';
import { COLORS, textStyle, drawPanel, uiCamera } from '../systems/Theme.js';
import { VIEW_W, VIEW_H } from '../main.js';

// Overlay settings menu, launchable from the Title screen and the World
// (via the ESC/pause key). Persists choices to GameState.settings.
export default class SettingsScene extends Phaser.Scene {
  constructor() {
    super('Settings');
  }

  init(data) {
    this.from = (data && data.from) || 'Title';
  }

  create() {
    uiCamera(this);
    const cx = VIEW_W / 2;
    this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x000000, 0.8).setOrigin(0).setInteractive();
    drawPanel(this, cx - 110, 40, 220, 150);

    this.add.text(cx, 50, 'SETTINGS', textStyle(12, COLORS.accent)).setOrigin(0.5);

    // Sound toggle.
    this.soundLabel = this.add.text(cx - 90, 84, '', textStyle(8)).setOrigin(0, 0.5);
    this._refreshSound();
    const soundBtn = this.add.rectangle(cx + 60, 84, 70, 18, COLORS.panelLight, 1).setStrokeStyle(2, COLORS.border).setInteractive({ useHandCursor: true });
    this.soundBtnText = this.add.text(cx + 60, 84, '', textStyle(7)).setOrigin(0.5);
    this._refreshSoundBtn();
    soundBtn.on('pointerdown', () => {
      GameState.data.settings.sound = !GameState.data.settings.sound;
      GameState.save();
      Audio.applySoundSetting();
      Audio.play('select');
      this._refreshSound();
      this._refreshSoundBtn();
    });

    // Text speed cycle.
    this.add.text(cx - 90, 114, 'Text Speed', textStyle(8)).setOrigin(0, 0.5);
    const speedBtn = this.add.rectangle(cx + 60, 114, 70, 18, COLORS.panelLight, 1).setStrokeStyle(2, COLORS.border).setInteractive({ useHandCursor: true });
    this.speedBtnText = this.add.text(cx + 60, 114, '', textStyle(7)).setOrigin(0.5);
    this._refreshSpeedBtn();
    const speeds = ['slow', 'normal', 'fast'];
    speedBtn.on('pointerdown', () => {
      const i = speeds.indexOf(GameState.data.settings.textSpeed);
      GameState.data.settings.textSpeed = speeds[(i + 1) % speeds.length];
      GameState.save();
      Audio.play('select');
      this._refreshSpeedBtn();
    });

    // Close button.
    const closeBtn = this.add.rectangle(cx, 166, 120, 18, COLORS.good, 1).setStrokeStyle(2, COLORS.border).setInteractive({ useHandCursor: true });
    this.add.text(cx, 166, 'Close', textStyle(8, '#0b1020')).setOrigin(0.5);
    const close = () => this._close();
    closeBtn.on('pointerdown', close);
    this.input.keyboard.on('keydown-ESC', close);
  }

  _refreshSound() {
    this.soundLabel.setText('Sound');
  }
  _refreshSoundBtn() {
    this.soundBtnText.setText(GameState.data.settings.sound ? 'ON' : 'OFF');
  }
  _refreshSpeedBtn() {
    this.speedBtnText.setText(GameState.data.settings.textSpeed.toUpperCase());
  }

  _close() {
    Audio.play('close');
    this.scene.stop();
    if (this.from === 'World') {
      this.scene.resume('World');
    }
  }
}
