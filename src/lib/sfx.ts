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

export const sfx = {
  tap: () => tone(880, 0.06, { type: 'triangle', vol: 0.12 }),
  pop: () => { tone(600, 0.12, { type: 'sine', vol: 0.35, slideTo: 1400 }); noise(0.08, 0.25, 0, 2000); },
  correct: () => { tone(PENTA[2], 0.14, { type: 'triangle', vol: 0.3 }); tone(PENTA[5], 0.28, { type: 'triangle', vol: 0.3, delay: 0.1 }); },
  wrong: () => { tone(220, 0.18, { type: 'sine', vol: 0.25, slideTo: 170 }); },
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
