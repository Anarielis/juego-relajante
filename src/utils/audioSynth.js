// CalmSpace Web Audio API Procedural Synthesizer
// Generates premium ASMR sounds and meditative drone pads entirely in code.

class AudioSynthController {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.5;
    this.ambientVolume = 0.3;
    this.isAmbientPlaying = false;
    
    // Nodes for ambient drone
    this.ambientGain = null;
    this.ambientOscillators = [];
    this.ambientFilter = null;
    this.lfo = null;
  }

  // Initialized on first user interaction to satisfy browser policies
  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      
      // Master Gain Node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      
      console.log("AudioSynth Context initialized.");
    } catch (e) {
      console.warn("Web Audio API not supported in this browser.", e);
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime);
    }
  }

  setEnabled(bool) {
    this.enabled = bool;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(bool ? this.volume : 0, this.ctx.currentTime);
    }
    // If sounds are disabled and ambient was playing, adjust ambient gain
    if (!bool && this.isAmbientPlaying) {
      this.stopAmbientMusic();
    }
  }

  // --- 1. ZEN GARDEN SOUNDS (Sand scratching / raking) ---
  // Uses filtered white noise
  playZenScratch(intensity = 0.5) {
    this.init();
    if (!this.ctx || !this.enabled) return;

    // Create Buffer Source for White Noise
    const bufferSize = this.ctx.sampleRate * 1.5; // 1.5 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Bandpass filter to isolate rustling frequencies
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    // Frequency sweeps gently depending on intensity
    filter.frequency.setValueAtTime(400 + (intensity * 200), this.ctx.currentTime);
    filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    // Gain node for custom volume envelope
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, this.ctx.currentTime);
    // Smooth ramp up
    gainNode.gain.linearRampToValueAtTime(0.05 * intensity, this.ctx.currentTime + 0.1);
    // Smooth ramp down
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.4);

    // Connections
    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    noiseSource.start();
    noiseSource.stop(this.ctx.currentTime + 1.5);
  }

  // --- 2. POP IT SOUNDS (Crisp bubble pops) ---
  // Fast pitch envelope on a sine wave + tiny burst of noise
  playPopSound(pitchMultiplier = 1.0) {
    this.init();
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    
    // 1. Oscillator for the "Pop" body
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = 'sine';
    // Pitch drops very fast (120Hz down to 40Hz)
    const baseFreq = 140 * pitchMultiplier;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    // 2. High pass click for crisp attack
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(1200 * pitchMultiplier, now);
    clickGain.gain.setValueAtTime(0.05, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    clickOsc.connect(clickGain);
    clickGain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.09);
    clickOsc.start(now);
    clickOsc.stop(now + 0.03);
  }

  // --- 3. GUIDED BREATHING SOUNDS ---
  // A beautiful harmonized bell sound
  playBreathingBell() {
    this.init();
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    
    // Inhale bell uses a triad of sine waves for a rich chime
    const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    freqs.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gainNode.gain.setValueAtTime(0, now);
      // Ring out over 2 seconds
      gainNode.gain.linearRampToValueAtTime(0.08 / (index + 1), now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
      
      osc.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      osc.start(now);
      osc.stop(now + 3.0);
    });
  }

  // A soft low hum for inhalation/exhalation cues
  startBreathingHum(direction = 'inhale') {
    this.init();
    if (!this.ctx || !this.enabled) return null;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    
    if (direction === 'inhale') {
      // Inhale ramps up in frequency and volume
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(150, now + 4);
      gainNode.gain.setValueAtTime(0.01, now);
      gainNode.gain.linearRampToValueAtTime(0.12, now + 4);
    } else {
      // Exhale ramps down
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 4);
      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.linearRampToValueAtTime(0.01, now + 4);
    }

    filter.type = 'lowpass';
    filter.frequency.value = 200;

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(now);
    
    return {
      osc,
      gainNode,
      stop: () => {
        try {
          const stopTime = this.ctx.currentTime;
          gainNode.gain.cancelScheduledValues(stopTime);
          gainNode.gain.setValueAtTime(gainNode.gain.value, stopTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, stopTime + 0.3);
          osc.stop(stopTime + 0.4);
        } catch (err) {}
      }
    };
  }

  // --- 4. SLIME SIMULATOR SOUNDS ---
  // Squishy wet sound utilizing frequency swept bandpass filter
  playSlimeSquish(speed = 0.5, frequencyScale = 1.0) {
    this.init();
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Use a triangle wave for rubbery body
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180 * frequencyScale, now);
    osc.frequency.linearRampToValueAtTime((80 + Math.random() * 60) * frequencyScale, now + 0.15 * speed);

    // Dynamic bandpass filter sweep to simulate squishy bubbles popping/moving
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(1800, now + 0.15 * speed);
    filter.Q.value = 1.5;

    gainNode.gain.setValueAtTime(0.08, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.18 * speed);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.2 * speed);
  }

  // --- 5. AMBIENT MEDITATION DRONE PAD ---
  // Beautiful generative drone in C-Major/Pentatonic using slow oscillators and a filter sweep
  startAmbientMusic() {
    this.init();
    if (!this.ctx) return;
    if (this.isAmbientPlaying) return;

    this.isAmbientPlaying = true;
    const now = this.ctx.currentTime;

    // Ambient gain node
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.001, now);
    this.ambientGain.linearRampToValueAtTime(this.ambientVolume, now + 3); // Slow fade-in

    // Filter to keep things deep and soft
    this.ambientFilter = this.ctx.createBiquadFilter();
    this.ambientFilter.type = 'lowpass';
    this.ambientFilter.frequency.setValueAtTime(350, now);

    // Connect nodes
    this.ambientFilter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);

    // MEDITATIVE CHORD PILES (C2, G2, C3, E3, G3, B3)
    const baseFreqs = [65.41, 98.00, 130.81, 164.81, 196.00, 246.94];
    this.ambientOscillators = [];

    baseFreqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      
      // Use warm triangle waves for most, sine for low base
      osc.type = idx < 2 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      
      // Detune slightly for lush chorus effect
      osc.detune.setValueAtTime((Math.random() * 8 - 4), now);
      
      // Gain levels (bass is louder, high harmonics are quiet)
      const baseGain = idx < 2 ? 0.25 : 0.12;
      oscGain.gain.setValueAtTime(baseGain / baseFreqs.length, now);

      // Connect
      osc.connect(oscGain);
      oscGain.connect(this.ambientFilter);
      
      osc.start(now);
      this.ambientOscillators.push(osc);
    });

    // LFO to slowly sweep filter cutoff (creating organic wind-like movement)
    this.lfo = this.ctx.createOscillator();
    this.lfo.frequency.setValueAtTime(0.06, now); // Very slow: 1 cycle per 16 seconds
    
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(150, now); // Sweep filter by +- 150 Hz
    
    this.lfo.connect(lfoGain);
    lfoGain.connect(this.ambientFilter.frequency);
    this.lfo.start(now);
    
    console.log("Ambient drone started.");
  }

  stopAmbientMusic() {
    if (!this.isAmbientPlaying) return;
    
    const now = this.ctx?.currentTime || 0;
    
    if (this.ambientGain && this.ctx) {
      try {
        this.ambientGain.gain.cancelScheduledValues(now);
        this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
        this.ambientGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5); // Slow fade out
      } catch (e) {}
    }

    // Stop and clean up oscillators after fade out
    setTimeout(() => {
      if (!this.isAmbientPlaying) {
        this.ambientOscillators.forEach(osc => {
          try { osc.stop(); } catch(e) {}
        });
        this.ambientOscillators = [];
        
        if (this.lfo) {
          try { this.lfo.stop(); } catch(e) {}
          this.lfo = null;
        }
        
        this.ambientGain = null;
        this.ambientFilter = null;
        console.log("Ambient drone stopped completely.");
      }
    }, 1600);

    this.isAmbientPlaying = false;
  }

  setAmbientVolume(vol) {
    this.ambientVolume = Math.max(0, Math.min(0.8, vol));
    if (this.ambientGain && this.ctx && this.isAmbientPlaying) {
      this.ambientGain.gain.setValueAtTime(this.ambientVolume, this.ctx.currentTime);
    }
  }
}

const audioSynth = new AudioSynthController();
export default audioSynth;
