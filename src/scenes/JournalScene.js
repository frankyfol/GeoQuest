import Phaser from 'phaser';
import GameState from '../systems/GameState.js';
import Audio from '../systems/AudioManager.js';
import { COLORS, textStyle, drawPanel } from '../systems/Theme.js';
import { VIEW_W, VIEW_H } from '../main.js';

const REGION_TABS = [
  { id: 'hydro_valley', label: 'Water' },
  { id: 'verdant_canopy', label: 'Forest' },
  { id: 'tidewood_mangroves', label: 'Coast' }
];

const CHIP = {
  unseen: { text: 'Unseen', color: '#6b7a99' },
  seen: { text: 'Seen', color: '#ffd166' },
  mastered: { text: 'Mastered', color: '#06d6a0' }
};

export default class JournalScene extends Phaser.Scene {
  constructor() {
    super('Journal');
  }

  create() {
    this.entries = this.cache.json.get('journal').entries;
    this.activeRegion = GameState.data.currentRegion || 'hydro_valley';

    this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x000000, 0.85).setOrigin(0).setInteractive();
    drawPanel(this, 4, 4, VIEW_W - 8, VIEW_H - 8);

    this.add.text(VIEW_W / 2, 10, 'FIELD JOURNAL', textStyle(10, COLORS.accent)).setOrigin(0.5, 0);

    // Overall mastery progress.
    const total = this.entries.length;
    const mastered = this.entries.filter((e) => GameState.getJournalState(e.id) === 'mastered').length;
    this.progressText = this.add.text(VIEW_W / 2, 24, `Mastered ${mastered} / ${total}`, textStyle(7, COLORS.good)).setOrigin(0.5, 0);

    this._buildTabs();
    this.listContainer = this.add.container(0, 0);
    this._buildDetail();
    this._renderList();

    // Close handlers.
    const close = () => this._close();
    this.input.keyboard.on('keydown-J', close);
    this.input.keyboard.on('keydown-ESC', close);
    this.closeBtn = this.add.text(VIEW_W - 14, 10, 'X', textStyle(9, COLORS.bad)).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    this.closeBtn.on('pointerdown', close);
  }

  _buildTabs() {
    this.tabObjs = [];
    const tabW = 64;
    const startX = VIEW_W / 2 - tabW * 1.5;
    REGION_TABS.forEach((tab, i) => {
      const x = startX + i * tabW;
      const box = this.add.rectangle(x, 38, tabW - 4, 14, COLORS.panelLight, 1).setOrigin(0).setStrokeStyle(1, COLORS.border).setInteractive({ useHandCursor: true });
      const t = this.add.text(x + (tabW - 4) / 2, 45, tab.label, textStyle(7)).setOrigin(0.5);
      box.on('pointerdown', () => {
        Audio.play('select');
        this.activeRegion = tab.id;
        this._renderList();
        this._refreshTabs();
      });
      this.tabObjs.push({ box, id: tab.id });
    });
    this._refreshTabs();
  }

  _refreshTabs() {
    this.tabObjs.forEach((o) => o.box.setFillStyle(o.id === this.activeRegion ? 0x2e7d32 : COLORS.panelLight));
  }

  _buildDetail() {
    this.detailY = VIEW_H - 56;
    drawPanel(this, 8, this.detailY, VIEW_W - 16, 48, { fill: COLORS.panelLight });
    this.detailTitle = this.add.text(14, this.detailY + 4, 'Select an entry', textStyle(7, COLORS.accent));
    this.detailBody = this.add.text(14, this.detailY + 16, 'Mastered entries can be reviewed here before a test.', {
      ...textStyle(6, COLORS.text),
      wordWrap: { width: VIEW_W - 28 },
      lineSpacing: 2
    });
  }

  _showDetail(entry) {
    const state = GameState.getJournalState(entry.id);
    if (state === 'unseen') {
      this.detailTitle.setText('??? (Unseen)');
      this.detailBody.setText('Discover this concept by talking to spirits and answering challenges.');
    } else {
      this.detailTitle.setText(entry.title);
      this.detailBody.setText(entry.definition);
    }
  }

  _renderList() {
    this.listContainer.removeAll(true);
    const regionEntries = this.entries.filter((e) => e.region === this.activeRegion);

    const cols = 2;
    const cardW = (VIEW_W - 24) / cols;
    const cardH = 14;
    const startX = 10;
    const startY = 58;

    regionEntries.forEach((entry, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = startX + col * (cardW + 2);
      const y = startY + row * (cardH + 2);
      const state = GameState.getJournalState(entry.id);

      const box = this.add.rectangle(x, y, cardW, cardH, COLORS.panel, 1).setOrigin(0).setStrokeStyle(1, COLORS.border).setInteractive({ useHandCursor: true });

      // colored state dot
      const dotColor = state === 'mastered' ? 0x06d6a0 : state === 'seen' ? 0xffd166 : 0x44506b;
      const dot = this.add.circle(x + 7, y + cardH / 2, 3, dotColor);

      const titleStr = state === 'unseen' ? '???' : entry.title;
      const label = this.add.text(x + 14, y + 3, titleStr, textStyle(6, state === 'unseen' ? COLORS.textDim : COLORS.text)).setWordWrapWidth(cardW - 18);

      box.on('pointerdown', () => {
        Audio.play('move');
        this._showDetail(entry);
      });

      this.listContainer.add([box, dot, label]);
    });
  }

  _close() {
    Audio.play('close');
    this.scene.stop();
    this.scene.resume('World');
  }
}
