// बाह्रखरी — the 12 vowel forms of every consonant (क का कि की कु कू के कै को कौ कं कः).
// This is where Nepali children actually get stuck on the way to reading, especially the
// short/long pairs ि/ी and ु/ू, so the game below uses those pairs as distractors.

import { LETTERS, type Letter } from './alphabet.ts'; // explicit .ts: also run by Node scripts
import type { T } from './i18n';

export interface Matra { id: string; sign: string; vowel: string; roman: string; name: T }

export const MATRAS: Matra[] = [
  { id: 'a', sign: '', vowel: 'अ', roman: 'a', name: { ne: 'अकार (चिह्न छैन)', en: 'no sign' } },
  { id: 'aa', sign: 'ा', vowel: 'आ', roman: 'aa', name: { ne: 'आकार', en: 'aa sign' } },
  { id: 'i', sign: 'ि', vowel: 'इ', roman: 'i', name: { ne: 'ह्रस्व इकार', en: 'short i' } },
  { id: 'ii', sign: 'ी', vowel: 'ई', roman: 'ii', name: { ne: 'दीर्घ ईकार', en: 'long ii' } },
  { id: 'u', sign: 'ु', vowel: 'उ', roman: 'u', name: { ne: 'ह्रस्व उकार', en: 'short u' } },
  { id: 'uu', sign: 'ू', vowel: 'ऊ', roman: 'uu', name: { ne: 'दीर्घ ऊकार', en: 'long uu' } },
  { id: 'e', sign: 'े', vowel: 'ए', roman: 'e', name: { ne: 'एकार', en: 'e sign' } },
  { id: 'ai', sign: 'ै', vowel: 'ऐ', roman: 'ai', name: { ne: 'ऐकार', en: 'ai sign' } },
  { id: 'o', sign: 'ो', vowel: 'ओ', roman: 'o', name: { ne: 'ओकार', en: 'o sign' } },
  { id: 'au', sign: 'ौ', vowel: 'औ', roman: 'au', name: { ne: 'औकार', en: 'au sign' } },
  { id: 'am', sign: 'ं', vowel: 'अं', roman: 'am', name: { ne: 'शिरबिन्दु', en: 'anusvara' } },
  { id: 'ah', sign: 'ः', vowel: 'अः', roman: 'ah', name: { ne: 'विसर्ग', en: 'visarga' } },
];

export const MATRA_BY_ID: Record<string, Matra> = Object.fromEntries(MATRAS.map((m) => [m.id, m]));

/** Signs children mix up when READING — offered together when the syllable is shown, not heard. */
export const MATRA_CONFUSABLE: Record<string, string> = {
  i: 'ii', ii: 'i', u: 'uu', uu: 'u', e: 'ai', ai: 'e', o: 'au', au: 'o', aa: 'o', am: 'ah', ah: 'am',
};

/**
 * Partners for LISTENING rounds. In spoken Nepali ि/ी and ु/ू sound the same (the length
 * difference exists only in writing), so a child can't tell them apart by ear — listening
 * rounds pair each sign with one that really sounds different, and never offer a same-sound twin.
 */
export const MATRA_AUDIO_PARTNER: Record<string, string> = {
  i: 'e', ii: 'e', u: 'o', uu: 'o', e: 'ai', ai: 'e', o: 'au', au: 'o', aa: 'o', am: 'ah', ah: 'am',
};
export const SAME_SOUND_TWIN: Record<string, string> = { i: 'ii', ii: 'i', u: 'uu', uu: 'u' };

export const BK_CONSONANTS: Letter[] = LETTERS.filter((l) => l.kind !== 'vowel');

export function syllable(c: Letter, m: Matra): string { return c.char + m.sign; }

/** Romanised syllable for parents: ka + i → ki, ksha + aa → kshaa. */
export function syllableRoman(c: Letter, m: Matra): string {
  return c.roman.replace(/a$/, '') + m.roman;
}

/** A matra shown on its own sits on a dotted circle, the standard way to print it (◌ि). */
export const showSign = (m: Matra) => (m.sign ? `◌${m.sign}` : '—');
