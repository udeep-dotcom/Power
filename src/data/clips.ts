// Every line the app can play from a recording, in one place. The Voice Studio (Parent zone) walks
// grown-ups through recording them, `scripts/gen-recording-script.ts` writes the same list as a CSV
// for a professional voice artist, and `src/lib/speech.ts` plays a recording whenever one exists.
//
// Voices: 'ne' = the Nepali voice (a parent, grandparent or Nepali voice artist);
//         'en' = a UK English voice (standard Southern British, as in UK primary-school phonics).

import { LETTERS, LETTER_BY_ID, letterChant } from './alphabet.ts';
import { BK_CONSONANTS, MATRAS, syllable, syllableRoman } from './barakhari.ts';
import { UI, type T } from './i18n.ts';
import { GAME_META } from './journey.ts';
import { NUMBERS } from './numbers.ts';
import { BLEND_WORDS, EN_LETTERS, MINIMAL_PAIRS } from './phonics.ts';
import { STORIES } from './stories.ts';
import { ALL_WORDS } from './words.ts';

export type ClipVoice = 'ne' | 'en';
export type ClipGroup = 'habre' | 'letters' | 'en-sounds' | 'words' | 'numbers' | 'stories' | 'sounds-ne' | 'en-words' | 'habre-en' | 'barakhari';
export interface Clip { id: string; text: string; note: string; voice: ClipVoice; group: ClipGroup; priority: 1 | 2 | 3 }

/** Studio tabs, in the order that helps children most per minute recorded. */
export const CLIP_GROUPS: { id: ClipGroup; title: T; voice: ClipVoice }[] = [
  { id: 'habre', title: { ne: 'हाब्रेका कुरा', en: "Habre's lines" }, voice: 'ne' },
  { id: 'letters', title: { ne: 'अक्षर', en: 'Letters' }, voice: 'ne' },
  { id: 'en-sounds', title: { ne: 'अङ्ग्रेजी ध्वनि', en: 'English sounds' }, voice: 'en' },
  { id: 'words', title: { ne: 'शब्द', en: 'Words' }, voice: 'ne' },
  { id: 'numbers', title: { ne: 'अङ्क', en: 'Numbers' }, voice: 'ne' },
  { id: 'stories', title: { ne: 'कथा', en: 'Stories' }, voice: 'ne' },
  { id: 'sounds-ne', title: { ne: 'नेपाली ध्वनि खेल', en: 'Nepali sound games' }, voice: 'ne' },
  { id: 'en-words', title: { ne: 'अङ्ग्रेजी शब्द', en: 'English words' }, voice: 'en' },
  { id: 'habre-en', title: { ne: 'हाब्रे (अङ्ग्रेजीमा)', en: 'Habre in English' }, voice: 'en' },
  { id: 'barakhari', title: { ne: 'बाह्रखरी (ऐच्छिक)', en: 'Barakhari (optional)' }, voice: 'ne' },
];

/** UI lines Habre says aloud (instructions, greetings, praise). Labels are not spoken, so not listed.
 *  A unit test checks this against every `instruct(UI.…)` / `<HabreSays text={UI.…}>` in src/. */
export const SPOKEN_UI = [
  'hello', 'welcomeBack', 'howOld', 'talkQ', 'great', 'locked', 'sleepy', 'traceHint', 'listenHow', 'bkPick', 'bkGameHow',
  'wordsHello', 'numbersHello', 'storiesHello', 'playHello', 'instrumentsHello', 'colourHello', 'flagHint', 'flagDone',
  'soundsHello', 'abcHello', 'blendHow', 'pairsHow', 'huntHow', 'friendsHow', 'feelAir', 'feelBuzz', 'feelNose', 'micOff', 'needsVoice',
] as const;

/** lowercase file-safe ids: welcomeBack → welcome-back (case-insensitive disks can't tell A from a) */
const kebab = (k: string) => k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** Habre's spoken lines with stable clip ids: ui-<key>, ui-<key>-<n> for lists, ui-game-<mode>. */
export const HABRE_LINES: { id: string; t: T }[] = [
  ...SPOKEN_UI.flatMap((key) => {
    const v = (UI as Record<string, T | T[]>)[key];
    return Array.isArray(v) ? v.map((t, i) => ({ id: `ui-${kebab(key)}-${i}`, t })) : v ? [{ id: `ui-${kebab(key)}`, t: v }] : [];
  }),
  ...Object.entries(GAME_META).map(([mode, m]) => ({ id: `ui-game-${mode}`, t: m.howto })),
];

const BY_NE = new Map(HABRE_LINES.map((l) => [l.t.ne, l.id]));
/** The clip id of one of Habre's lines, found by its Nepali text (undefined for dynamic lines). */
export const lineClip = (t: T): string | undefined => BY_NE.get(t.ne);

const STOP = new Set(['t', 'p', 'c', 'k', 'b', 'd', 'g', 'j', 'q', 'x']);
const UK_NAME: Record<string, string> = { z: 'zed', h: 'aitch' };
const VOWEL_NOTE: Record<string, string> = {
  a: ' The short "a" of apple/cat (NOT the "ah" of father/bath).',
  o: ' The short "o" of hot/dog (NOT "oh").',
  u: ' The short "u" of cup/sun.',
  e: ' The short "e" of egg/bed.',
  i: ' The short "i" of insect/pig.',
};

function build(): Clip[] {
  const out: Clip[] = [];
  const add = (c: Clip) => { if (!out.some((x) => x.id === c.id)) out.push(c); };

  // Priority 1 — what children hear most
  for (const l of HABRE_LINES) add({ id: l.id, text: l.t.ne, note: `Habre, warm and playful. (${l.t.en})`, voice: 'ne', group: 'habre', priority: 1 });
  for (const l of LETTERS) {
    add({ id: `letter-${l.id}`, text: l.say ?? l.char, note: `Letter name only (${l.roman}). Clear, slightly slow.`, voice: 'ne', group: 'letters', priority: 1 });
    add({ id: `word-${l.id}`, text: l.word, note: `Example word (${l.wordRoman} = ${l.meaning}).`, voice: 'ne', group: 'letters', priority: 1 });
    add({ id: `chant-${l.id}`, text: letterChant(l), note: `Chart chant: "${l.roman}, ${l.wordRoman}-ko ${l.roman}". Warm, playful.`, voice: 'ne', group: 'letters', priority: 1 });
  }
  for (const w of ALL_WORDS) add({ id: `w-${w.id}`, text: w.ne, note: `First word (${w.roman} = ${w.en}).`, voice: 'ne', group: 'words', priority: 1 });
  for (const n of NUMBERS) add({ id: `n-${n.n}`, text: n.ne, note: `Number ${n.n} (${n.roman}).`, voice: 'ne', group: 'numbers', priority: 1 });
  for (const st of STORIES) st.pages.forEach((p, i) => add({ id: `story-${st.id}-${i + 1}`, text: p.text.ne, note: `Story "${st.title.en}", page ${i + 1}: storyteller voice, slow and warm. (${p.text.en})`, voice: 'ne', group: 'stories', priority: 1 }));
  // English phonics sounds: without these the English sound games stay locked (TTS can't make them)
  for (const l of EN_LETTERS) {
    add({ id: `en-s-${l.id}`, text: `[sound of ${l.id}, as in ${l.word}]`, voice: 'en', group: 'en-sounds', priority: 1,
      note: `UK ENGLISH voice. The SOUND of "${l.id}" ${l.ipa} as in "${l.word}"${STOP.has(l.id) ? ' — short and crisp, as little "uh" as possible' : ' — hold it ~1 s, no "uh" after it'}.${VOWEL_NOTE[l.id] ?? ''}` });
  }

  // Priority 2 — optional बाह्रखरी syllables
  for (const c of BK_CONSONANTS) for (const m of MATRAS) add({ id: `syl-${c.id}-${m.id}`, text: syllable(c, m), note: `बाह्रखरी syllable (${syllableRoman(c, m)}).`, voice: 'ne', group: 'barakhari', priority: 2 });

  // Priority 3 — sound games and English words
  for (const p of MINIMAL_PAIRS.filter((x) => x.lang === 'ne')) {
    add({ id: `mp-${p.id}-a`, text: p.a.word, note: `Minimal pair "${p.a.word} / ${p.b.word}" — say only ${p.a.word} (${p.a.en}).`, voice: 'ne', group: 'sounds-ne', priority: 3 });
    add({ id: `mp-${p.id}-b`, text: p.b.word, note: `Minimal pair "${p.a.word} / ${p.b.word}" — say only ${p.b.word} (${p.b.en}).`, voice: 'ne', group: 'sounds-ne', priority: 3 });
  }
  for (const w of BLEND_WORDS.filter((x) => x.lang === 'ne')) add({ id: `w-blend-${w.id}`, text: w.word, note: `Blend word (${w.en}). Natural speed; the app slows it down itself.`, voice: 'ne', group: 'sounds-ne', priority: 3 });
  for (const l of EN_LETTERS) {
    add({ id: `en-n-${l.id}`, text: UK_NAME[l.id] ?? l.upper, note: `UK ENGLISH voice. The letter NAME "${l.upper}"${UK_NAME[l.id] ? ` — UK: "${UK_NAME[l.id]}"` : ''}.`, voice: 'en', group: 'en-words', priority: 3 });
    add({ id: `en-w-${l.word}`, text: l.word, note: `UK ENGLISH voice. Key word for ${l.id} (${l.word}).`, voice: 'en', group: 'en-words', priority: 3 });
  }
  for (const w of BLEND_WORDS.filter((x) => x.lang === 'en')) {
    add({ id: `en-w-${w.word}`, text: w.word, note: 'UK ENGLISH voice. Blend word.', voice: 'en', group: 'en-words', priority: 3 });
    add({ id: `en-r-${w.chunks[1]}`, text: w.chunks[1], note: `UK ENGLISH voice. The rime "-${w.chunks[1]}" as in "${w.word}" — one syllable, not spelled out.`, voice: 'en', group: 'en-words', priority: 3 });
  }
  for (const p of MINIMAL_PAIRS.filter((x) => x.lang === 'en')) for (const x of [p.a, p.b]) add({ id: `en-w-${x.word}`, text: x.word, note: `UK ENGLISH voice. Minimal pair "${p.a.word} / ${p.b.word}".`, voice: 'en', group: 'en-words', priority: 3 });
  // Habre in English (for children who are spoken to in English, see Parent zone → Habre speaks)
  for (const l of HABRE_LINES) add({ id: `${l.id}-en`, text: l.t.en, note: 'UK ENGLISH voice. Habre, warm and playful.', voice: 'en', group: 'habre-en', priority: 3 });
  for (const st of STORIES) st.pages.forEach((p, i) => add({ id: `story-${st.id}-${i + 1}-en`, text: p.text.en, note: `UK ENGLISH voice. Story "${st.title.en}", page ${i + 1}: storyteller voice, slow and warm.`, voice: 'en', group: 'habre-en', priority: 3 }));
  return out;
}

export const CLIPS: Clip[] = build();
export const CLIP_BY_ID: Record<string, Clip> = Object.fromEntries(CLIPS.map((c) => [c.id, c]));

/** English letter-sound clips a phonics activity needs before it can be played honestly. */
export const enSoundIds = (letters: string[]) => [...new Set(letters)].map((l) => `en-s-${l}`);

/** Text-to-speech can't make pure phonics sounds, so these games stay locked until the sounds
 *  they use are recorded (Voice Studio, or bundled by scripts/import-voices.mjs). */
export const PHONICS_NEEDS = {
  hunt: enSoundIds(EN_LETTERS.filter((l) => l.group <= 3 && l.pos !== 'end').map((l) => l.id)),
  blendEn: enSoundIds(BLEND_WORDS.filter((w) => w.lang === 'en').flatMap((w) => [...w.phonemes, w.chunks[0]])),
  friends: enSoundIds(EN_LETTERS.filter((l) => l.friend && LETTER_BY_ID[l.friend].kind !== 'vowel').map((l) => l.id)),
};
