import Phaser from 'phaser';
import GameState from '../systems/GameState.js';
import Audio from '../systems/AudioManager.js';
import { getDialogue, textSpeedToDelay } from '../systems/DialogueManager.js';
import { COLORS, textStyle, bodyTextStyle, drawPanel, uiCamera } from '../systems/Theme.js';
import { measureTextHeight } from '../systems/TextLayout.js';
import { VIEW_W, VIEW_H } from '../main.js';

// NPC conversation overlay — readable text, auto-sized box, dedicated footer row.
export default class DialogueScene extends Phaser.Scene {
  constructor() {
    super('Dialogue');
  }

  init(data) {
    this.dialogueId = data.id;
    this._onClose = data.onClose || null;
  }

  create() {
    uiCamera(this);

    const dlg = getDialogue(this, this.dialogueId);
    this.lines = dlg ? dlg.lines : ['...'];
    this.speaker = dlg ? dlg.speaker : '';
    this.lineIndex = 0;

    this._margin = 6;
    this._pad = 10;
    this._footerH = 18;
    this._speakerH = this.speaker ? 16 : 0;
    this._wrapW = VIEW_W - this._margin * 2 - this._pad * 2;

    this.panelGfx = null;
    this.namePlateGfx = null;

    this.speakerText = this.speaker
      ? this.add.text(this._margin + this._pad, 0, this.speaker, textStyle(10, COLORS.accent))
      : null;

    this.bodyText = this.add.text(this._margin + this._pad, 0, '', bodyTextStyle(11, COLORS.text, this._wrapW));

    this.prompt = this.add
      .text(VIEW_W - this._margin - this._pad, 0, 'Tap SPACE \u25B6', textStyle(9, COLORS.accent))
      .setOrigin(1, 0.5)
      .setVisible(false);

    this._typeDelay = textSpeedToDelay(GameState.data.settings.textSpeed);
    this._startLine();

    this.input.keyboard.on('keydown-SPACE', () => this._advance());
    this.input.keyboard.on('keydown-ENTER', () => this._advance());
    this.input.on('pointerdown', () => this._advance());
  }

  _layoutBox() {
    const measure = this.fullText || ' ';
    const bodyH = measureTextHeight(this, measure, bodyTextStyle(11, COLORS.text, this._wrapW));
    const boxH = Math.min(
      VIEW_H - 12,
      Math.max(72, this._pad + this._speakerH + bodyH + this._footerH + this._pad)
    );
    const boxY = VIEW_H - boxH - this._margin;
    const boxW = VIEW_W - this._margin * 2;

    if (this.panelGfx) this.panelGfx.destroy();
    this.panelGfx = drawPanel(this, this._margin, boxY, boxW, boxH);
    this.panelGfx.setDepth(0);

    if (this.speaker && this.speakerText) {
      const plateW = Math.min(boxW - 8, this.speaker.length * 8 + 20);
      if (this.namePlateGfx) this.namePlateGfx.destroy();
      this.namePlateGfx = drawPanel(this, this._margin + 4, boxY - 10, plateW, 18, { fill: COLORS.panelLight });
      this.namePlateGfx.setDepth(1);
      this.speakerText.setPosition(this._margin + this._pad, boxY + this._pad - 2);
      this.speakerText.setDepth(3);
    }

    const bodyY = boxY + this._pad + this._speakerH;
    this.bodyText.setPosition(this._margin + this._pad, bodyY);
    this.bodyText.setDepth(3);

    const footerY = boxY + boxH - this._pad - this._footerH / 2;
    this.prompt.setPosition(VIEW_W - this._margin - this._pad, footerY);
    this.prompt.setDepth(4);

    this.tweens.killTweensOf(this.prompt);
    this.tweens.add({ targets: this.prompt, alpha: 0.55, duration: 500, yoyo: true, repeat: -1 });
  }

  _startLine() {
    this.fullText = this.lines[this.lineIndex];
    this.charIndex = 0;
    this.typing = true;
    this.prompt.setVisible(false);
    this._layoutBox();
    this.bodyText.setText('');

    if (this._typeEvent) this._typeEvent.remove();
    this._typeEvent = this.time.addEvent({
      delay: this._typeDelay,
      loop: true,
      callback: () => {
        this.charIndex++;
        this.bodyText.setText(this.fullText.substring(0, this.charIndex));
        if (this.charIndex % 4 === 0) Audio.play('move');
        if (this.charIndex >= this.fullText.length) this._finishLine();
      }
    });
  }

  _finishLine() {
    this.typing = false;
    if (this._typeEvent) {
      this._typeEvent.remove();
      this._typeEvent = null;
    }
    this._layoutBox();
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
