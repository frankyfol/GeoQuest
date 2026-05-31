import Phaser from 'phaser';
import GameState from '../systems/GameState.js';
import Audio from '../systems/AudioManager.js';
import { getDialogue, textSpeedToDelay } from '../systems/DialogueManager.js';
import { COLORS, textStyle, drawPanel } from '../systems/Theme.js';
import { VIEW_W, VIEW_H } from '../main.js';

// Overlay scene shown on top of a paused WorldScene. Types out dialogue
// lines one at a time and resumes the world when finished.
export default class DialogueScene extends Phaser.Scene {
  constructor() {
    super('Dialogue');
  }

  init(data) {
    this.dialogueId = data.id;
    this._onClose = data.onClose || null;
  }

  create() {
    const dlg = getDialogue(this, this.dialogueId);
    this.lines = dlg ? dlg.lines : ['...'];
    this.speaker = dlg ? dlg.speaker : '';
    this.lineIndex = 0;

    this._wrapW = VIEW_W - 36;
    this._padTop = 10;
    this._padBottom = 14;

    this.bodyText = this.add.text(16, 0, '', {
      ...textStyle(8),
      wordWrap: { width: this._wrapW },
      lineSpacing: 4
    });

    this.prompt = this.add
      .text(VIEW_W - 16, 0, '\u25BC', textStyle(8, COLORS.accent))
      .setOrigin(1, 0.5)
      .setVisible(false);

    if (this.speaker) {
      this.nameText = this.add.text(16, 0, this.speaker, textStyle(7, COLORS.accent));
    }

    this._typeDelay = textSpeedToDelay(GameState.data.settings.textSpeed);
    this._startLine();

    this.input.keyboard.on('keydown-SPACE', () => this._advance());
    this.input.keyboard.on('keydown-ENTER', () => this._advance());
    this.input.on('pointerdown', () => this._advance());
  }

  // Size the dialogue box to the current line so wrapped text never overlaps
  // the advance prompt or clips outside the panel.
  _layoutLine() {
    const measure = this.fullText || ' ';
    this.bodyText.setText(measure);

    const textH = this.bodyText.height;
    const boxH = Math.min(VIEW_H - 20, Math.max(52, textH + this._padTop + this._padBottom));
    const boxY = VIEW_H - boxH - 6;

    if (this.panelGfx) this.panelGfx.destroy();
    this.panelGfx = drawPanel(this, 6, boxY, VIEW_W - 12, boxH);
    this.panelGfx.setDepth(0);

    if (this.speaker) {
      const plateW = this.speaker.length * 7 + 12;
      if (this.namePlateGfx) this.namePlateGfx.destroy();
      this.namePlateGfx = drawPanel(this, 10, boxY - 12, plateW, 16, { fill: COLORS.panelLight });
      this.namePlateGfx.setDepth(1);
      this.nameText.setPosition(16, boxY - 8);
      this.nameText.setDepth(2);
    }

    this.bodyText.setPosition(16, boxY + this._padTop);
    this.bodyText.setDepth(2);

    const promptY = boxY + boxH - 10;
    this.prompt.setPosition(VIEW_W - 16, promptY);
    this.prompt.setDepth(3);
    this.tweens.killTweensOf(this.prompt);
    this.tweens.add({ targets: this.prompt, y: promptY + 3, duration: 500, yoyo: true, repeat: -1 });
  }

  _startLine() {
    this.fullText = this.lines[this.lineIndex];
    this.charIndex = 0;
    this.typing = true;
    this.prompt.setVisible(false);
    this._layoutLine();
    this.bodyText.setText('');

    if (this._typeEvent) this._typeEvent.remove();
    this._typeEvent = this.time.addEvent({
      delay: this._typeDelay,
      loop: true,
      callback: () => {
        this.charIndex++;
        this.bodyText.setText(this.fullText.substring(0, this.charIndex));
        if (this.charIndex % 3 === 0) Audio.play('move');
        if (this.charIndex >= this.fullText.length) {
          this._finishLine();
        }
      }
    });
  }

  _finishLine() {
    this.typing = false;
    if (this._typeEvent) {
      this._typeEvent.remove();
      this._typeEvent = null;
    }
    this._layoutLine();
    this.bodyText.setText(this.fullText);
    this.prompt.setVisible(true);
  }

  _advance() {
    if (this.typing) {
      this._finishLine();
      return;
    }
    this.lineIndex++;
    if (this.lineIndex >= this.lines.length) {
      this._close();
    } else {
      Audio.play('select');
      this._startLine();
    }
  }

  _close() {
    Audio.play('close');
    const cb = this._onClose;
    this.scene.stop();
    this.scene.resume('World');
    if (cb) cb();
  }
}
