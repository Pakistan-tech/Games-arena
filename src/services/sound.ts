/**
 * Web Audio API synthesizer for kinetic game feel and crisp audio feedback.
 * No external audio files or dependencies required.
 */
class SoundService {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private volume: number = 0.5;

  constructor() {
    try {
      const storedMute = localStorage.getItem('ae_muted');
      if (storedMute !== null) {
        this.muted = JSON.parse(storedMute);
      }
      const storedVol = localStorage.getItem('ae_vol');
      if (storedVol !== null) {
        this.volume = JSON.parse(storedVol);
      }
    } catch {
      // ignore
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem('ae_muted', JSON.stringify(this.muted));
    } catch {
      // ignore
    }
    return this.muted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('ae_vol', JSON.stringify(this.volume));
    } catch {
      // ignore
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  // Smooth whoosh launch sound with pitch bend
  public playLaunch(combo: number = 1) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = 220 + Math.min(combo * 30, 300);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + 0.18);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.22 * this.volume, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.24);
    } catch {
      // ignore
    }
  }

  // Ascending harmonic chime when arrow exits cleanly
  public playEscape(combo: number = 1) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
      const noteIdx = Math.min(scale.length - 1, (combo - 1) % scale.length);
      const freq = scale[noteIdx];

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.26 * this.volume, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.38);
      osc2.stop(now + 0.38);
    } catch {
      // ignore
    }
  }

  // Tactile collision bump / recoil impact
  public playImpact() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.35 * this.volume, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // ignore
    }
  }

  // Combo milestone fanfare
  public playComboStreak(combo: number) {
    if (this.muted || combo < 3) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const chords = [523.25, 659.25, 783.99, 1046.50];
      chords.forEach((f, i) => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime + i * 0.04;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.18 * this.volume, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
      });
    } catch {
      // ignore
    }
  }

  // Hint activated
  public playHint() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.25);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2 * this.volume, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch {
      // ignore
    }
  }

  // Victory Fanfare
  public playVictory() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [
        { f: 392.00, t: 0.0, d: 0.12 },
        { f: 523.25, t: 0.12, d: 0.12 },
        { f: 659.25, t: 0.24, d: 0.14 },
        { f: 783.99, t: 0.38, d: 0.35 },
      ];

      notes.forEach(({ f, t, d }) => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime + t;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.25 * this.volume, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + d + 0.05);
      });
    } catch {
      // ignore
    }
  }

  // Defeat / Game Over
  public playDefeat() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [
        { f: 311.13, t: 0.0, d: 0.2 },
        { f: 293.66, t: 0.2, d: 0.2 },
        { f: 277.18, t: 0.4, d: 0.4 },
      ];

      notes.forEach(({ f, t, d }) => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime + t;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.2 * this.volume, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + d + 0.05);
      });
    } catch {
      // ignore
    }
  }
}

export const sound = new SoundService();
