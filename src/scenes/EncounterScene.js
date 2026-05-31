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
    // sky + ground bands (kept compact so the answer panel is large)
    this.add.rectangle(0, 0, VIEW_W, 54, 0x223a66).setOrigin(0);
    this.add.rectangle(0, 54, VIEW_W, 44, 0x2e7d32).setOrigin(0);

    // Title
    this.add.text(VIEW_W / 2, 4, this.encounter.title, textStyle(8, COLORS.accent)).setOrigin(0.5, 0);

    // Challenge meter
    this.add.text(8, 20, 'CHALLENGE', textStyle(6, COLORS.textDim));
    this.meterBg = this.add.rectangle(8, 30, 180, 8, 0x000000, 0.5).setOrigin(0);
    this.meterBg.setStrokeStyle(1, COLORS.border);
    this.meterFill = this.add.rectangle(9, 31, 178, 6, 0xef476f).setOrigin(0);
    this._meterMax = 178;

    // Guardian sprite (challenge) on the right.
    const isBoss = this.encounter.isBoss;
    this.guardian = this.add.image(258, 54, isBoss ? 'npc_boss' : 'npc_spirit').setScale(isBoss ? 1.0 : 0.8);
    this.tweens.add({ targets: this.guardian, y: 50, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // Companion on the left.
    this.companion = this.add.image(52, 70, 'companion').setScale(0.6);
    this.tweens.add({ targets: this.companion, y: 66, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.levelText = this.add.text(8, 84, `Lv ${GameState.data.companionLevel}  XP ${GameState.data.companionXP}`, textStyle(6, COLORS.text));

    // Bottom answer panel (large, with a little headroom for sprites).
    this.panel = { x: 6, y: 98, w: VIEW_W - 12, h: VIEW_H - 104 };
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

    // Draw the prompt, then begin the answer widgets just below it so nothing
    // can overlap regardless of how many lines the prompt wraps to.
    const prompt = this._panelText(q.prompt, 6, { size: 8 });
    const startY = prompt.y + prompt.height + 7;

    switch (q.type) {
      case 'mcq':
        this._renderChoices(q.options, (i) => this._submit(i), startY);
        break;
      case 'truefalse':
        this._renderChoices(['True', 'False'], (i) => this._submit(i === 0), startY);
        break;
      case 'multi':
        this._renderMulti(q, startY);
        break;
      case 'sequence':
        this._renderSequence(q, startY);
        break;
      case 'match':
        this._renderMatch(q, startY);
        break;
      default:
        this._panelText('Unsupported question type.', 40, { color: COLORS.bad });
    }
  }

  // Creates an answer row whose box is sized to fit its (wrapped) text, and
  // returns where the next row should start. Prevents any overlap.
  _optionRow(y, label, opts = {}) {
    const x = opts.x !== undefined ? opts.x : this.panel.x + 8;
    const w = opts.w !== undefined ? opts.w : this.panel.w - 16;
    const box = this.add.rectangle(x, y, w, 15, opts.fill || COLORS.panelLight, 1).setOrigin(0).setStrokeStyle(1, COLORS.border);
    const t = this.add
      .text(x + 6, y + 3, label, { ...textStyle(opts.size || 7), wordWrap: { width: w - 14 }, lineSpacing: 1 })
      .setOrigin(0);
    const h = Math.max(15, Math.ceil(t.height) + 6);
    box.setSize(w, h);
    box.setInteractive({ useHandCursor: true });
    this.widgets.push(box, t);
    return { box, t, h, bottom: y + h };
  }

  // ----- choice-style (mcq / truefalse) ------------------------------
  _renderChoices(options, onPick, startY) {
    let y = startY;
    options.forEach((opt, i) => {
      const { box, bottom } = this._optionRow(y, `${i + 1}. ${opt}`, { size: 7 });
      box.on('pointerover', () => box.setFillStyle(0x3a5088));
      box.on('pointerout', () => box.setFillStyle(COLORS.panelLight));
      box.on('pointerdown', () => {
        Audio.play('select');
        onPick(i);
      });
      y = bottom + 3;
    });
    this._numberHandler = (i) => {
      if (i >= 0 && i < options.length) {
        Audio.play('select');
        onPick(i);
      }
    };
  }

  // ----- multi (choose all that apply) -------------------------------
  _renderMulti(q, startY) {
    const selected = new Set();
    const toggles = [];
    let y = startY;
    q.options.forEach((opt, i) => {
      const { box, t, bottom } = this._optionRow(y, `[ ] ${i + 1}. ${opt}`, { size: 7 });
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
      toggles.push(toggle);
      y = bottom + 3;
    });

    const submit = this.add.text(this.panel.x + this.panel.w - 8, y + 1, 'SUBMIT \u25B6', textStyle(8, COLORS.good)).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    submit.on('pointerdown', () => {
      Audio.play('select');
      this._submit([...selected]);
    });
    this.widgets.push(submit);

    this._numberHandler = (i) => {
      if (i >= 0 && i < toggles.length) toggles[i]();
    };
    this._confirmHandler = () => {
      Audio.play('select');
      this._submit([...selected]);
    };
  }

  // ----- sequence (tap items into order) -----------------------------
  _renderSequence(q, startY) {
    const chosen = [];
    const picks = [];
    const hint = this.add.text(this.panel.x + 8, startY, 'Tap the items in the correct order:', textStyle(6, COLORS.textDim));
    this.widgets.push(hint);
    let y = startY + hint.height + 3;

    q.items.forEach((item, i) => {
      const row = this._optionRow(y, item, { size: 7 });
      const pick = () => {
        if (chosen.includes(i)) return;
        chosen.push(i);
        row.box.setFillStyle(0x2e7d32);
        row.t.setText(`${chosen.indexOf(i) + 1}.  ${item}`);
        Audio.play('move');
        if (chosen.length === q.items.length) {
          this.time.delayedCall(200, () => this._submit([...chosen]));
        }
      };
      row.box.on('pointerdown', pick);
      picks.push(pick);
      y = row.bottom + 3;
    });

    const reset = this.add.text(this.panel.x + this.panel.w - 8, y + 1, 'RESET', textStyle(8, COLORS.accent)).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    reset.on('pointerdown', () => {
      Audio.play('close');
      this._showQuestion();
    });
    this.widgets.push(reset);

    this._numberHandler = (i) => {
      if (i >= 0 && i < picks.length) picks[i]();
    };
  }

  // ----- match (pair left to right) ----------------------------------
  _renderMatch(q, startY) {
    const pairs = [];
    let selectedLeft = null;
    const colW = (this.panel.w - 22) / 2;
    const leftX = this.panel.x + 8;
    const rightX = this.panel.x + 14 + colW;

    const hint = this.add.text(this.panel.x + 8, startY, 'Tap a left item, then its match:', textStyle(6, COLORS.textDim));
    this.widgets.push(hint);
    const top = startY + hint.height + 3;

    const leftObjs = [];
    const refreshLabels = () => {
      leftObjs.forEach((o, i) => {
        const p = pairs.find((pr) => pr[0] === i);
        o.box.setFillStyle(selectedLeft === i ? 0x3a5088 : p ? 0x2e7d32 : COLORS.panelLight);
        o.t.setText(`${i + 1}. ${q.left[i]}` + (p ? `  =${String.fromCharCode(65 + p[1])}` : ''));
      });
    };

    let ly = top;
    q.left.forEach((item, i) => {
      const row = this._optionRow(ly, `${i + 1}. ${item}`, { size: 6, x: leftX, w: colW });
      row.box.on('pointerdown', () => {
        selectedLeft = i;
        Audio.play('move');
        refreshLabels();
      });
      leftObjs.push(row);
      ly = row.bottom + 3;
    });

    let ry = top;
    q.right.forEach((item, j) => {
      const row = this._optionRow(ry, `${String.fromCharCode(65 + j)}. ${item}`, { size: 6, x: rightX, w: colW });
      row.box.on('pointerdown', () => {
        if (selectedLeft === null) return;
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
      ry = row.bottom + 3;
    });

    const reset = this.add.text(this.panel.x + this.panel.w - 8, Math.max(ly, ry) + 1, 'RESET', textStyle(8, COLORS.accent)).setOrigin(1, 0).setInteractive({ useHandCursor: true });
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
    const head = this._panelText('Correct!', 6, { color: COLORS.good });
    this._panelText(q.explanation, head.y - this.panel.y + head.height + 6, { size: 7 });
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
    const head = this._panelText('Not quite — try again!', 6, { color: COLORS.bad });
    this._panelText('Hint: ' + q.hint, head.y - this.panel.y + head.height + 6, { size: 7, color: COLORS.accent });
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
