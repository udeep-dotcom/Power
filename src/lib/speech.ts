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
let nativeTts: null | { speak(o: object): Promise<void>; stop(): Promise<void>; getSupportedLanguages(): Promise<{ languages: string[] }> } = null;
let nativeLang = 'ne-NP';
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
    if (!ne && !hi) return;
    nativeLang = ne ?? hi!;
    nativeTts = TextToSpeech as unknown as typeof nativeTts;
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

export function stopSpeech(): void {
  currentAudio?.pause();
  currentAudio = null;
  try { speechSynthesis?.cancel(); } catch { /* */ }
  void nativeTts?.stop().catch(() => {});
}

/**
 * Speak Nepali text. `clip` is the id of a recorded file that says the same thing
 * (e.g. "letter-ka", "chant-ka", "word-ka"). Resolves when finished (or immediately if silent).
 */
export async function say(text: string, clip?: string): Promise<boolean> {
  if (!getState().voice) return false;
  await initSpeech();
  stopSpeech();

  if (clip && manifest?.has(clip)) {
    try {
      const a = new Audio(`./audio/${clip}.mp3`);
      currentAudio = a;
      await a.play();
      await new Promise((r) => { a.onended = r; a.onerror = r; });
      return true;
    } catch { /* fall through */ }
  }

  if (nativeTts) {
    try {
      await nativeTts.speak({ text, lang: nativeLang, rate: 0.85, pitch: 1.1, volume: 1, category: 'ambient' });
      return true;
    } catch { /* fall through */ }
  }

  if (webVoice && typeof speechSynthesis !== 'undefined') {
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.voice = webVoice;
      u.lang = webVoice!.lang;
      u.rate = 0.8;
      u.pitch = 1.1;
      u.onend = () => resolve(true);
      u.onerror = () => resolve(false);
      speechSynthesis.speak(u);
      setTimeout(() => resolve(true), 6000); // some engines never fire onend
    });
  }
  return false;
}

/** Speak an English line (used only when the parent picked English instructions). */
export async function sayEnglish(text: string): Promise<void> {
  if (!getState().voice || typeof speechSynthesis === 'undefined') return;
  stopSpeech();
  const v = speechSynthesis.getVoices().find((x) => /^en/i.test(x.lang));
  const u = new SpeechSynthesisUtterance(text);
  if (v) u.voice = v;
  u.rate = 0.95;
  u.pitch = 1.15;
  speechSynthesis.speak(u);
}

/** Speak an instruction in the parent's chosen instruction language. */
export function instruct(t: { ne: string; en: string }, clip?: string): Promise<unknown> {
  return getState().lang === 'en' ? sayEnglish(t.en) : say(t.ne, clip);
}
