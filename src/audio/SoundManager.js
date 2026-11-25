// Procedural Web Audio API Sound Generator for Christmas Simulator
// 100% self-contained, no external audio assets needed!

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
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.initialized = true;
      this.startMusic();
    } catch (e) {
      console.warn('AudioContext failed to initialize:', e);
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
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    return !this.isMuted;
  }

  // --- CHURCH BELL (Cathedral Carillon) ---
  playChurchBell(freq = 220) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Church bell partials: hum (0.5), prime (1.0), tierce (1.2), quint (1.5), nominal (2.0), superquint (3.0)
    const partials = [
      { ratio: 0.5, gain: 0.5, decay: 4.5 },
      { ratio: 1.0, gain: 0.8, decay: 3.5 },
      { ratio: 1.2, gain: 0.45, decay: 2.8 },
      { ratio: 1.5, gain: 0.35, decay: 2.4 },
      { ratio: 2.0, gain: 0.25, decay: 2.0 },
      { ratio: 3.0, gain: 0.15, decay: 1.2 }
    ];

    partials.forEach(p => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * p.ratio, now);

      gain.gain.setValueAtTime(p.gain * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + p.decay);
    });

    // Metallic strike transient
    this.playStrikeTransient(freq, now);
  }

  playStrikeTransient(freq, time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * 4.2, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + 0.08);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.08);
  }

  // --- SLEIGH / JINGLE BELLS ---
  playJingleBells(count = 3) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    for (let i = 0; i < count; i++) {
      const delay = i * 0.09;
      setTimeout(() => {
        const time = this.ctx.currentTime;
        const freqs = [2000, 2480, 2960, 3520];
        freqs.forEach(f => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f + (Math.random() * 80 - 40), time);

          gain.gain.setValueAtTime(0.08, time);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);

          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(time);
          osc.stop(time + 0.25);
        });
      }, delay * 1000);
    }
  }

  // --- FIREWORK ROCKET LAUNCH ---
  playRocketLaunch() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const time = this.ctx.currentTime;
    // Whistle sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, time);
    osc.frequency.exponentialRampToValueAtTime(1400, time + 1.1);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, time);
    filter.Q.value = 4.0;

    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(0.18, time + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 1.2);

    // Hissing exhaust noise
    this.playNoise(time, 1.1, 0.12, 1200);
  }

  // --- FIREWORK EXPLOSION BOOM ---
  playFireworkBoom() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const time = this.ctx.currentTime;

    // Sub-bass thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.7);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.9);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.9);

    // Crackling blast noise
    this.playNoise(time, 0.8, 0.45, 600);

    // Sparkling crackles delayed
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        this.playPop(this.ctx.currentTime, 0.05 + Math.random() * 0.05);
      }, 350 + i * 90 + Math.random() * 60);
    }
  }

  // --- CHRISTMAS CRACKER SNAP & POP ---
  playCrackerSnap() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const time = this.ctx.currentTime;
    // Snap high click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.06);

    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.07);

    // Sharp burst of noise
    this.playNoise(time, 0.15, 0.35, 1800);

    // Confetti flutter / paper tear
    setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      this.playNoise(this.ctx.currentTime, 0.25, 0.1, 3500);
      this.playJingleBells(1);
    }, 80);
  }

  // --- SPARKLER / FOUNTAIN HISS & CRACKLE ---
  playSparklerCrackle() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const time = this.ctx.currentTime;
    // Tiny crackle pop
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2400 + Math.random() * 1000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12 + Math.random() * 0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(time);
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
    osc.frequency.exponentialRampToValueAtTime(380, time + 0.15);
    osc.frequency.exponentialRampToValueAtTime(120, time + 0.3);

    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(0.15, time + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.3);
  }

  // --- SNOWBALL IMPACT (SOFT CRUNCH / SPLAT) ---
  playSnowballImpact() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const time = this.ctx.currentTime;
    // Low thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.12);

    // Crunch noise
    this.playNoise(time, 0.12, 0.25, 800);
  }

  // --- SNOW FOOTSTEP CRUNCH ---
  playSnowStep() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const time = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1100 + Math.random() * 300;
    filter.Q.value = 1.8;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08 + Math.random() * 0.04, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(time);
  }

  // --- GIFT UNWRAPPING FANFARE ---
  playGiftUnwrap() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(time);
        osc.stop(time + 0.45);
      }, idx * 110);
    });

    setTimeout(() => this.playJingleBells(2), 400);
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
    osc.frequency.linearRampToValueAtTime(450, time + 0.2);

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.25);
  }

  // --- HELPER NOISE BURST ---
  playNoise(time, duration, volume, filterFreq) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(time);
  }

  playPop(time, volume) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400 + Math.random() * 600, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.04);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.04);
  }

  // --- BACKGROUND HOLIDAY CHIMES & CARILLON MUSIC ---
  // Gentle, cozy carillon rendition of festive favorites
  startMusic() {
    if (!this.musicPlaying || this.musicTimer) return;

    // Melody 1: Jingle Bells excerpt
    const jingleBells = [
      { note: 659.25, dur: 0.25 }, { note: 659.25, dur: 0.25 }, { note: 659.25, dur: 0.5 },
      { note: 659.25, dur: 0.25 }, { note: 659.25, dur: 0.25 }, { note: 659.25, dur: 0.5 },
      { note: 659.25, dur: 0.25 }, { note: 783.99, dur: 0.25 }, { note: 523.25, dur: 0.35 }, { note: 587.33, dur: 0.15 },
      { note: 659.25, dur: 0.8 },
      { note: 698.46, dur: 0.25 }, { note: 698.46, dur: 0.25 }, { note: 698.46, dur: 0.35 }, { note: 698.46, dur: 0.15 },
      { note: 698.46, dur: 0.25 }, { note: 659.25, dur: 0.25 }, { note: 659.25, dur: 0.25 }, { note: 659.25, dur: 0.25 },
      { note: 659.25, dur: 0.25 }, { note: 587.33, dur: 0.25 }, { note: 587.33, dur: 0.25 }, { note: 659.25, dur: 0.25 },
      { note: 587.33, dur: 0.5 }, { note: 783.99, dur: 0.5 }
    ];

    // Melody 2: We Wish You A Merry Christmas
    const merryChristmas = [
      { note: 523.25, dur: 0.3 }, { note: 698.46, dur: 0.3 }, { note: 698.46, dur: 0.15 }, { note: 783.99, dur: 0.15 }, { note: 698.46, dur: 0.15 }, { note: 659.25, dur: 0.15 },
      { note: 587.33, dur: 0.3 }, { note: 587.33, dur: 0.3 }, { note: 587.33, dur: 0.3 },
      { note: 783.99, dur: 0.3 }, { note: 783.99, dur: 0.15 }, { note: 880.00, dur: 0.15 }, { note: 783.99, dur: 0.15 }, { note: 698.46, dur: 0.15 },
      { note: 659.25, dur: 0.3 }, { note: 523.25, dur: 0.3 }, { note: 523.25, dur: 0.3 }
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
        this.playCarillonNote(item.note, item.dur * 1.4);
        noteIdx++;
        const nextDelay = item.dur * 1000 * 1.35;
        this.musicTimer = setTimeout(playNextNote, nextDelay);
      } else {
        noteIdx = 0;
        this.currentMelodyIndex = (this.currentMelodyIndex + 1) % melodies.length;
        this.musicTimer = setTimeout(playNextNote, 3200); // gentle pause between songs
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

    // Warm subtle bell harmonic
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.02, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    gain2.gain.setValueAtTime(0.02, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.7);

    osc.connect(gain);
    osc2.connect(gain2);
    gain.connect(this.musicGain);
    gain2.connect(this.musicGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + duration);
    osc2.stop(now + duration);
  }

  toggleMusic() {
    this.musicPlaying = !this.musicPlaying;
    return this.musicPlaying;
  }
}
