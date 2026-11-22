// Sound effects synthesised with Web Audio — zero audio files, instant, works offline.
// Melodic cues use a major pentatonic scale so every combination sounds pleasant.

import { getState } from './store';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function ac(): AudioContext | null {
  if (!getState().sound) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch { return null; }
}

/** Browsers only allow audio after a user gesture; call this from the first tap. */
export function unlockAudio(): void { ac(); }

interface ToneOpts { type?: OscillatorType; vol?: number; attack?: number; slideTo?: number; delay?: number }

function tone(freq: number, dur: number, o: ToneOpts = {}) {
  const c = ac(); if (!c || !master) return;
  const t0 = c.currentTime + (o.delay ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t0 + dur);
  const v = o.vol ?? 0.3;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(v, t0 + (o.attack ?? 0.01));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur: number, vol = 0.2, delay = 0, hp = 1200) {
  const c = ac(); if (!c || !master) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
  const g = c.createGain(); g.gain.value = vol;
  src.connect(f).connect(g).connect(master);
  src.start(c.currentTime + delay);
}

// C major pentatonic, two octaves
const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];

/** Let Habre react to answers wherever he is on screen. */
const react = (mood: 'happy' | 'oops') => { try { window.dispatchEvent(new CustomEvent('akshar:react', { detail: mood })); } catch { /* */ } };

export const sfx = {
  tap: () => tone(880, 0.06, { type: 'triangle', vol: 0.12 }),
  pop: () => { tone(600, 0.12, { type: 'sine', vol: 0.35, slideTo: 1400 }); noise(0.08, 0.25, 0, 2000); },
  correct: () => { react('happy'); tone(PENTA[2], 0.14, { type: 'triangle', vol: 0.3 }); tone(PENTA[5], 0.28, { type: 'triangle', vol: 0.3, delay: 0.1 }); },
  wrong: () => { react('oops'); tone(220, 0.18, { type: 'sine', vol: 0.25, slideTo: 170 }); },
  flip: () => noise(0.12, 0.12, 0, 3000),
  whoosh: () => noise(0.3, 0.1, 0, 800),
  star: (i = 0) => { tone(PENTA[4 + (i % 5)], 0.25, { type: 'sine', vol: 0.25 }); tone(PENTA[4 + (i % 5)] * 2, 0.2, { type: 'sine', vol: 0.08, delay: 0.02 }); },
  stroke: () => tone(PENTA[Math.floor(Math.random() * 5)] * 2, 0.05, { type: 'sine', vol: 0.04 }),
  unlock: () => [0, 2, 4, 7].forEach((n, i) => tone(PENTA[n], 0.3, { type: 'triangle', vol: 0.22, delay: i * 0.08 })),
  fanfare: () => {
    [0, 2, 4, 5, 7, 9].forEach((n, i) => tone(PENTA[n], 0.35, { type: 'triangle', vol: 0.22, delay: i * 0.09 }));
    tone(PENTA[5], 0.9, { type: 'sine', vol: 0.18, delay: 0.6 });
    tone(PENTA[7], 0.9, { type: 'sine', vol: 0.14, delay: 0.6 });
    noise(0.5, 0.08, 0.6, 5000);
  },
};

// ── Nepali instruments (synthesised; no audio files) ──
type Out = { c: AudioContext; out: GainNode };
function out(): Out | null { const c = ac(); return c && master ? { c, out: master } : null; }

function drum(o: Out, from: number, to: number, dur: number, vol: number) {
  const t = o.c.currentTime;
  const osc = o.c.createOscillator(); const g = o.c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(o.out);
  osc.start(t); osc.stop(t + dur + 0.05);
}

export const instruments = {
  /** मादल, left (big) head: deep "dhin" */
  madalBass: () => { const o = out(); if (!o) return; drum(o, 120, 52, 0.5, 0.7); noise(0.06, 0.12, 0, 150); },
  /** मादल, right (small) head: bright "ta" */
  madalTreble: () => { const o = out(); if (!o) return; drum(o, 420, 300, 0.18, 0.45); noise(0.05, 0.18, 0, 2500); },
  /** डम्फू (Tamang frame drum): round low thump with a rim click */
  damphu: () => { const o = out(); if (!o) return; drum(o, 90, 58, 0.6, 0.65); tone(1100, 0.03, { type: 'triangle', vol: 0.08 }); },
  /** बाँसुरी: breathy flute note with vibrato */
  bansuri: (freq: number) => {
    const o = out(); if (!o) return;
    const t = o.c.currentTime;
    const osc = o.c.createOscillator(); const g = o.c.createGain();
    const lfo = o.c.createOscillator(); const depth = o.c.createGain();
    osc.type = 'sine'; osc.frequency.value = freq;
    lfo.frequency.value = 5.5; depth.gain.value = freq * 0.012;
    lfo.connect(depth).connect(osc.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.28, t + 0.07);
    g.gain.setValueAtTime(0.28, t + 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
    osc.connect(g).connect(o.out);
    osc.start(t); lfo.start(t); osc.stop(t + 1); lfo.stop(t + 1);
    noise(0.25, 0.03, 0, 1800); // breath
  },
  /** मन्दिरको घण्टी: inharmonic metallic partials with a long ring */
  bell: () => {
    const o = out(); if (!o) return;
    const base = 520;
    [[1, 0.28, 3.2], [2.76, 0.12, 2.2], [5.4, 0.07, 1.3], [8.93, 0.04, 0.8]].forEach(([m, v, d]) => tone(base * m, d, { type: 'sine', vol: v }));
    noise(0.03, 0.15, 0, 4000);
  },
};

/** Bansuri notes: a pentatonic run (Sa Re Ga Pa Dha Sa') around D5. */
export const BANSURI_NOTES = [587.33, 659.25, 739.99, 880, 987.77, 1174.66];

/** A separate, quieter bus for background music (see lib/music.ts). */
let musicBus: GainNode | null = null;
export function musicOut(): { c: AudioContext; out: GainNode } | null {
  const c = ac();
  if (!c || !master) return null;
  if (!musicBus) { musicBus = c.createGain(); musicBus.gain.value = 0; musicBus.connect(master); }
  return { c, out: musicBus };
}
