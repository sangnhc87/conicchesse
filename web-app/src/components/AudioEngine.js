// Web Audio API synthesized realistic Xiangqi sound effects

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.muted = muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playSelect() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(550, t);
    osc.frequency.exponentialRampToValueAtTime(750, t + 0.04);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  playClick() {
    this.playSelect();
  }

  playMove() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Wooden knock synthesis
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.06);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  playCapture() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Heavy wooden clack with resonance
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(260, t);
    osc1.frequency.exponentialRampToValueAtTime(60, t + 0.12);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(450, t);
    osc2.frequency.exponentialRampToValueAtTime(100, t + 0.08);

    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.12);
    osc2.stop(t + 0.12);
  }

  playCheck() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Sharp alert bell + wood impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.25);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  playWin() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 chord
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);

      gain.gain.setValueAtTime(0.4, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.5);
    });
  }

  playError() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.15);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  speakMove(text) {
    if (this.muted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      let cleanText = text
        .replace(/\[.*?\]/g, '')
        .replace(/Tg/gi, 'Tướng ')
        .replace(/S/gi, 'Sĩ ')
        .replace(/T/gi, 'Tượng ')
        .replace(/X/gi, 'Xe ')
        .replace(/P/gi, 'Pháo ')
        .replace(/M/gi, 'Mã ')
        .replace(/B/gi, 'Binh ')
        .replace(/C/gi, 'Chốt ')
        .replace(/\./g, ' tiến ')
        .replace(/\-/g, ' bình ')
        .replace(/\//g, ' thoái ')
        .replace(/\+/g, ' tiến ')
        .replace(/1/g, ' một ')
        .replace(/2/g, ' hai ')
        .replace(/3/g, ' ba ')
        .replace(/4/g, ' bốn ')
        .replace(/5/g, ' năm ')
        .replace(/6/g, ' sáu ')
        .replace(/7/g, ' bảy ')
        .replace(/8/g, ' tám ')
        .replace(/9/g, ' chín ');

      const utterance = new SpeechSynthesisUtterance(cleanText.trim());
      utterance.lang = 'vi-VN';
      utterance.rate = 1.15;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }
}

export const sound = new AudioEngine();
