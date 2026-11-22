// Progress + settings store. Tiny observable with persistence.
// Web: localStorage. Android (Capacitor): also mirrored to @capacitor/preferences, because the
// OS may clear WebView storage under pressure and losing a child's stickers is a real betrayal.

import { useEffect, useState } from 'preact/hooks';
import type { Lang } from '../data/i18n';
import { JOURNEY } from '../data/journey';

export interface LetterProgress { trace: number; correct: number; wrong: number; seen: boolean }

export interface State {
  v: 1;
  lang: Lang;
  sound: boolean;
  voice: boolean;
  roman: boolean;
  unlockAll: boolean;
  letters: Record<string, LetterProgress>;
  /** stars (1–3) earned per journey node key, e.g. "L:ka", "G:u1", "S:u1" */
  nodes: Record<string, number>;
  stickers: string[];
  newStickers: string[];
  provincesSeen: string[];
  cardsSeen: string[];
  quizBest: number;
  playSeconds: number;
  lastPlayed: number;
}

const KEY = 'akshar-yatra:v1';

export const DEFAULT_STATE: State = {
  v: 1, lang: 'ne', sound: true, voice: true, roman: false, unlockAll: false,
  letters: {}, nodes: {}, stickers: [], newStickers: [], provincesSeen: [], cardsSeen: [],
  quizBest: 0, playSeconds: 0, lastPlayed: 0,
};

let state: State = load();
const listeners = new Set<() => void>();
let nativePrefs: { set(o: { key: string; value: string }): Promise<void> } | null = null;

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch { /* storage unavailable (private mode, sandboxed preview) — play without saving */ }
  return { ...DEFAULT_STATE };
}

/** On Android, prefer the Preferences copy if it is newer than localStorage's. */
export async function hydrateNative(): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    const { Preferences } = await import('@capacitor/preferences');
    nativePrefs = Preferences;
    const { value } = await Preferences.get({ key: KEY });
    if (value) {
      const saved = { ...DEFAULT_STATE, ...JSON.parse(value) } as State;
      if (saved.lastPlayed >= state.lastPlayed) { state = saved; emit(); }
    }
  } catch { /* not native */ }
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const raw = JSON.stringify(state);
    try { localStorage.setItem(KEY, raw); } catch { /* ignore */ }
    nativePrefs?.set({ key: KEY, value: raw }).catch(() => {});
  }, 150);
}

function emit() { listeners.forEach((l) => l()); }

export function getState(): State { return state; }

export function update(fn: (s: State) => void): void {
  const next: State = structuredClone(state);
  fn(next);
  next.lastPlayed = Date.now();
  state = next;
  persist();
  emit();
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useStore(): State {
  const [, force] = useState(0);
  useEffect(() => subscribe(() => force((n) => n + 1)), []);
  return state;
}

// ── domain helpers ──

export function letterProgress(s: State, id: string): LetterProgress {
  return s.letters[id] ?? { trace: 0, correct: 0, wrong: 0, seen: false };
}

export function recordAnswer(letterId: string, ok: boolean): void {
  update((s) => {
    const p = (s.letters[letterId] ??= { trace: 0, correct: 0, wrong: 0, seen: false });
    if (ok) p.correct++; else p.wrong++;
  });
}

export function completeNode(key: string, stars: number): void {
  update((s) => { s.nodes[key] = Math.max(s.nodes[key] ?? 0, stars); });
}

export function awardSticker(id: string): boolean {
  if (state.stickers.includes(id)) return false;
  update((s) => { s.stickers.push(id); s.newStickers.push(id); });
  return true;
}

/** Index of the first journey node not yet completed (the child's "current" stop). */
export function currentNodeIndex(s: State): number {
  const i = JOURNEY.findIndex((n) => !s.nodes[n.key]);
  return i < 0 ? JOURNEY.length - 1 : i;
}

export function isNodeUnlocked(s: State, index: number): boolean {
  return s.unlockAll || index <= currentNodeIndex(s) || !!s.nodes[JOURNEY[index].key];
}

/**
 * A 0..1 mastery estimate per letter, used to pick review letters and in the parent report.
 * Blends tracing quality with recognition accuracy; recognition gets more weight because it
 * is measured many times, tracing once or twice.
 */
export function mastery(p: LetterProgress): number {
  if (!p.seen) return 0;
  const attempts = p.correct + p.wrong;
  const acc = attempts ? p.correct / attempts : 0.5;
  const confidence = Math.min(1, attempts / 5);
  return Math.max(0, Math.min(1, 0.3 * (p.trace / 3) + 0.7 * (acc * confidence + 0.5 * (1 - confidence))));
}

export function resetProgress(): void {
  update((s) => {
    const keep = { lang: s.lang, sound: s.sound, voice: s.voice, roman: s.roman };
    Object.assign(s, structuredClone(DEFAULT_STATE), keep);
  });
}

// Count play time while the tab/app is visible.
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      state = { ...state, playSeconds: state.playSeconds + 15 };
      persist();
    }
  }, 15_000);
}
