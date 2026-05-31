import Phaser from 'phaser';
import { COLORS, FONT, uiCamera } from '../systems/Theme.js';
import { VIEW_W, VIEW_H } from '../main.js';
import { registerMpwspAssets, buildMpwspTextures } from '../systems/MpwspAssets.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    uiCamera(this);
    this._buildLoadingBar();

    registerMpwspAssets(this);

    const base = 'assets/data';
    this.load.json('regions', `${base}/regions.json`);
    this.load.json('questions', `${base}/questions.json`);
    this.load.json('journal', `${base}/journal.json`);
    this.load.json('dialogue', `${base}/dialogue.json`);
  }

  _buildLoadingBar() {
    const w = VIEW_W;
    const h = VIEW_H;
    const barW = 180;
    const barH = 14;
    const bx = (w - barW) / 2;
    const by = h / 2;

    this.add.text(w / 2, by - 30, 'GEOQUEST', { fontFamily: FONT, fontSize: '16px', color: '#5bc0eb' }).setOrigin(0.5);

    const border = this.add.graphics();
    border.lineStyle(2, 0x5bc0eb, 1);
    border.strokeRect(bx, by, barW, barH);
    const fill = this.add.graphics();

    const pct = this.add
      .text(w / 2, by + 28, '0%', { fontFamily: FONT, fontSize: '11px', color: '#9fb3d1' })
      .setOrigin(0.5);

    this.load.on('progress', (value) => {
      fill.clear();
      fill.fillStyle(0x06d6a0, 1);
      fill.fillRect(bx + 2, by + 2, (barW - 4) * value, barH - 4);
      pct.setText(`${Math.round(value * 100)}%`);
    });
  }

  async create() {
    buildMpwspTextures(this);
    this._generateBadgeTextures();
    await this._loadJournalIcons();

    try {
      if (document.fonts?.load) {
        await document.fonts.load('400 14px "Nunito Sans"');
        await document.fonts.ready;
      }
    } catch (e) {
      /* optional */
    }

    this.scene.start('Title');
  }

  _generateBadgeTextures() {
    const make = (key, w, h, draw) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      draw(g);
      g.generateTexture(key, w, h);
      g.destroy();
    };

    make('jicon_unknown', 48, 48, (g) => {
      g.fillStyle(0x141b2e, 1);
      g.fillRoundedRect(3, 3, 42, 42, 11);
      g.lineStyle(3, 0x3a4a66, 1);
      g.strokeRoundedRect(4, 4, 40, 40, 10);
      g.fillStyle(0x3a4a66, 1);
      g.fillCircle(24, 33, 2.5);
    });

    const badge = (key, color, dark) =>
      make(key, 24, 24, (g) => {
        g.fillStyle(0xffffff, 1);
        g.fillCircle(12, 12, 11);
        g.fillStyle(dark, 1);
        g.fillCircle(12, 12, 10);
        g.fillStyle(color, 1);
        g.fillCircle(12, 12, 8);
        g.fillStyle(0xffffff, 0.35);
        g.fillCircle(10, 10, 5);
        g.fillStyle(0xffffff, 0.95);
        g.fillCircle(9, 9, 2);
      });
    badge('badge_water', 0x4fc3f7, 0x1f6fb2);
    badge('badge_canopy', 0x66bb6a, 0x2f8f46);
    badge('badge_tideguard', 0x26a69a, 0x1f8f8f);
  }

  _loadJournalIcons() {
    return new Promise((resolve) => {
      const journal = this.cache.json.get('journal');
      if (!journal?.entries) return resolve();

      let queued = 0;
      journal.entries.forEach((e) => {
        if (!e.icon) return;
        const key = `jicon_${e.id}`;
        if (this.textures.exists(key)) return;
        this.load.svg(key, e.icon, { width: 48, height: 48 });
        queued++;
      });
      if (queued === 0) return resolve();

      this.load.once('complete', () => {
        journal.entries.forEach((e) => {
          const key = `jicon_${e.id}`;
          if (this.textures.exists(key)) {
            this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
          }
        });
        resolve();
      });
      this.load.once('loaderror', () => {});
      this.load.start();
    });
  }
}
