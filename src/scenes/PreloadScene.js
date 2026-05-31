import Phaser from 'phaser';
import { COLORS, FONT } from '../systems/Theme.js';
import { VIEW_W, VIEW_H } from '../main.js';

// PreloadScene: loads all JSON data, generates placeholder textures, and
// waits for the retro web font, all behind a simple loading bar.
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    this._buildLoadingBar();

    // Load all teaching content from public/assets/data via fetch (Phaser loader).
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

    this.add
      .text(w / 2, by - 30, 'GEOQUEST', {
        fontFamily: FONT,
        fontSize: '16px',
        color: '#5bc0eb'
      })
      .setOrigin(0.5);

    const border = this.add.graphics();
    border.lineStyle(2, 0x5bc0eb, 1);
    border.strokeRect(bx, by, barW, barH);

    const fill = this.add.graphics();

    const pct = this.add
      .text(w / 2, by + 28, '0%', {
        fontFamily: FONT,
        fontSize: '8px',
        color: '#9fb3d1'
      })
      .setOrigin(0.5);

    this.load.on('progress', (value) => {
      fill.clear();
      fill.fillStyle(0x06d6a0, 1);
      fill.fillRect(bx + 2, by + 2, (barW - 4) * value, barH - 4);
      pct.setText(`${Math.round(value * 100)}%`);
    });
  }

  async create() {
    this._generatePlaceholderTextures();
    await this._loadJournalIcons();

    // Wait for the web font so retro text renders correctly from the start.
    try {
      if (document.fonts && document.fonts.load) {
        await document.fonts.load('16px "Press Start 2P"');
        await document.fonts.ready;
      }
    } catch (e) {
      /* font is optional; fall back to monospace */
    }

    this.scene.start('Title');
  }

  // Load the Field Journal concept icons (SVGs) listed in journal.json as
  // textures keyed `jicon_<id>`. Uses LINEAR filtering so they scale smoothly
  // (the global pixelArt setting otherwise applies NEAREST).
  _loadJournalIcons() {
    return new Promise((resolve) => {
      const journal = this.cache.json.get('journal');
      if (!journal || !journal.entries) return resolve();

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
      // Tolerate a missing icon file without blocking the whole game.
      this.load.once('loaderror', () => {});
      this.load.start();
    });
  }

  // Build all placeholder coloured-rectangle textures used by the game.
  _generatePlaceholderTextures() {
    const make = (key, w, h, draw) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      draw(g);
      g.generateTexture(key, w, h);
      g.destroy();
    };

    // Placeholder "silhouette" icon for unseen journal entries (hides the
    // real concept icon). Renderer-independent — no tinting required.
    make('jicon_unknown', 48, 48, (g) => {
      g.fillStyle(0x141b2e, 1);
      g.fillRoundedRect(3, 3, 42, 42, 11);
      g.lineStyle(3, 0x3a4a66, 1);
      g.strokeRoundedRect(4, 4, 40, 40, 10);
      // a faint "?" suggestion: dot + curve marker
      g.fillStyle(0x3a4a66, 1);
      g.fillCircle(24, 33, 2.5);
      g.lineStyle(3, 0x3a4a66, 1);
      g.beginPath();
      g.arc(24, 21, 6, Phaser.Math.DegToRad(150), Phaser.Math.DegToRad(20), false);
      g.strokePath();
      g.lineBetween(24, 27, 24, 24);
    });

    // Player: 16x16 with a lighter "face" block showing facing direction.
    make('player', 16, 16, (g) => {
      g.fillStyle(0xffd166, 1);
      g.fillRect(2, 2, 12, 12);
      g.fillStyle(0x6b4f1d, 1);
      g.fillRect(5, 5, 6, 4); // face indicator (drawn facing up by default)
    });

    // Companion droplet sprite.
    make('companion', 16, 16, (g) => {
      g.fillStyle(0x4fc3f7, 1);
      g.fillCircle(8, 9, 6);
      g.fillTriangle(8, 0, 4, 6, 12, 6);
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(6, 7, 1.5);
    });

    // Generic NPC / spirit / guardian markers (coloured tiles).
    make('npc_ranger', 16, 16, (g) => {
      g.fillStyle(0xef476f, 1);
      g.fillRect(2, 2, 12, 12);
    });
    make('npc_spirit', 16, 16, (g) => {
      g.fillStyle(0x9b8cff, 1);
      g.fillRect(2, 2, 12, 12);
    });
    make('npc_boss', 16, 16, (g) => {
      g.fillStyle(0xff6b35, 1);
      g.fillRect(1, 1, 14, 14);
    });
    make('npc_sign', 16, 16, (g) => {
      g.fillStyle(0x8d6e63, 1);
      g.fillRect(3, 2, 10, 8);
      g.fillStyle(0x5d4037, 1);
      g.fillRect(7, 10, 2, 5);
    });
    make('door', 16, 16, (g) => {
      g.fillStyle(0x6d4c41, 1);
      g.fillRect(2, 1, 12, 15);
      g.fillStyle(0x3e2723, 1);
      g.fillRect(5, 4, 6, 11);
    });

    // Badge icons.
    const badge = (key, color) =>
      make(key, 24, 24, (g) => {
        g.fillStyle(color, 1);
        g.fillCircle(12, 12, 11);
        g.fillStyle(0xffffff, 0.85);
        g.fillCircle(9, 9, 3);
      });
    badge('badge_water', 0x4fc3f7);
    badge('badge_canopy', 0x66bb6a);
    badge('badge_tideguard', 0x26a69a);
  }
}
