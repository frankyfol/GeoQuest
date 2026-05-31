import Phaser from 'phaser';
import GameState from '../systems/GameState.js';
import Audio from '../systems/AudioManager.js';
import { COLORS, FONT, textStyle, uiCamera } from '../systems/Theme.js';
import { VIEW_W, VIEW_H } from '../main.js';

// Victory screen: the island is healed once all three badges are earned.
export default class EndScene extends Phaser.Scene {
  constructor() {
    super('End');
  }

  create() {
    uiCamera(this);
    const cx = VIEW_W / 2;
    this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x0b2a1a).setOrigin(0);
    this.add.circle(cx, 60, 24, 0xffd166); // healed sun
    this.add.rectangle(0, VIEW_H - 60, VIEW_W, 60, 0x123a2e).setOrigin(0);

    this.cameras.main.fadeIn(500, 0, 0, 0);

    this.add.text(cx, 96, 'THE ISLAND IS', textStyle(12, COLORS.text)).setOrigin(0.5);
    this.add.text(cx, 116, 'HEALED!', { fontFamily: FONT, fontSize: '20px', color: '#06d6a0' }).setOrigin(0.5);

    // Show the three badges.
    ['badge_water', 'badge_canopy', 'badge_tideguard'].forEach((key, i) => {
      const icon = this.add.image(cx - 30 + i * 30, 150, key).setScale(0);
      this.tweens.add({ targets: icon, scale: 1.4, duration: 500, delay: 400 + i * 250, ease: 'Back.out' });
    });

    this.add.text(cx, 180, `Companion reached Level ${GameState.data.companionLevel}!`, textStyle(7, COLORS.accent)).setOrigin(0.5);
    this.add.text(cx, 196, 'You are now a true Geo-Ranger.', textStyle(7, COLORS.text)).setOrigin(0.5);

    const btn = this.add.rectangle(cx, VIEW_H - 24, 150, 18, COLORS.panelLight, 1).setStrokeStyle(2, COLORS.border).setInteractive({ useHandCursor: true });
    this.add.text(cx, VIEW_H - 24, 'Back to Title', textStyle(8)).setOrigin(0.5);
    btn.on('pointerdown', () => {
      Audio.play('select');
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Title'));
    });

    Audio.play('badge');
  }
}
