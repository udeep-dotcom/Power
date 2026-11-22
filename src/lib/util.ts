import { CONFUSABLE, LETTERS, LETTER_BY_ID, type Letter } from '../data/alphabet';
import type { T } from '../data/i18n';
import { getState, letterProgress, mastery } from './store';

export function shuffle<X>(a: readonly X[]): X[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export const pick = <X,>(a: readonly X[]): X => a[Math.floor(Math.random() * a.length)];

/** Translate a {ne,en} pair using the current instruction language. */
export function tr(t: T): string { return t[getState().lang]; }

/**
 * Choose `n` distractor letters for `target`. Prefers known look-alikes the child has already
 * met, then same-kind letters (vowel vs consonant), never the target itself.
 */
export function distractors(target: Letter, n: number, pool?: string[]): Letter[] {
  const s = getState();
  const seen = (id: string) => letterProgress(s, id).seen;
  const sameKind = LETTERS.filter((l) => l.id !== target.id && (l.kind === target.kind || (target.kind !== 'vowel' && l.kind !== 'vowel')));
  const lookalikes = (CONFUSABLE[target.id] ?? []).filter(seen).map((id) => LETTER_BY_ID[id]);
  const fromPool = (pool ?? []).filter((id) => id !== target.id).map((id) => LETTER_BY_ID[id]);
  const ordered = [...shuffle(lookalikes), ...shuffle(fromPool), ...shuffle(sameKind)];
  const out: Letter[] = [];
  for (const l of ordered) {
    if (out.length >= n) break;
    if (!out.some((o) => o.id === l.id) && l.id !== target.id && l.pic !== target.pic) out.push(l);
  }
  return out;
}

/** Letters to mix into a game: the unit's letters plus up to `extra` weakest earlier letters. */
export function withReview(unitLetters: string[], extra: number): string[] {
  const s = getState();
  const earlier = Object.keys(s.letters).filter((id) => !unitLetters.includes(id) && s.letters[id].seen);
  const weakest = earlier.sort((a, b) => mastery(letterProgress(s, a)) - mastery(letterProgress(s, b))).slice(0, extra);
  return [...unitLetters, ...weakest];
}

export function haptic(kind: 'light' | 'success' | 'error' = 'light'): void {
  void (async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
        if (kind === 'light') await Haptics.impact({ style: ImpactStyle.Light });
        else await Haptics.notification({ type: kind === 'success' ? NotificationType.Success : NotificationType.Error });
        return;
      }
    } catch { /* fall back */ }
    try { navigator.vibrate?.(kind === 'error' ? [30, 40, 30] : kind === 'success' ? 20 : 8); } catch { /* */ }
  })();
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Stars from mistakes in a mini-game round set. */
export function starsFromMistakes(mistakes: number): number {
  return mistakes <= 1 ? 3 : mistakes <= 3 ? 2 : 1;
}
