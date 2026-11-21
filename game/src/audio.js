// nightfall: tiny WebAudio synth — footsteps, pickup chime, alert sting, win/lose.
// All tones are generated, no audio files, so the game stays fully offline.
export class Audio {
  constructor() {
    this.ctx = null;
    this.on = true;
  }
  ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { this.on = false; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.on;
  }
  tone(freq, dur, type = 'sine', gain = 0.12) {
    if (!this.ensure()) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(gain, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + dur);
  }
  step() { this.tone(90 + Math.random() * 20, 0.07, 'triangle', 0.05); }
  pickup() { this.tone(660, 0.12, 'sine', 0.15); setTimeout(() => this.tone(880, 0.18, 'sine', 0.12), 90); }
  spotted() { this.tone(220, 0.3, 'sawtooth', 0.14); setTimeout(() => this.tone(180, 0.4, 'sawtooth', 0.14), 150); }
  calm() { this.tone(440, 0.2, 'sine', 0.08); }
  win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 'sine', 0.14), i * 140)); }
  lose() { [330, 262, 196].forEach((f, i) => setTimeout(() => this.tone(f, 0.35, 'sawtooth', 0.12), i * 200)); }
}
