// Speech: the single most important (and most fragile) part of an alphabet app for
// pre-readers. Resolution order:
//   1. Recorded clip by a native Nepali speaker  (public/audio/<id>.mp3, listed in manifest.json)
//   2. Android native TTS via @capacitor-community/text-to-speech (Google TTS has ne-NP)
//   3. Browser speechSynthesis — only with a Nepali or Hindi voice; never an English voice
//      reading Devanagari (that produces garbage, which is worse than silence)
//   4. Nothing — callers fall back to visual cues (picture + word)
// Note: Android System WebView does NOT implement speechSynthesis, which is why (2) exists.

import { getState } from './store';

export type VoiceSource = 'recorded' | 'native' | 'web-ne' | 'web-hi' | 'none';

let manifest: Set<string> | null = null;
let webVoice: SpeechSynthesisVoice | null = null;
type NativeTts = { speak(o: object): Promise<void>; stop(): Promise<void>; getSupportedLanguages(): Promise<{ languages: string[] }> };
let nativeTts: NativeTts | null = null;
let nativeLang = 'ne-NP';
let nativeEnglish: NativeTts | null = null;
let currentAudio: HTMLAudioElement | null = null;
let ready: Promise<void> | null = null;

export function initSpeech(): Promise<void> {
  ready ??= (async () => {
    await Promise.all([loadManifest(), initNative(), initWeb()]);
  })();
  return ready;
}

async function loadManifest() {
  try {
    if (typeof __SINGLE_FILE__ !== 'undefined' && __SINGLE_FILE__) return;
    const res = await fetch('./audio/manifest.json', { cache: 'no-cache' });
    if (res.ok) manifest = new Set((await res.json()).clips as string[]);
  } catch { /* no recordings yet */ }
}

async function initNative() {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
    const { languages } = await TextToSpeech.getSupportedLanguages();
    const ne = languages.find((l) => /^ne/i.test(l));
    const hi = languages.find((l) => /^hi/i.test(l));
    nativeEnglish = TextToSpeech as unknown as NativeTts;
    if (!ne && !hi) return;
    nativeLang = ne ?? hi!;
    nativeTts = TextToSpeech as unknown as NativeTts;
  } catch { /* plugin unavailable */ }
}

function initWeb(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof speechSynthesis === 'undefined') return resolve();
    const pick = () => {
      const vs = speechSynthesis.getVoices();
      webVoice = vs.find((v) => /^ne/i.test(v.lang)) ?? vs.find((v) => /^hi/i.test(v.lang)) ?? null;
      return vs.length > 0;
    };
    if (pick()) return resolve();
    speechSynthesis.addEventListener('voiceschanged', () => { pick(); resolve(); }, { once: true });
    setTimeout(resolve, 1500);
  });
}

export function voiceSource(): VoiceSource {
  if (manifest && manifest.size) return 'recorded';
  if (nativeTts) return 'native';
  if (webVoice) return /^ne/i.test(webVoice.lang) ? 'web-ne' : 'web-hi';
  return 'none';
}

/** True if *some* way of speaking Nepali is available. */
export function canSpeak(): boolean {
  return getState().voice && voiceSource() !== 'none';
}

/** Every new utterance bumps this, so a queued follow-up (e.g. the English half of a bilingual
 *  line) can tell it was interrupted and must not start. */
let gen = 0;
let speaking = 0;
function speakingChanged(delta: number) {
  speaking = Math.max(0, speaking + delta);
  window.dispatchEvent(new CustomEvent('akshar:speaking', { detail: speaking > 0 }));
}
async function tracked<T>(p: Promise<T>): Promise<T> {
  speakingChanged(1);
  try { return await p; } finally { speakingChanged(-1); }
}

export function stopSpeech(): void {
  gen++;
  currentAudio?.pause();
  currentAudio = null;
  try { speechSynthesis?.cancel(); } catch { /* */ }
  void (nativeTts ?? nativeEnglish)?.stop().catch(() => {});
}

/**
 * Speak Nepali text. `clip` is the id of a recorded file that says the same thing
 * (e.g. "letter-ka", "chant-ka", "word-ka"). Resolves when finished (or immediately if silent).
 */
export interface SpeakOpts { slow?: boolean }

export async function say(text: string, clip?: string, opts: SpeakOpts = {}): Promise<boolean> {
  if (!getState().voice) return false;
  await initSpeech();
  stopSpeech();
  return tracked(speakNepali(text, clip, opts));
}

async function speakNepali(text: string, clip?: string, opts: SpeakOpts = {}): Promise<boolean> {

  if (clip && manifest?.has(clip)) {
    try {
      const a = new Audio(`./audio/${clip}.mp3`);
      if (opts.slow) a.playbackRate = 0.7; // browsers keep the pitch when slowing down
      currentAudio = a;
      await a.play();
      await new Promise((r) => { a.onended = r; a.onerror = r; });
      return true;
    } catch { /* fall through */ }
  }

  if (nativeTts) {
    try {
      await nativeTts.speak({ text, lang: nativeLang, rate: opts.slow ? 0.45 : 0.85, pitch: 1.1, volume: 1, category: 'ambient' });
      return true;
    } catch { /* fall through */ }
  }

  if (webVoice && typeof speechSynthesis !== 'undefined') return speakWeb(text, webVoice, webVoice.lang, opts.slow ? 0.45 : 0.8);
  return false;
}

/** Speak an English line (bilingual mode only). */
export async function sayEnglish(text: string, clip?: string, opts: SpeakOpts = {}): Promise<boolean> {
  if (!getState().voice) return false;
  await initSpeech();
  stopSpeech();
  return tracked(speakEnglish(text, clip, opts));
}

async function speakEnglish(text: string, clip?: string, opts: SpeakOpts = {}): Promise<boolean> {
  if (clip && manifest?.has(clip)) {
    try {
      const a = new Audio(`./audio/${clip}.mp3`);
      if (opts.slow) a.playbackRate = 0.7;
      currentAudio = a;
      await a.play();
      await new Promise((r) => { a.onended = r; a.onerror = r; });
      return true;
    } catch { /* fall through */ }
  }
  if (nativeEnglish) {
    try { await nativeEnglish.speak({ text, lang: 'en-US', rate: opts.slow ? 0.5 : 0.95, pitch: 1.1, volume: 1, category: 'ambient' }); return true; } catch { /* fall through */ }
  }
  if (typeof speechSynthesis === 'undefined') return false;
  const v = speechSynthesis.getVoices().find((x) => /^en/i.test(x.lang));
  return speakWeb(text, v ?? null, 'en-US', opts.slow ? 0.5 : 0.95);
}

function speakWeb(text: string, voice: SpeechSynthesisVoice | null, lang: string, rate: number): Promise<boolean> {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? lang;
    u.rate = rate;
    u.pitch = 1.1;
    let done = false;
    const finish = (ok: boolean) => { if (!done) { done = true; resolve(ok); } };
    u.onend = () => finish(true);
    u.onerror = () => finish(false);
    speechSynthesis.speak(u);
    // Some engines never fire onend; allow time proportional to the text length.
    setTimeout(() => finish(true), 2500 + text.length * 140);
  });
}

/**
 * Speak an instruction. Nepali always comes first — the app exists so children hear Nepali.
 * In bilingual mode ("नेपाली + English", for families abroad) the English line follows, unless
 * something else started speaking in between.
 */
export async function instruct(t: { ne: string; en: string }, clip?: string): Promise<unknown> {
  if (!getState().voice) return false;
  await initSpeech();
  stopSpeech();
  const my = gen;
  const spokeNepali = await tracked(speakNepali(t.ne, clip));
  if (getState().lang !== 'en' || my !== gen) return spokeNepali;
  if (spokeNepali) await new Promise((r) => setTimeout(r, 250));
  if (my !== gen) return spokeNepali;
  return tracked(speakEnglish(t.en));
}

export function isSpeaking(): boolean { return speaking > 0; }

/** True if some English voice can speak (needed for the ABC section). */
export function canSpeakEnglish(): boolean {
  if (!getState().voice) return false;
  if (manifest && [...manifest].some((c) => c.startsWith('en-'))) return true;
  if (nativeEnglish) return true;
  try { return typeof speechSynthesis !== 'undefined' && speechSynthesis.getVoices().some((v) => /^en/i.test(v.lang)); } catch { return false; }
}
