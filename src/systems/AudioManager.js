// AudioManager.js
// Generates all music and sound effects procedurally with the Web Audio API,
// so the game ships with zero audio asset files. Respects GameState.settings.sound.

import GameState from './GameState.js';

class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.musicTimer = null;
    this.currentTrack = null;
  }

  _ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.18;
    this.musicGain.connect(this.master);
  }

  // Browsers require a user gesture before audio can start.
  resume() {
    this._ensure();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  get enabled() {
    return !!GameState.data.settings.sound;
  }

  _tone(freq, start, dur, type = 'square', vol = 0.3, dest = null) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(vol, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain);
    gain.connect(dest || this.master);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  // ---- sound effects -------------------------------------------------
  play(name) {
    if (!this.enabled) return;
    this._ensure();
    this.resume();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'move':
        this._tone(220, t, 0.05, 'square', 0.12);
        break;
      case 'select':
        this._tone(523, t, 0.08, 'square', 0.2);
        break;
      case 'correct':
        this._tone(659, t, 0.1, 'square', 0.25);
        this._tone(880, t + 0.1, 0.14, 'square', 0.25);
        break;
      case 'incorrect':
        this._tone(196, t, 0.18, 'sawtooth', 0.2);
        this._tone(147, t + 0.12, 0.2, 'sawtooth', 0.18);
        break;
      case 'badge':
        [523, 659, 784, 1047].forEach((f, i) =>
          this._tone(f, t + i * 0.12, 0.18, 'square', 0.28)
        );
        break;
      case 'open':
        this._tone(392, t, 0.06, 'triangle', 0.2);
        this._tone(523, t + 0.06, 0.08, 'triangle', 0.2);
        break;
      case 'close':
        this._tone(392, t, 0.06, 'triangle', 0.2);
        this._tone(294, t + 0.06, 0.08, 'triangle', 0.2);
        break;
      default:
        break;
    }
  }

  // ---- background music ---------------------------------------------
  // Simple looping arpeggio. trackName chooses a mood.
  playMusic(trackName) {
    this._ensure();
    if (!this.ctx) return;
    if (this.currentTrack === trackName) return;
    this.stopMusic();
    this.currentTrack = trackName;
    if (!this.enabled) return; // remember choice but stay silent

    const tracks = {
      world: { notes: [262, 330, 392, 330, 294, 349, 440, 349], step: 0.32, type: 'triangle' },
      encounter: { notes: [330, 392, 494, 392, 349, 440, 523, 440], step: 0.26, type: 'square' },
      title: { notes: [392, 494, 587, 494, 440, 523, 659, 523], step: 0.36, type: 'triangle' }
    };
    const track = tracks[trackName] || tracks.world;
    let i = 0;
    const schedule = () => {
      if (!this.ctx || this.currentTrack !== trackName) return;
      const t = this.ctx.currentTime;
      const note = track.notes[i % track.notes.length];
      this._tone(note, t, track.step * 0.9, track.type, 0.5, this.musicGain);
      // bass note every other step
      if (i % 2 === 0) {
        this._tone(note / 2, t, track.step * 1.6, 'triangle', 0.3, this.musicGain);
      }
      i += 1;
    };
    schedule();
    this.musicTimer = window.setInterval(schedule, track.step * 1000);
  }

  stopMusic() {
    if (this.musicTimer) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.currentTrack = null;
  }

  // Apply a settings change immediately.
  applySoundSetting() {
    if (!this.enabled) {
      const wasPlaying = this.currentTrack;
      this.stopMusic();
      this._pendingTrack = wasPlaying;
    } else if (this._pendingTrack) {
      const track = this._pendingTrack;
      this._pendingTrack = null;
      this.playMusic(track);
    }
  }
}

const Audio = new AudioManager();
export default Audio;
