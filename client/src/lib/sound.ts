// Using Web Audio API for procedural sound generation (no assets needed)
// This fits the "digital/glitch" aesthetic perfectly.

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined' && !this.ctx) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.3; // Default volume
      } catch (e) {
        console.error("Web Audio API not supported", e);
      }
    }
  }

  public resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playTick() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain!);

    // High, dry tick
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  public playSolve() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    // Major chord chime
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C Major
    const now = this.ctx.currentTime;

    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.type = 'triangle';
      osc.frequency.value = f;
      
      const start = now + (i * 0.1);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 2);

      osc.start(start);
      osc.stop(start + 2);
    });
  }

  public playGlitch(intensity: number) {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.type = 'sawtooth';
    // Random frequency jumps
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.1);
    osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(intensity * 0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  public playHum(active: boolean) {
    // Background hum for high glitch levels?
    // Not implementing persistent loops to avoid annoyance, just event-based sounds.
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
  }
}

export const soundManager = new SoundManager();
