import Phaser from 'phaser';
import GameState from '../systems/GameState.js';
import Audio from '../systems/AudioManager.js';
import { getDialogue, textSpeedToDelay } from '../systems/DialogueManager.js';
import { COLORS, textStyle, drawPanel, uiCamera } from '../systems/Theme.js';
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
    uiCamera(this);
    const dlg = getDialogue(this, this.dialogueId);
    this.lines = dlg ? dlg.lines : ['...'];
    this.speaker = dlg ? dlg.speaker : '';
    this.lineIndex = 0;

    const boxH = 64;
    const boxY = VIEW_H - boxH - 6;
    drawPanel(this, 6, boxY, VIEW_W - 12, boxH);

    // Speaker nameplate.
    if (this.speaker) {
      drawPanel(this, 10, boxY - 12, this.speaker.length * 7 + 12, 16, { fill: COLORS.panelLight });
      this.add.text(16, boxY - 8, this.speaker, textStyle(7, COLORS.accent));
    }

    this.bodyText = this.add.text(16, boxY + 10, '', {
      ...textStyle(8),
      wordWrap: { width: VIEW_W - 36 },
      lineSpacing: 4
    });

    this.prompt = this.add
      .text(VIEW_W - 16, boxY + boxH - 10, '\u25BC', textStyle(8, COLORS.accent))
      .setOrigin(1, 0.5)
      .setVisible(false);
    this.tweens.add({ targets: this.prompt, y: boxY + boxH - 7, duration: 500, yoyo: true, repeat: -1 });

    this._typeDelay = textSpeedToDelay(GameState.data.settings.textSpeed);
    this._startLine();

    // Advance on key / click / tap.
    this.input.keyboard.on('keydown-SPACE', () => this._advance());
    this.input.keyboard.on('keydown-ENTER', () => this._advance());
    this.input.on('pointerdown', () => this._advance());
  }

  _startLine() {
    this.fullText = this.lines[this.lineIndex];
    this.charIndex = 0;
    this.typing = true;
    this.prompt.setVisible(false);
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
    this.bodyText.setText(this.fullText);
    this.prompt.setVisible(true);
  }

  _advance() {
    if (this.typing) {
      // Reveal the whole line instantly on first press.
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
