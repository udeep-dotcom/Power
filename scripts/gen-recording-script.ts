// Writes docs/recording-script.csv: every clip a native Nepali voice artist should record.
// Run: node scripts/gen-recording-script.ts   (Node ≥ 22.18 strips TypeScript types natively)
import { writeFileSync } from 'node:fs';
import { LETTERS, letterChant } from '../src/data/alphabet.ts';
import { BK_CONSONANTS, MATRAS, syllable, syllableRoman } from '../src/data/barakhari.ts';
import { ALL_WORDS } from '../src/data/words.ts';
import { NUMBERS } from '../src/data/numbers.ts';
import { STORIES } from '../src/data/stories.ts';
import { BLEND_WORDS, EN_LETTERS, MINIMAL_PAIRS } from '../src/data/phonics.ts';

const rows: string[][] = [['clip_id', 'text_to_say', 'notes']];
for (const l of LETTERS) {
  rows.push([`letter-${l.id}`, l.say ?? l.char, `Letter name only (${l.roman}). Clear, slightly slow.`]);
  rows.push([`word-${l.id}`, l.word, `Example word (${l.wordRoman} = ${l.meaning}).`]);
  rows.push([`chant-${l.id}`, letterChant(l), `Chart chant: "${l.roman}, ${l.wordRoman}-ko ${l.roman}". Warm, playful.`]);
}
// Priority 1 (continued): first words, numbers and story narration — the voice children hear most.
for (const w of ALL_WORDS) rows.push([`w-${w.id}`, w.ne, `First word (${w.roman} = ${w.en}).`]);
for (const n of NUMBERS) rows.push([`n-${n.n}`, n.ne, `Number ${n.n} (${n.roman}).`]);
for (const st of STORIES) st.pages.forEach((p, i) => rows.push([`story-${st.id}-${i + 1}`, p.text.ne, `Story "${st.title.en}", page ${i + 1}: storyteller voice, slow and warm. (${p.text.en})`]));
const priority1 = rows.length - 1;

// Priority 2 (optional): बाह्रखरी syllables. TTS reads syllables much better than lone letters,
// so record these after priority 1.
for (const c of BK_CONSONANTS) {
  for (const m of MATRAS) rows.push([`syl-${c.id}-${m.id}`, syllable(c, m), `बाह्रखरी syllable (${syllableRoman(c, m)}). Priority 2.`]);
}
const priority2 = rows.length - 1 - priority1;

// Priority 3 — sounds & phonics (v0.4).
// Nepali minimal pairs + blend words: the SAME Nepali voice. Say each pair word on its own, clearly;
// the child must hear the one difference (हावा / जिब्रो).
for (const p of MINIMAL_PAIRS.filter((x) => x.lang === 'ne')) {
  rows.push([`mp-${p.id}-a`, p.a.word, `Minimal pair "${p.a.word} / ${p.b.word}" — say only ${p.a.word} (${p.a.en}). Priority 3.`]);
  rows.push([`mp-${p.id}-b`, p.b.word, `Minimal pair "${p.a.word} / ${p.b.word}" — say only ${p.b.word} (${p.b.en}). Priority 3.`]);
}
for (const w of BLEND_WORDS.filter((x) => x.lang === 'ne')) rows.push([`w-blend-${w.id}`, w.word, `Blend word (${w.en}). Natural speed; the app slows it down itself. Priority 3.`]);
// English: a DIFFERENT voice — a native speaker of standard Southern British English (the accent
// of UK primary-school phonics). Pure sounds must have NO "uh" after them: "sss" not "suh",
// "mmm" not "muh". Stop sounds (t p k b d g) as short and crisp as possible.
const stop = new Set(['t', 'p', 'c', 'k', 'b', 'd', 'g', 'j', 'q', 'x']);
// UK letter names that differ from US ones, and the short vowels text-to-speech gets wrong.
const UK_NAME: Record<string, string> = { z: 'zed', h: 'aitch' };
const VOWEL_NOTE: Record<string, string> = {
  a: ' The short "a" of apple/cat (NOT the "ah" of father/bath).',
  o: ' The short "o" of hot/dog (NOT "oh").',
  u: ' The short "u" of cup/sun.',
  e: ' The short "e" of egg/bed.',
  i: ' The short "i" of insect/pig.',
};
for (const l of EN_LETTERS) {
  rows.push([`en-s-${l.id}`, `[sound of ${l.id}, as in ${l.word}]`, `UK ENGLISH voice. The SOUND of "${l.id}" ${l.ipa} as in "${l.word}"${stop.has(l.id) ? ' — short and crisp, as little "uh" as possible' : ' — hold it ~1 s, no "uh" after it'}.${VOWEL_NOTE[l.id] ?? ''} Priority 3.`]);
  rows.push([`en-n-${l.id}`, UK_NAME[l.id] ?? l.upper, `UK ENGLISH voice. The letter NAME "${l.upper}"${UK_NAME[l.id] ? ` — UK: "${UK_NAME[l.id]}"` : ''}. Priority 3.`]);
  rows.push([`en-w-${l.word}`, l.word, `UK ENGLISH voice. Key word for ${l.id} (${l.word}). Priority 3.`]);
}
const enWords = new Set(EN_LETTERS.map((l) => l.word));
for (const w of BLEND_WORDS.filter((x) => x.lang === 'en')) {
  if (!enWords.has(w.word)) { enWords.add(w.word); rows.push([`en-w-${w.word}`, w.word, `UK ENGLISH voice. Blend word. Priority 3.`]); }
  const rime = w.chunks[1];
  rows.push([`en-r-${rime}`, rime, `UK ENGLISH voice. The rime "-${rime}" as in "${w.word}" — one syllable, not spelled out. Priority 3.`]);
}
for (const p of MINIMAL_PAIRS.filter((x) => x.lang === 'en')) {
  for (const x of [p.a, p.b]) if (!enWords.has(x.word)) { enWords.add(x.word); rows.push([`en-w-${x.word}`, x.word, `UK ENGLISH voice. Minimal pair "${p.a.word} / ${p.b.word}". Priority 3.`]); }
}
// de-duplicate (a rime like "at" appears in several words)
const seen = new Set<string>();
for (let i = rows.length - 1; i > 0; i--) { if (seen.has(rows[i][0])) rows.splice(i, 1); else seen.add(rows[i][0]); }

const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n') + '\n';
writeFileSync(new URL('../docs/recording-script.csv', import.meta.url), csv);
console.log(`${rows.length - 1} clips (${priority1} priority 1, ${priority2} priority 2, ${rows.length - 1 - priority1 - priority2} priority 3)`);
