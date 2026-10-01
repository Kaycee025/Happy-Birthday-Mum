/**
 * Keepsake Background Music & Ambient Soundscape
 * Off by default. Plays either custom audio URL or serene Web Audio API harp lullaby.
 */

class KeepsakeAudio {
  constructor() {
    this.isPlaying = false;
    this.audioContext = null;
    this.synthInterval = null;
    this.audioElement = null;
    this.button = document.getElementById('audio-toggle-btn');
    this.buttonLabel = document.getElementById('audio-label');

    this.init();
  }

  init() {
    if (this.button) {
      this.button.addEventListener('click', () => this.toggle());
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    const settings = window.keepsakeStorage ? window.keepsakeStorage.getData().settings : {};
    
    // If user configured a custom MP3 URL
    if (settings && settings.customAudioUrl && settings.customAudioUrl.trim() !== '') {
      if (!this.audioElement) {
        this.audioElement = new Audio(settings.customAudioUrl);
        this.audioElement.loop = true;
      }
      this.audioElement.play().catch(e => console.warn("Audio element play error:", e));
    } else {
      // Use built-in soothing Web Audio API harp lullaby
      this.startSynthesizer();
    }

    this.isPlaying = true;
    if (this.button) {
      this.button.classList.add('playing');
      if (this.buttonLabel) this.buttonLabel.textContent = "Music: Playing";
    }
  }

  pause() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.stopSynthesizer();

    this.isPlaying = false;
    if (this.button) {
      this.button.classList.remove('playing');
      if (this.buttonLabel) this.buttonLabel.textContent = "Music: Soft Piano";
    }
  }

  /* Built-in Calming Ambient Harp / Music Box Generator */
  startSynthesizer() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // Pentatonic scale frequencies (F Major / D Minor: F3, G3, A3, C4, D4, F4, G4, A4, C5)
      const notes = [
        174.61, 196.00, 220.00, 261.63, 293.66, 349.23, 392.00, 440.00, 523.25
      ];

      // Master Gain & Reverb Filter
      const masterGain = this.audioContext.createGain();
      masterGain.gain.setValueAtTime(0.09, this.audioContext.currentTime);

      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, this.audioContext.currentTime);

      masterGain.connect(filter);
      filter.connect(this.audioContext.destination);

      const playHarpNote = (freq, delay = 0) => {
        if (!this.isPlaying) return;
        const now = this.audioContext.currentTime + delay;

        // Primary Sine Oscillator
        const osc = this.audioContext.createOscillator();
        const noteGain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Gentle envelope: soft attack and warm natural decay
        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.exponentialRampToValueAtTime(0.35, now + 0.08);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

        // Chime overtone (triangle wave at 2x frequency)
        const chime = this.audioContext.createOscillator();
        const chimeGain = this.audioContext.createGain();
        chime.type = 'triangle';
        chime.frequency.setValueAtTime(freq * 2, now);
        chimeGain.gain.setValueAtTime(0.0001, now);
        chimeGain.gain.exponentialRampToValueAtTime(0.05, now + 0.04);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc.connect(noteGain);
        chime.connect(chimeGain);
        noteGain.connect(masterGain);
        chimeGain.connect(masterGain);

        osc.start(now);
        chime.start(now);
        osc.stop(now + 3.0);
        chime.stop(now + 1.5);
      };

      // Gentle recurring chord progressions
      const progressions = [
        [0, 2, 4, 6], // F - A - D - G
        [1, 3, 5, 7], // G - C - F - A
        [2, 4, 6, 8], // A - D - G - C
        [0, 3, 5, 7]
      ];

      let progIndex = 0;
      const playStep = () => {
        if (!this.isPlaying) return;
        const chord = progressions[progIndex % progressions.length];
        chord.forEach((noteIdx, i) => {
          playHarpNote(notes[noteIdx], i * 0.45);
        });
        progIndex++;
      };

      playStep();
      this.synthInterval = setInterval(playStep, 2800);
    } catch (e) {
      console.warn("Synth audio error:", e);
    }
  }

  stopSynthesizer() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  // Soft wax seal break & paper slide sound effect
  playEnvelopeSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      
      // Chime note
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.4); // A5

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.3);
    } catch (e) {}
  }
}

window.KeepsakeAudio = KeepsakeAudio;
