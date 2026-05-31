import Phaser from 'phaser';
import GameState from '../systems/GameState.js';
import Audio from '../systems/AudioManager.js';
import { COLORS, textStyle, drawPanel, uiCamera } from '../systems/Theme.js';
import { VIEW_W, VIEW_H } from '../main.js';

// A short, paged "How to Play" overlay. Shown automatically the first time a
// new game starts, and available any time from the Title screen.
const PAGES = [
  {
    title: 'Welcome, Geo-Ranger!',
    body: "A tropical island's natural systems are breaking down. Learn how water, rainforests and mangroves work to repair them — and earn 3 badges to heal the island."
  },
  {
    title: 'Explore',
    body: 'Walk around with the ARROW KEYS or WASD (one tile per press; hold to keep going). On a touch screen, use the on-screen D-pad.'
  },
  {
    title: 'Talk & Interact',
    body: 'Stand facing a ranger, spirit or gate and press SPACE or ENTER (or the A button) to talk, start a challenge, or open a gate.'
  },
  {
    title: 'Concept Battles',
    body: "Spirits challenge you with questions. Choose an answer by clicking it or pressing its number key. You can't lose! A wrong answer just shows a hint so you can try again."
  },
  {
    title: 'Field Journal',
    body: 'Press J to open your Field Journal. It fills in as you master concepts — a perfect revision tool before a test.'
  },
  {
    title: 'Heal the Island',
    body: "Beat each region's Guardian to earn its badge and unlock the next area. Collect all three badges to win. Good luck!"
  }
];

export default class TutorialScene extends Phaser.Scene {
  constructor() {
    super('Tutorial');
  }

  init(data) {
    this.from = (data && data.from) || 'World';
  }

  create() {
    uiCamera(this);
    this.index = 0;

    this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x000000, 0.8).setOrigin(0).setInteractive();
    drawPanel(this, 22, 26, VIEW_W - 44, VIEW_H - 52);

    this.add.text(VIEW_W / 2, 34, 'HOW TO PLAY', textStyle(8, COLORS.textDim)).setOrigin(0.5, 0);
    this.titleText = this.add.text(VIEW_W / 2, 50, '', textStyle(10, COLORS.accent)).setOrigin(0.5, 0).setAlign('center');
    this.bodyText = this.add.text(38, 78, '', {
      ...textStyle(8),
      wordWrap: { width: VIEW_W - 76 },
      lineSpacing: 5
    });
    this.pageText = this.add.text(VIEW_W / 2, VIEW_H - 40, '', textStyle(6, COLORS.textDim)).setOrigin(0.5);

    // Navigation buttons.
    this.backBtn = this._button(64, VIEW_H - 40, 'Back', () => this._go(-1));
    this.nextBtn = this._button(VIEW_W - 64, VIEW_H - 40, 'Next', () => this._go(1));
    this.skip = this.add.text(VIEW_W - 34, 34, 'Skip \u00BB', textStyle(6, COLORS.textDim)).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this.skip.on('pointerdown', () => this._close());

    this.input.keyboard.on('keydown-SPACE', () => this._go(1));
    this.input.keyboard.on('keydown-ENTER', () => this._go(1));
    this.input.keyboard.on('keydown-LEFT', () => this._go(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this._go(1));
    this.input.keyboard.on('keydown-ESC', () => this._close());

    this._render();
  }

  _button(x, y, label, onClick) {
    const bg = this.add.rectangle(x, y, 64, 16, COLORS.panelLight, 1).setStrokeStyle(2, COLORS.border).setInteractive({ useHandCursor: true });
    const t = this.add.text(x, y, label, textStyle(7)).setOrigin(0.5);
    bg.on('pointerover', () => bg.setFillStyle(0x3a5088));
    bg.on('pointerout', () => bg.setFillStyle(COLORS.panelLight));
    bg.on('pointerdown', onClick);
    return { bg, t };
  }

  _go(dir) {
    const next = this.index + dir;
    if (next < 0) return;
    if (next >= PAGES.length) {
      this._close();
      return;
    }
    Audio.play('select');
    this.index = next;
    this._render();
  }

  _render() {
    const page = PAGES[this.index];
    this.titleText.setText(page.title);
    this.bodyText.setText(page.body);
    this.pageText.setText(`${this.index + 1} / ${PAGES.length}`);

    this.backBtn.bg.setVisible(this.index > 0);
    this.backBtn.t.setVisible(this.index > 0);

    const last = this.index === PAGES.length - 1;
    this.nextBtn.t.setText(last ? (this.from === 'World' ? "Let's go!" : 'Close') : 'Next');
  }

  _close() {
    GameState.data.tutorialSeen = true;
    GameState.save();
    Audio.play('close');
    this.scene.stop();
    if (this.from === 'World') this.scene.resume('World');
  }
}
