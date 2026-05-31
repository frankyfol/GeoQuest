import Phaser from 'phaser';
import GameState from '../systems/GameState.js';
import Audio from '../systems/AudioManager.js';
import { COLORS, textStyle, drawPanel } from '../systems/Theme.js';
import { VIEW_W, VIEW_H } from '../main.js';

const REGION_TABS = [
  { id: 'hydro_valley', label: 'Water' },
  { id: 'verdant_canopy', label: 'Forest' },
  { id: 'tidewood_mangroves', label: 'Coast' },
  { id: 'general', label: 'Other' }
];

const STATE_COLOR = { unseen: 0x44506b, seen: 0xffd166, mastered: 0x06d6a0 };
const STATE_LABEL = { unseen: 'Unseen', seen: 'Seen', mastered: 'Mastered' };

export default class JournalScene extends Phaser.Scene {
  constructor() {
    super('Journal');
  }

  create() {
    this.entries = this.cache.json.get('journal').entries;
    // Default to the tab for the current region (fall back to first tab).
    this.activeRegion = REGION_TABS.some((t) => t.id === GameState.data.currentRegion)
      ? GameState.data.currentRegion
      : 'hydro_valley';

    this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x000000, 0.85).setOrigin(0).setInteractive();
    drawPanel(this, 4, 4, VIEW_W - 8, VIEW_H - 8);

    this.add.text(VIEW_W / 2, 9, 'FIELD JOURNAL', textStyle(10, COLORS.accent)).setOrigin(0.5, 0);

    const total = this.entries.length;
    const mastered = this.entries.filter((e) => GameState.getJournalState(e.id) === 'mastered').length;
    this.progressText = this.add
      .text(VIEW_W / 2, 23, `Mastered ${mastered} / ${total}`, textStyle(7, COLORS.good))
      .setOrigin(0.5, 0);

    this._buildTabs();
    this.listContainer = this.add.container(0, 0);
    this._buildDetail();
    this._renderList();

    const close = () => this._close();
    this.input.keyboard.on('keydown-J', close);
    this.input.keyboard.on('keydown-ESC', close);
    this.closeBtn = this.add.text(VIEW_W - 14, 9, 'X', textStyle(9, COLORS.bad)).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    this.closeBtn.on('pointerdown', close);
  }

  _buildTabs() {
    this.tabObjs = [];
    const tabW = 56;
    const gap = 2;
    const totalW = REGION_TABS.length * tabW + (REGION_TABS.length - 1) * gap;
    const startX = (VIEW_W - totalW) / 2;
    REGION_TABS.forEach((tab, i) => {
      const x = startX + i * (tabW + gap);
      const box = this.add.rectangle(x, 36, tabW, 14, COLORS.panelLight, 1).setOrigin(0).setStrokeStyle(1, COLORS.border).setInteractive({ useHandCursor: true });
      this.add.text(x + tabW / 2, 43, tab.label, textStyle(7)).setOrigin(0.5);
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

    this.detailIcon = this.add.image(30, this.detailY + 24, 'pixel').setDisplaySize(34, 34).setVisible(false);
    this.detailTitle = this.add.text(52, this.detailY + 5, 'Select an entry', textStyle(7, COLORS.accent));
    this.detailChip = this.add.text(VIEW_W - 14, this.detailY + 5, '', textStyle(6, COLORS.textDim)).setOrigin(1, 0);
    this.detailBody = this.add.text(52, this.detailY + 17, 'Tap an entry to read it. Mastered entries make a handy revision tool before a test.', {
      ...textStyle(6, COLORS.text),
      wordWrap: { width: VIEW_W - 70 },
      lineSpacing: 2
    });
  }

  _showDetail(entry) {
    const state = GameState.getJournalState(entry.id);
    // Unseen entries stay hidden behind a neutral placeholder.
    const iconKey = state === 'unseen' ? 'jicon_unknown' : `jicon_${entry.id}`;

    if (this.textures.exists(iconKey)) {
      this.detailIcon.setTexture(iconKey).setDisplaySize(34, 34).setVisible(true);
    } else {
      this.detailIcon.setVisible(false);
    }

    this.detailChip.setText(STATE_LABEL[state]).setColor(state === 'mastered' ? COLORS.good : state === 'seen' ? COLORS.accent : COLORS.textDim);

    if (state === 'unseen') {
      this.detailTitle.setText('??? (Unseen)');
      this.detailBody.setText('Discover this concept by talking to spirits and answering their challenges.');
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
    const cardH = 15;
    const startX = 10;
    const startY = 56;

    if (regionEntries.length === 0) {
      this.listContainer.add(this.add.text(VIEW_W / 2, startY + 20, 'No entries here yet.', textStyle(7, COLORS.textDim)).setOrigin(0.5));
      return;
    }

    regionEntries.forEach((entry, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = startX + col * (cardW + 2);
      const y = startY + row * (cardH + 1);
      const state = GameState.getJournalState(entry.id);

      const box = this.add.rectangle(x, y, cardW, cardH, COLORS.panel, 1).setOrigin(0).setStrokeStyle(1, COLORS.border).setInteractive({ useHandCursor: true });
      const objs = [box];

      // Concept icon — unseen entries show a neutral placeholder silhouette.
      const iconKey = state === 'unseen' ? 'jicon_unknown' : `jicon_${entry.id}`;
      if (this.textures.exists(iconKey)) {
        const ic = this.add.image(x + 9, y + cardH / 2, iconKey).setDisplaySize(12, 12);
        objs.push(ic);
      }

      const titleStr = state === 'unseen' ? '???' : entry.title;
      const label = this.add
        .text(x + 18, y + 4, titleStr, textStyle(6, state === 'unseen' ? COLORS.textDim : COLORS.text))
        .setWordWrapWidth(cardW - 26);
      objs.push(label);

      // State indicator dot (top-right of the card).
      const dot = this.add.circle(x + cardW - 6, y + 5, 2.5, STATE_COLOR[state]);
      objs.push(dot);

      box.on('pointerover', () => box.setFillStyle(0x2a3a66));
      box.on('pointerout', () => box.setFillStyle(COLORS.panel));
      box.on('pointerdown', () => {
        Audio.play('move');
        this._showDetail(entry);
      });

      this.listContainer.add(objs);
    });
  }

  _close() {
    Audio.play('close');
    this.scene.stop();
    this.scene.resume('World');
  }
}
