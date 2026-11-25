// Progress + settings store. Tiny observable with persistence.
// Web: localStorage. Android (Capacitor): also mirrored to @capacitor/preferences, because the
// OS may clear WebView storage under pressure and losing a child's stickers is a real betrayal.
//
// Players: siblings often share one family phone, so progress is kept per player profile.
// The ACTIVE player's progress lives at the top level of State (so screens read `s.letters`,
// `s.nodes` … directly); inactive players' progress is parked in `profiles[i].data`.

import { useEffect, useState } from 'preact/hooks';
import type { Lang } from '../data/i18n';
import { JOURNEY } from '../data/journey';

export interface LetterProgress { trace: number; correct: number; wrong: number; seen: boolean }

export interface Progress {
  letters: Record<string, LetterProgress>;
  /** stars (1–3) per journey node key, e.g. "L:ka", "G:u1", "S:u1"; also "B:game", "P:practice" */
  nodes: Record<string, number>;
  stickers: string[];
  newStickers: string[];
  provincesSeen: string[];
  cardsSeen: string[];
  quizBest: number;
  playSeconds: number;
  /** बाह्रखरी: consonant ids the child has explored */
  barakhari: string[];
  /** ISO dates (YYYY-MM-DD) on which a practice session was completed (shown to parents only) */
  practiceDays: string[];
  /** first-words ids the child has heard (शब्द) */
  wordsHeard: string[];
  /** story ids read to the end (कथा) */
  storiesRead: string[];
  /** colouring pages: page id → region id → colour */
  coloring: Record<string, Record<string, string>>;
  /** phonics sounds explored: "ne:ka", "en:s" … */
  soundsHeard: string[];
}

/** `age` (3–6) tunes difficulty; undefined until the child (or parent) answers once. */
export interface Profile { id: string; avatar: string; name: string; age?: number; data?: Progress }

export interface State extends Progress {
  v: 2;
  lang: Lang;
  sound: boolean;
  voice: boolean;
  roman: boolean;
  unlockAll: boolean;
  /** gentle background music on menus */
  music: boolean;
  /** allow on-device "hear yourself" recording (never uploaded) */
  mic: boolean;
  /** daily play limit in minutes (0 = off) — screen time matters at this age */
  playLimit: number;
  /** today's date and play time (all players together), plus extra minutes a parent granted today */
  playDay: string;
  playDaySeconds: number;
  playExtra: number;
  profiles: Profile[];
  active: string;
  lastPlayed: number;
}

export const PROGRESS_KEYS = ['letters', 'nodes', 'stickers', 'newStickers', 'provincesSeen', 'cardsSeen', 'quizBest', 'playSeconds', 'barakhari', 'practiceDays', 'wordsHeard', 'storiesRead', 'coloring', 'soundsHeard'] as const;

export const AVATARS = ['🐯', '🐘', '🦏', '🐒', '🐻', '🐦'];
export const MAX_PROFILES = 4;

export function emptyProgress(): Progress {
  return {
    letters: {}, nodes: {}, stickers: [], newStickers: [], provincesSeen: [], cardsSeen: [], quizBest: 0, playSeconds: 0,
    barakhari: [], practiceDays: [], wordsHeard: [], storiesRead: [], coloring: {}, soundsHeard: [],
  };
}

export function defaultState(): State {
  return {
    v: 2, lang: 'ne', sound: true, voice: true, roman: false, unlockAll: false, music: true, mic: true, playLimit: 0, playDay: '', playDaySeconds: 0, playExtra: 0,
    ...emptyProgress(),
    profiles: [{ id: 'p1', avatar: AVATARS[0], name: '' }], active: 'p1', lastPlayed: 0,
  };
}

const KEY = 'akshar-yatra:v1'; // storage key stays stable across schema versions

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

/** Upgrade any saved shape to the current schema. Exported for tests. */
export function migrate(raw: unknown): State {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<State> & { v?: number };
  const merged: State = { ...base, ...r, v: 2 } as State;
  // v1 had no profiles: its progress becomes player 1.
  if (!Array.isArray(r.profiles) || r.profiles.length === 0) {
    merged.profiles = [{ id: 'p1', avatar: AVATARS[0], name: '' }];
    merged.active = 'p1';
  }
  if (!merged.profiles.some((p) => p.id === merged.active)) merged.active = merged.profiles[0].id;
  for (const k of PROGRESS_KEYS) if (merged[k] === undefined) (merged as unknown as Record<string, unknown>)[k] = emptyProgress()[k];
  return merged;
}

/** Local calendar date (YYYY-MM-DD). */
export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** True once today's play time has reached the parent's limit (plus any extra granted). */
export function overPlayLimit(s: State = state): boolean {
  if (!s.playLimit || s.playDay !== today()) return false;
  return s.playDaySeconds >= (s.playLimit + s.playExtra) * 60;
}

let state: State = load();
const listeners = new Set<() => void>();
let nativePrefs: { set(o: { key: string; value: string }): Promise<void> } | null = null;

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch { /* storage unavailable (private mode, sandboxed preview) — play without saving */ }
  return defaultState();
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
      const saved = migrate(JSON.parse(value));
      if (saved.lastPlayed >= state.lastPlayed) { state = saved; emit(); }
    }
  } catch { /* not native */ }
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 150);
}
function flush() {
  const raw = JSON.stringify(state);
  try { localStorage.setItem(KEY, raw); } catch { /* ignore */ }
  nativePrefs?.set({ key: KEY, value: raw }).catch(() => {});
}
// Don't lose the last 150 ms of progress when the app is backgrounded or closed.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { clearTimeout(saveTimer); flush(); } });
}

function emit() { listeners.forEach((l) => l()); }

export function getState(): State { return state; }

export function update(fn: (s: State) => void): void {
  const next = clone(state);
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

// ── players ──

function parkActive(s: State) {
  const cur = s.profiles.find((p) => p.id === s.active);
  if (cur) cur.data = Object.fromEntries(PROGRESS_KEYS.map((k) => [k, s[k]])) as unknown as Progress;
}

export function activeProfile(s: State = state): Profile {
  return s.profiles.find((p) => p.id === s.active) ?? s.profiles[0];
}

export function switchProfile(id: string): void {
  if (id === state.active) return;
  update((s) => {
    const next = s.profiles.find((p) => p.id === id);
    if (!next) return;
    parkActive(s);
    Object.assign(s, next.data ?? emptyProgress());
    delete next.data;
    s.active = id;
  });
}

export function addProfile(avatar: string, name = ''): string | null {
  if (state.profiles.length >= MAX_PROFILES) return null;
  let id: string;
  do { id = `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`; } while (state.profiles.some((p) => p.id === id));
  update((s) => { s.profiles.push({ id, avatar, name: name.trim().slice(0, 20), data: emptyProgress() }); });
  return id;
}

export function editProfile(id: string, patch: { avatar?: string; name?: string; age?: number }): void {
  update((s) => {
    const p = s.profiles.find((x) => x.id === id);
    if (!p) return;
    if (patch.avatar) p.avatar = patch.avatar;
    if (patch.age) p.age = Math.max(3, Math.min(6, Math.round(patch.age)));
    if (patch.name !== undefined) p.name = patch.name.trim().slice(0, 20);
  });
}

export function removeProfile(id: string): void {
  if (state.profiles.length <= 1) return;
  const other = state.profiles.find((p) => p.id !== id);
  if (!other) return;
  if (id === state.active) switchProfile(other.id);
  update((s) => { s.profiles = s.profiles.filter((p) => p.id !== id); });
}

// ── domain helpers ──

export function letterProgress(s: Progress, id: string): LetterProgress {
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

/** Letters the child has completed a lesson for. */
export function learnedLetterIds(s: Progress): string[] {
  return Object.keys(s.nodes).filter((k) => k.startsWith('L:')).map((k) => k.slice(2));
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

/** Reset one player's progress (default: the active player); settings and other players are untouched. */
export function resetProgress(id: string = state.active): void {
  update((s) => {
    if (id === s.active) Object.assign(s, emptyProgress());
    else { const p = s.profiles.find((x) => x.id === id); if (p) p.data = emptyProgress(); }
  });
}



// Count play time while the tab/app is visible.
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      const d = today();
      const sameDay = state.playDay === d;
      state = {
        ...state, playSeconds: state.playSeconds + 15, playDay: d,
        playDaySeconds: (sameDay ? state.playDaySeconds : 0) + 15, playExtra: sameDay ? state.playExtra : 0,
      };
      persist();
      emit();
    }
  }, 15_000);
}

/** Mark something as seen in a list-type progress field (no duplicates). */
export function markSeen(key: 'wordsHeard' | 'storiesRead' | 'barakhari' | 'cardsSeen' | 'provincesSeen' | 'soundsHeard', id: string): void {
  if (state[key].includes(id)) return;
  update((s) => { s[key].push(id); });
}
