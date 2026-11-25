// Gentle background music, generated live (no files): a soft marimba-like melody over a slow
// I–vi–IV–V progression in a pentatonic scale. It plays only on menu screens — never during
// lessons, stories (narration) or the instrument screen — and ducks whenever Habre speaks.

import { useEffect } from 'preact/hooks';
import { musicOut } from './sfx';
import { currentRoute } from './router';
import { getState, subscribe } from './store';

const MENU_PATHS = new Set(['/', 'start', '/words', '/stories', '/nepal', '/play', '/stickers', '/letters', '/journey', '/numbers', '/sounds', '/abc']);
const VOLUME = 0.32;   // music bus level (sfx master is 0.5); notes themselves are quiet
const DUCKED = 0.08;

// C major pentatonic across two octaves, and chord roots for C – Am – F – G
const SCALE = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99, 880];
const CHORDS = [[0, 2, 3, 5], [4, 0, 2, 5], [3, 0, 4, 5], [3, 1, 4, 6]]; // indices into SCALE that fit each chord
const BASS = [130.81, 110, 87.31, 98];
const STEP = 0.42;

let timer: ReturnType<typeof setInterval> | undefined;
let step = 0;
let wanted = false;
let ducked = false;

function note(freq: number, at: number, dur: number, vol: number, type: OscillatorType = 'sine') {
  const o = musicOut(); if (!o) return;
  const osc = o.c.createOscillator(); const g = o.c.createGain();
  osc.type = type; osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(o.out);
  osc.start(at); osc.stop(at + dur + 0.05);
}

function tick() {
  const o = musicOut(); if (!o) return;
  const t = o.c.currentTime + 0.05;
  const bar = Math.floor(step / 8) % 4;
  const beat = step % 8;
  if (beat === 0 || beat === 4) note(BASS[bar], t, 1.4, 0.16);
  if (Math.random() < (beat % 2 === 0 ? 0.6 : 0.3)) {
    const f = SCALE[CHORDS[bar][Math.floor(Math.random() * 4)]] * (Math.random() < 0.3 ? 2 : 1);
    note(f, t, 0.7, 0.07);
    note(f * 2, t, 0.25, 0.015, 'triangle'); // a little sparkle, marimba-like
  }
  step++;
}

function setLevel(level: number) {
  const o = musicOut(); if (!o) return;
  o.out.gain.cancelScheduledValues(o.c.currentTime);
  o.out.gain.setTargetAtTime(level, o.c.currentTime, 0.4);
}

function apply() {
  const s = getState();
  const on = wanted && s.music && s.sound;
  if (on && !timer) { step = 0; timer = setInterval(tick, STEP * 1000); setLevel(ducked ? DUCKED : VOLUME); }
  if (!on && timer) { clearInterval(timer); timer = undefined; setLevel(0); }
}

if (typeof window !== 'undefined') {
  window.addEventListener('akshar:speaking', (e) => {
    ducked = (e as CustomEvent<boolean>).detail;
    if (timer) setLevel(ducked ? DUCKED : VOLUME);
  });
  document.addEventListener('visibilitychange', () => { wanted = wanted && document.visibilityState === 'visible'; apply(); });
  subscribe(apply);
}

/** Mount once; tells the music whether the current screen is a "menu" screen. */
export function MusicDirector({ route }: { route: string }) {
  useEffect(() => {
    wanted = MENU_PATHS.has(route === 'start' ? 'start' : currentRoute());
    apply();
  });
  useEffect(() => () => { wanted = false; apply(); }, []);
  return null;
}
