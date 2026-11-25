// High-Performance Procedural Web Audio API Sound Generator for Christmas Simulator
// 100% Zero-GC during gameplay: Pre-allocated shared noise buffers, cached audio nodes

export class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.musicPlaying = true;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.currentMelodyIndex = 0;
    this.musicTimer = null;
    this.initialized = false;

    // Pre-allocated shared buffers to prevent Garbage Collection pauses
    this.cachedNoiseBuffer = null;
    this.cachedCrunchBuffer = null;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext({ latencyHint: 'interactive' });
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.prebuildNoiseBuffers();

      this.initialized = true;
      this.startMusic();
    } catch (e) {
      console.warn('AudioContext failed to initialize:', e);
    }
  }

  prebuildNoiseBuffers() {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;

    // 1. Long 2-second shared noise buffer for fireworks and crackles
    const noiseLen = sampleRate * 2;
    this.cachedNoiseBuffer = this.ctx.createBuffer(1, noiseLen, sampleRate);
    const nData = this.cachedNoiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
      nData[i] = Math.random() * 2 - 1;
    }

    // 2. Pre-computed 0.1-second snow crunch buffer
    const crunchLen = Math.floor(sampleRate * 0.1);
    this.cachedCrunchBuffer = this.ctx.createBuffer(1, crunchLen, sampleRate);
    const cData = this.cachedCrunchBuffer.getChannelData(0);
    for (let i = 0; i < crunchLen; i++) {
      cData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / crunchLen, 1.5);
    }
  }

  ensureContext() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.ensureContext();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    return !this.isMuted;
  }

  // --- CHURCH BELL (Cathedral Carillon with Additive Overtones) ---
  playChurchBell(freq = 220) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const partials = [
      { ratio: 0.5, gain: 0.45, decay: 4.0 },
      { ratio: 1.0, gain: 0.75, decay: 3.2 },
      { ratio: 1.2, gain: 0.4, decay: 2.6 },
      { ratio: 1.5, gain: 0.3, decay: 2.2 },
      { ratio: 2.0, gain: 0.2, decay: 1.8 }
    ];

    partials.forEach(p => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * p.ratio, now);

      gain.gain.setValueAtTime(p.gain * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + p.decay);
    });
  }

  // --- JINGLE BELLS ---
  playJingleBells(count = 3) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const freqs = [2100, 2550, 3100];
    for (let i = 0; i < count; i++) {
      const delay = i * 0.08;
      const time = this.ctx.currentTime + delay;

      freqs.forEach(f => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f + (Math.random() * 60 - 30), time);

        gain.gain.setValueAtTime(0.06, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(time);
        osc.stop(time + 0.22);
      });
    }
  }

  // --- FIREWORK ROCKET LAUNCH ---
  playRocketLaunch() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, time);
    osc.frequency.exponentialRampToValueAtTime(1350, time + 1.0);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, time);
    filter.Q.value = 3.5;

    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(0.16, time + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 1.05);

    this.playSharedNoise(time, 0.9, 0.1, 1100);
  }

  // --- FIREWORK EXPLOSION BOOM ---
  playFireworkBoom() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const time = this.ctx.currentTime;

    // Sub-bass punch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.65);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.8);

    this.playSharedNoise(time, 0.75, 0.4, 550);
  }

  // --- CHRISTMAS CRACKER SNAP & POP ---
  playCrackerSnap() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1100, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.05);

    gain.gain.setValueAtTime(0.45, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.06);

    this.playSharedNoise(time, 0.12, 0.3, 1600);
  }

  // --- ZERO-ALLOCATION SPARKLER CRACKLE ---
  playSparklerCrackle() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || !this.cachedNoiseBuffer) return;

    const time = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.cachedNoiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2600 + Math.random() * 800;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    const offset = Math.random() * 1.5;
    noise.start(time, offset, 0.035);
  }

  // --- GLASS SHATTER (WHEN SNOWBALL BREAKS TARGETS) ---
  playGlassShatter() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const time = this.ctx.currentTime;
    // High crystalline glass pings
    const glassFreqs = [2400, 3200, 4100, 5200];
    glassFreqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + Math.random() * 200, time + idx * 0.02);

      gain.gain.setValueAtTime(0.25, time + idx * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.35 + idx * 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(time + idx * 0.02);
      osc.stop(time + 0.45);
    });

    // Glass fragment spray noise
    this.playSharedNoise(time, 0.25, 0.35, 3800);
  }

  // --- LEVEL UP FANFARE ---
  playLevelUp() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    notes.forEach((freq, idx) => {
      const time = this.ctx.currentTime + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(time);
      osc.stop(time + 0.5);
    });

    setTimeout(() => this.playJingleBells(3), 420);
  }

  // --- SNOWBALL THROW WHOOSH ---
  playSnowballThrow() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(360, time + 0.12);
    osc.frequency.exponentialRampToValueAtTime(120, time + 0.25);

    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(0.14, time + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.25);
  }

  // --- SNOWBALL IMPACT ---
  playSnowballImpact() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);

    gain.gain.setValueAtTime(0.28, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.1);

    this.playSharedNoise(time, 0.1, 0.2, 700);
  }

  // --- ZERO-ALLOCATION SNOW FOOTSTEP CRUNCH ---
  playSnowStep() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || !this.cachedCrunchBuffer) return;

    const time = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.cachedCrunchBuffer;
    noise.playbackRate.value = 0.9 + Math.random() * 0.25;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.09, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    noise.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(time);
  }

  // --- GIFT UNWRAP FANFARE ---
  playGiftUnwrap() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const time = this.ctx.currentTime + idx * 0.1;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(time);
      osc.stop(time + 0.4);
    });

    setTimeout(() => this.playJingleBells(2), 350);
  }

  // --- HOT COCOA SIP ---
  playSip() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, time);
    osc.frequency.linearRampToValueAtTime(460, time + 0.18);

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.22);
  }

  // Reusable helper: uses pre-built noise buffer with zero allocation
  playSharedNoise(time, duration, volume, filterFreq) {
    if (!this.cachedNoiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.cachedNoiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    const offset = Math.random() * 1.0;
    noise.start(time, offset, duration);
  }

  // --- CARILLON MUSIC ---
  startMusic() {
    if (!this.musicPlaying || this.musicTimer) return;

    const jingleBells = [
      { note: 659.25, dur: 0.25 }, { note: 659.25, dur: 0.25 }, { note: 659.25, dur: 0.5 },
      { note: 659.25, dur: 0.25 }, { note: 659.25, dur: 0.25 }, { note: 659.25, dur: 0.5 },
      { note: 659.25, dur: 0.25 }, { note: 783.99, dur: 0.25 }, { note: 523.25, dur: 0.35 }, { note: 587.33, dur: 0.15 },
      { note: 659.25, dur: 0.8 }
    ];

    const merryChristmas = [
      { note: 523.25, dur: 0.3 }, { note: 698.46, dur: 0.3 }, { note: 698.46, dur: 0.15 }, { note: 783.99, dur: 0.15 },
      { note: 698.46, dur: 0.15 }, { note: 659.25, dur: 0.15 }, { note: 587.33, dur: 0.3 }, { note: 587.33, dur: 0.3 }
    ];

    const melodies = [jingleBells, merryChristmas];
    let noteIdx = 0;

    const playNextNote = () => {
      if (!this.musicPlaying || this.isMuted || !this.ctx) {
        this.musicTimer = setTimeout(playNextNote, 1000);
        return;
      }

      const currentMelody = melodies[this.currentMelodyIndex];
      const item = currentMelody[noteIdx];

      if (item) {
        this.playCarillonNote(item.note, item.dur * 1.3);
        noteIdx++;
        this.musicTimer = setTimeout(playNextNote, item.dur * 1000 * 1.35);
      } else {
        noteIdx = 0;
        this.currentMelodyIndex = (this.currentMelodyIndex + 1) % melodies.length;
        this.musicTimer = setTimeout(playNextNote, 3000);
      }
    };

    this.musicTimer = setTimeout(playNextNote, 1500);
  }

  playCarillonNote(freq, duration) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  toggleMusic() {
    this.musicPlaying = !this.musicPlaying;
    return this.musicPlaying;
  }
}
