import Phaser from 'phaser';
import GameState from '../systems/GameState.js';
import Audio from '../systems/AudioManager.js';
import { COLORS, FONT, textStyle } from '../systems/Theme.js';
import { VIEW_W, VIEW_H } from '../main.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    const cx = VIEW_W / 2;

    // Backdrop: simple gradient-ish layered rectangles for a sky/island vibe.
    this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x0b1020).setOrigin(0);
    this.add.rectangle(0, VIEW_H - 70, VIEW_W, 70, 0x123a2e).setOrigin(0);
    this.add.rectangle(0, VIEW_H - 40, VIEW_W, 40, 0x0d2b46).setOrigin(0);
    // a little sun
    this.add.circle(cx + 90, 48, 16, 0xffd166);

    this.add
      .text(cx, 46, 'GEOQUEST', {
        fontFamily: FONT,
        fontSize: '24px',
        color: '#5bc0eb'
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 74, 'Island of the Living Map', textStyle(8, COLORS.accent))
      .setOrigin(0.5);

    // Companion droplet bobbing.
    const droplet = this.add.image(cx, 116, 'companion').setScale(2);
    this.tweens.add({
      targets: droplet,
      y: 110,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    const hasSave = GameState.hasSave();

    this._buttons = [];
    this._makeButton(cx, 150, 'New Game', () => this._startNewGame(hasSave));
    this._continueBtn = this._makeButton(cx, 174, 'Continue', () => {
      if (GameState.hasSave()) {
        GameState.load();
        Audio.play('select');
        this._goWorld();
      }
    });
    if (!hasSave) this._setButtonEnabled(this._continueBtn, false);

    this._makeButton(cx, 198, 'Settings', () => {
      Audio.play('open');
      this.scene.launch('Settings', { from: 'Title' });
      this.scene.bringToTop('Settings');
    });

    this.add
      .text(cx, VIEW_H - 10, 'Learn the island. Heal the island.', textStyle(6, COLORS.textDim))
      .setOrigin(0.5);

    // Start title music on first interaction (audio needs a gesture).
    this.input.once('pointerdown', () => {
      Audio.resume();
      Audio.playMusic('title');
    });
    this.input.keyboard.once('keydown', () => {
      Audio.resume();
      Audio.playMusic('title');
    });
  }

  _makeButton(x, y, label, onClick) {
    const w = 130;
    const h = 18;
    const bg = this.add.rectangle(x, y, w, h, COLORS.panelLight, 1).setStrokeStyle(2, COLORS.border);
    const txt = this.add.text(x, y, label, textStyle(8)).setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      if (bg.getData('enabled') === false) return;
      bg.setFillStyle(0x3a5088, 1);
    });
    bg.on('pointerout', () => bg.setFillStyle(COLORS.panelLight, 1));
    bg.on('pointerdown', () => {
      if (bg.getData('enabled') === false) return;
      onClick();
    });
    bg.setData('enabled', true);
    bg.setData('txt', txt);
    this._buttons.push(bg);
    return bg;
  }

  _setButtonEnabled(btn, enabled) {
    btn.setData('enabled', enabled);
    btn.setAlpha(enabled ? 1 : 0.4);
    btn.getData('txt').setAlpha(enabled ? 1 : 0.5);
  }

  _startNewGame(hasSave) {
    Audio.play('select');
    if (hasSave) {
      this._confirmOverwrite();
    } else {
      GameState.newGame();
      this._goWorld();
    }
  }

  _confirmOverwrite() {
    if (this._dialog) return;
    const cx = VIEW_W / 2;
    const cy = VIEW_H / 2;
    const overlay = this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x000000, 0.6).setOrigin(0).setInteractive();
    const panel = this.add.rectangle(cx, cy, 240, 96, COLORS.panel, 1).setStrokeStyle(2, COLORS.border);
    const msg = this.add
      .text(cx, cy - 26, 'Overwrite your\nexisting save?', textStyle(8))
      .setOrigin(0.5)
      .setAlign('center');

    const cleanup = () => {
      overlay.destroy();
      panel.destroy();
      msg.destroy();
      yes.destroy();
      yesT.destroy();
      no.destroy();
      noT.destroy();
      this._dialog = null;
    };

    const yes = this.add.rectangle(cx - 55, cy + 22, 90, 18, COLORS.bad, 1).setStrokeStyle(2, COLORS.border).setInteractive({ useHandCursor: true });
    const yesT = this.add.text(cx - 55, cy + 22, 'Overwrite', textStyle(7)).setOrigin(0.5);
    yes.on('pointerdown', () => {
      Audio.play('select');
      GameState.newGame();
      cleanup();
      this._goWorld();
    });

    const no = this.add.rectangle(cx + 55, cy + 22, 90, 18, COLORS.panelLight, 1).setStrokeStyle(2, COLORS.border).setInteractive({ useHandCursor: true });
    const noT = this.add.text(cx + 55, cy + 22, 'Cancel', textStyle(7)).setOrigin(0.5);
    no.on('pointerdown', () => {
      Audio.play('close');
      cleanup();
    });

    this._dialog = true;
  }

  _goWorld() {
    Audio.stopMusic();
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('World');
    });
  }
}
