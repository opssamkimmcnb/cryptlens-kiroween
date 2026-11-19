/**
 * Optional Web Audio API synthesizer for spooky UI feedback (muted by default).
 */
class SpectralAudio {
  constructor() {
    this.enabled = false;
    this.ctx = null;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (this.enabled && !this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.enabled) {
      this.playChime(523.25, 0.14, 'sine');
    }
  }

  playChime(freq = 392, duration = 0.18, type = 'triangle') {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(80, freq * 0.65), now + duration);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  playRitual(curseScore) {
    if (!this.enabled) return;
    if (curseScore >= 60) {
      this.playChime(196, 0.28, 'sawtooth');
    } else if (curseScore >= 25) {
      this.playChime(293.66, 0.22, 'triangle');
    } else {
      this.playChime(587.33, 0.22, 'sine');
    }
  }
}

export const spectralAudio = new SpectralAudio();
