import Phaser from 'phaser';
import GameState from '../systems/GameState.js';
import Audio from '../systems/AudioManager.js';
import { checkAnswer } from '../systems/QuestionEngine.js';
import { COLORS, textStyle, drawPanel, uiCamera } from '../systems/Theme.js';
import { VIEW_W, VIEW_H } from '../main.js';

// The quiz "battle" engine. You cannot lose: wrong answers show a hint and
// let you retry the same question. Supports mcq, truefalse, multi, sequence, match.
export default class EncounterScene extends Phaser.Scene {
  constructor() {
    super('Encounter');
  }

  init(data) {
    this.encounterId = data.id;
  }

  create() {
    uiCamera(this);
    const qdata = this.cache.json.get('questions');
    this.regions = this.cache.json.get('regions').regions;
    this.encounter = qdata.encounters.find((e) => e.id === this.encounterId);
    if (!this.encounter) {
      console.warn('Encounter not found:', this.encounterId);
      return this._returnToWorld();
    }
    const pool = qdata.pool;
    this.questions = this.encounter.questions.map((id) => pool.find((q) => q.id === id)).filter(Boolean);

    this.qIndex = 0;
    this.answeredCount = 0;
    this.awardedXP = new Set();
    // Generic widget tracking so we can clear between states. Must exist
    // BEFORE _showIntro() so the intro text is tracked and later cleared.
    this.widgets = [];

    this._buildScaffold();
    this._showIntro();

    Audio.playMusic('encounter');

    // Number keys select options where relevant.
    this.input.keyboard.on('keydown', (e) => {
      const n = parseInt(e.key, 10);
      if (!isNaN(n) && this._numberHandler) this._numberHandler(n - 1);
      if ((e.code === 'Space' || e.code === 'Enter') && this._confirmHandler) this._confirmHandler();
    });
  }

  // ---- static battle scaffold ---------------------------------------
  _buildScaffold() {
    this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x10162e).setOrigin(0);
    // sky band
    this.add.rectangle(0, 0, VIEW_W, 70, 0x223a66).setOrigin(0);
    this.add.rectangle(0, 70, VIEW_W, 48, 0x2e7d32).setOrigin(0);

    // Title
    this.add.text(VIEW_W / 2, 6, this.encounter.title, textStyle(8, COLORS.accent)).setOrigin(0.5, 0);

    // Challenge meter
    this.add.text(8, 22, 'CHALLENGE', textStyle(6, COLORS.textDim));
    this.meterBg = this.add.rectangle(8, 32, 180, 8, 0x000000, 0.5).setOrigin(0);
    this.meterBg.setStrokeStyle(1, COLORS.border);
    this.meterFill = this.add.rectangle(9, 33, 178, 6, 0xef476f).setOrigin(0);
    this._meterMax = 178;

    // Guardian sprite (challenge) on the right.
    const isBoss = this.encounter.isBoss;
    this.guardian = this.add.image(255, 70, isBoss ? 'npc_boss' : 'npc_spirit').setScale(isBoss ? 1.1 : 0.85);
    this.tweens.add({ targets: this.guardian, y: 66, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // Companion on the left.
    this.companion = this.add.image(55, 96, 'companion').setScale(0.65);
    this.tweens.add({ targets: this.companion, y: 92, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.levelText = this.add.text(8, 100, `Lv ${GameState.data.companionLevel}  XP ${GameState.data.companionXP}`, textStyle(6, COLORS.text));

    // Bottom panel.
    this.panel = { x: 6, y: 118, w: VIEW_W - 12, h: VIEW_H - 124 };
    drawPanel(this, this.panel.x, this.panel.y, this.panel.w, this.panel.h);
  }

  _updateMeter() {
    const remaining = 1 - this.answeredCount / this.questions.length;
    this.tweens.add({
      targets: this.meterFill,
      displayWidth: Math.max(0, this._meterMax * remaining),
      duration: 300,
      ease: 'Sine.out'
    });
  }

  // ---- text helpers --------------------------------------------------
  _clearWidgets() {
    if (this.widgets) this.widgets.forEach((w) => w.destroy());
    this.widgets = [];
    this._numberHandler = null;
    this._confirmHandler = null;
  }

  _panelText(str, y, opts = {}) {
    const t = this.add.text(this.panel.x + 8, this.panel.y + (y || 6), str, {
      ...textStyle(opts.size || 8, opts.color || COLORS.text),
      wordWrap: { width: this.panel.w - 16 },
      lineSpacing: 3
    });
    this.widgets.push(t);
    return t;
  }

  _continuePrompt(onContinue) {
    const p = this.add
      .text(this.panel.x + this.panel.w - 10, this.panel.y + this.panel.h - 8, 'Press SPACE \u25B6', textStyle(7, COLORS.accent))
      .setOrigin(1, 1)
      .setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: p, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
    this.widgets.push(p);
    this._confirmHandler = onContinue;
    p.on('pointerdown', onContinue);
  }

  // ---- flow ----------------------------------------------------------
  _showIntro() {
    this._clearWidgets();
    this._panelText(this.encounter.intro, 8);
    this._continuePrompt(() => {
      Audio.play('select');
      this._showQuestion();
    });
  }

  _showQuestion() {
    this._clearWidgets();
    this.currentQuestion = this.questions[this.qIndex];
    const q = this.currentQuestion;

    // First sight of a concept marks it "seen".
    GameState.setJournal(q.concept, 'seen');
    GameState.save();

    this._panelText(q.prompt, 6, { size: 8 });

    switch (q.type) {
      case 'mcq':
        this._renderChoices(q.options, (i) => this._submit(i));
        break;
      case 'truefalse':
        this._renderChoices(['True', 'False'], (i) => this._submit(i === 0));
        break;
      case 'multi':
        this._renderMulti(q);
        break;
      case 'sequence':
        this._renderSequence(q);
        break;
      case 'match':
        this._renderMatch(q);
        break;
      default:
        this._panelText('Unsupported question type.', 40, { color: COLORS.bad });
    }
  }

  // ----- choice-style (mcq / truefalse) ------------------------------
  _renderChoices(options, onPick) {
    const startY = this.panel.y + 36;
    const rowH = 18;
    options.forEach((opt, i) => {
      const y = startY + i * rowH;
      const box = this.add.rectangle(this.panel.x + 8, y, this.panel.w - 16, rowH - 2, COLORS.panelLight, 1).setOrigin(0).setStrokeStyle(1, COLORS.border).setInteractive({ useHandCursor: true });
      const t = this.add
        .text(this.panel.x + 14, y + 3, `${i + 1}. ${opt}`, {
          ...textStyle(6),
          wordWrap: { width: this.panel.w - 28 },
          lineSpacing: 1
        })
        .setOrigin(0);
      box.on('pointerover', () => box.setFillStyle(0x3a5088));
      box.on('pointerout', () => box.setFillStyle(COLORS.panelLight));
      box.on('pointerdown', () => {
        Audio.play('select');
        onPick(i);
      });
      this.widgets.push(box, t);
    });
    this._numberHandler = (i) => {
      if (i >= 0 && i < options.length) {
        Audio.play('select');
        onPick(i);
      }
    };
  }

  // ----- multi (choose all that apply) -------------------------------
  _renderMulti(q) {
    const selected = new Set();
    const startY = this.panel.y + 36;
    const rowH = 15;
    const boxes = [];
    q.options.forEach((opt, i) => {
      const y = startY + i * rowH;
      const box = this.add.rectangle(this.panel.x + 8, y, this.panel.w - 16, rowH - 3, COLORS.panelLight, 1).setOrigin(0).setStrokeStyle(1, COLORS.border).setInteractive({ useHandCursor: true });
      const t = this.add.text(this.panel.x + 14, y + 2, `[ ] ${i + 1}. ${opt}`, { ...textStyle(6), wordWrap: { width: this.panel.w - 30 } }).setOrigin(0);
      const toggle = () => {
        if (selected.has(i)) {
          selected.delete(i);
          box.setFillStyle(COLORS.panelLight);
          t.setText(`[ ] ${i + 1}. ${opt}`);
        } else {
          selected.add(i);
          box.setFillStyle(0x2e7d32);
          t.setText(`[x] ${i + 1}. ${opt}`);
        }
        Audio.play('move');
      };
      box.on('pointerdown', toggle);
      boxes.push(toggle);
      this.widgets.push(box, t);
    });

    const submit = this.add.text(this.panel.x + this.panel.w - 10, this.panel.y + this.panel.h - 8, 'SUBMIT \u25B6', textStyle(7, COLORS.good)).setOrigin(1, 1).setInteractive({ useHandCursor: true });
    submit.on('pointerdown', () => {
      Audio.play('select');
      this._submit([...selected]);
    });
    this.widgets.push(submit);

    this._numberHandler = (i) => {
      if (i >= 0 && i < boxes.length) boxes[i]();
    };
    this._confirmHandler = () => {
      Audio.play('select');
      this._submit([...selected]);
    };
  }

  // ----- sequence (tap items into order) -----------------------------
  _renderSequence(q) {
    const chosen = [];
    const startY = this.panel.y + 34;
    const rowH = 14;
    const orderText = this.add.text(this.panel.x + 8, this.panel.y + this.panel.h - 30, 'Order: (tap items in order)', textStyle(6, COLORS.textDim));
    this.widgets.push(orderText);

    const itemObjs = [];
    q.items.forEach((item, i) => {
      const y = startY + i * rowH;
      const box = this.add.rectangle(this.panel.x + 8, y, this.panel.w - 16, rowH - 3, COLORS.panelLight, 1).setOrigin(0).setStrokeStyle(1, COLORS.border).setInteractive({ useHandCursor: true });
      const t = this.add.text(this.panel.x + 14, y + 2, item, textStyle(7)).setOrigin(0);
      const pick = () => {
        if (chosen.includes(i)) return;
        chosen.push(i);
        box.setFillStyle(0x2e7d32);
        t.setText(`${chosen.indexOf(i) + 1}. ${item}`);
        Audio.play('move');
        orderText.setText('Order: ' + chosen.map((c) => c + 1).join(' \u2192 '));
        if (chosen.length === q.items.length) {
          this.time.delayedCall(200, () => this._submit([...chosen]));
        }
      };
      box.on('pointerdown', pick);
      itemObjs.push(pick);
      this.widgets.push(box, t);
    });

    const reset = this.add.text(this.panel.x + this.panel.w - 10, this.panel.y + this.panel.h - 8, 'RESET', textStyle(7, COLORS.accent)).setOrigin(1, 1).setInteractive({ useHandCursor: true });
    reset.on('pointerdown', () => {
      Audio.play('close');
      this._showQuestion();
    });
    this.widgets.push(reset);

    this._numberHandler = (i) => {
      if (i >= 0 && i < itemObjs.length) itemObjs[i]();
    };
  }

  // ----- match (pair left to right) ----------------------------------
  _renderMatch(q) {
    const pairs = [];
    let selectedLeft = null;
    const startY = this.panel.y + 32;
    const rowH = 18;
    const colW = (this.panel.w - 24) / 2;

    const leftObjs = [];
    const rightObjs = [];

    const refreshLabels = () => {
      leftObjs.forEach((o, i) => {
        const p = pairs.find((pr) => pr[0] === i);
        o.box.setFillStyle(p ? 0x2e7d32 : COLORS.panelLight);
        o.t.setText(`${i + 1}. ${q.left[i]}` + (p ? ` =${String.fromCharCode(65 + p[1])}` : ''));
        if (selectedLeft === i) o.box.setFillStyle(0x3a5088);
      });
    };

    q.left.forEach((item, i) => {
      const y = startY + i * rowH;
      const box = this.add.rectangle(this.panel.x + 8, y, colW, rowH - 4, COLORS.panelLight, 1).setOrigin(0).setStrokeStyle(1, COLORS.border).setInteractive({ useHandCursor: true });
      const t = this.add.text(this.panel.x + 12, y + 3, `${i + 1}. ${item}`, textStyle(6)).setOrigin(0).setWordWrapWidth(colW - 8);
      box.on('pointerdown', () => {
        selectedLeft = i;
        Audio.play('move');
        refreshLabels();
      });
      leftObjs.push({ box, t });
      this.widgets.push(box, t);
    });

    q.right.forEach((item, j) => {
      const y = startY + j * rowH;
      const box = this.add.rectangle(this.panel.x + 16 + colW, y, colW, rowH - 4, COLORS.panelLight, 1).setOrigin(0).setStrokeStyle(1, COLORS.border).setInteractive({ useHandCursor: true });
      const t = this.add.text(this.panel.x + 20 + colW, y + 3, `${String.fromCharCode(65 + j)}. ${item}`, textStyle(6)).setOrigin(0).setWordWrapWidth(colW - 8);
      box.on('pointerdown', () => {
        if (selectedLeft === null) return;
        // remove any existing pair with this left or right
        for (let k = pairs.length - 1; k >= 0; k--) {
          if (pairs[k][0] === selectedLeft || pairs[k][1] === j) pairs.splice(k, 1);
        }
        pairs.push([selectedLeft, j]);
        selectedLeft = null;
        Audio.play('select');
        refreshLabels();
        if (pairs.length === q.left.length) {
          this.time.delayedCall(200, () => this._submit(pairs.map((p) => [p[0], p[1]])));
        }
      });
      rightObjs.push({ box, t });
      this.widgets.push(box, t);
    });

    const reset = this.add.text(this.panel.x + this.panel.w - 10, this.panel.y + this.panel.h - 8, 'RESET', textStyle(7, COLORS.accent)).setOrigin(1, 1).setInteractive({ useHandCursor: true });
    reset.on('pointerdown', () => {
      Audio.play('close');
      this._showQuestion();
    });
    this.widgets.push(reset);
  }

  // ---- grading -------------------------------------------------------
  _submit(response) {
    const q = this.currentQuestion;
    const { correct } = checkAnswer(q, response);
    if (correct) this._onCorrect(q);
    else this._onIncorrect(q);
  }

  _onCorrect(q) {
    Audio.play('correct');
    this.answeredCount++;
    this._updateMeter();

    GameState.setJournal(q.concept, 'mastered');
    if (!this.awardedXP.has(q.id)) {
      this.awardedXP.add(q.id);
      GameState.addCompanionXP(20);
      this.levelText.setText(`Lv ${GameState.data.companionLevel}  XP ${GameState.data.companionXP}`);
    }
    GameState.save();

    // Flash the guardian.
    this.tweens.add({ targets: this.guardian, alpha: 0.3, duration: 90, yoyo: true, repeat: 1 });

    this._clearWidgets();
    this._panelText('Correct!', 6, { color: COLORS.good });
    this._panelText(q.explanation, 22, { size: 7 });
    this._continuePrompt(() => {
      Audio.play('select');
      this.qIndex++;
      if (this.answeredCount >= this.questions.length) this._victory();
      else this._showQuestion();
    });
  }

  _onIncorrect(q) {
    Audio.play('incorrect');
    // Companion shakes to acknowledge.
    this.tweens.add({ targets: this.companion, x: 50, duration: 60, yoyo: true, repeat: 2, onComplete: () => this.companion.setX(55) });

    this._clearWidgets();
    this._panelText('Not quite — try again!', 6, { color: COLORS.bad });
    this._panelText('Hint: ' + q.hint, 22, { size: 7, color: COLORS.accent });
    this._continuePrompt(() => {
      Audio.play('select');
      this._showQuestion();
    });
  }

  // ---- victory / progression ----------------------------------------
  _victory() {
    GameState.markEncounterCleared(this.encounter.id);
    GameState.save();

    this._clearWidgets();
    this._panelText(this.encounter.victory, 8, { color: COLORS.good });

    // Boss: award badge and unlock next region with a celebration.
    if (this.encounter.isBoss) {
      this._awardBadge();
    } else {
      this._continuePrompt(() => this._returnToWorld());
    }
  }

  _awardBadge() {
    const region = this.regions.find((r) => r.id === this.encounter.region);
    const badge = region ? region.badge : null;
    GameState.earnBadge(badge, this.regions);
    GameState.save();
    Audio.play('badge');

    // Celebration overlay.
    const cx = VIEW_W / 2;
    const cy = VIEW_H / 2;
    const overlay = this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x000000, 0.75).setOrigin(0).setInteractive();
    const badgeKey = badge === 'water' ? 'badge_water' : badge === 'canopy' ? 'badge_canopy' : 'badge_tideguard';
    const icon = this.add.image(cx, cy - 16, badgeKey).setScale(0);
    this.tweens.add({ targets: icon, scale: 3, duration: 600, ease: 'Back.out' });
    this.tweens.add({ targets: icon, angle: 360, duration: 1600, repeat: -1, ease: 'Linear' });

    const names = { water: 'WATER DROP BADGE', canopy: 'CANOPY BADGE', tideguard: 'TIDEGUARD BADGE' };
    this.add.text(cx, cy + 26, 'BADGE EARNED!', textStyle(10, COLORS.accent)).setOrigin(0.5);
    this.add.text(cx, cy + 44, names[badge] || '', textStyle(8, COLORS.good)).setOrigin(0.5);
    const cont = this.add.text(cx, cy + 70, 'Press SPACE to continue', textStyle(7, COLORS.text)).setOrigin(0.5);
    this.tweens.add({ targets: cont, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });

    const finish = () => this._returnToWorld();
    overlay.on('pointerdown', finish);
    this.input.keyboard.once('keydown-SPACE', finish);
    this.input.keyboard.once('keydown-ENTER', finish);
  }

  _returnToWorld() {
    Audio.stopMusic();
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.scene.resume('World');
    });
  }
}
