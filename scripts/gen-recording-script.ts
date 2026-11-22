// Writes docs/recording-script.csv: every clip a native Nepali voice artist should record.
// Run: node scripts/gen-recording-script.ts   (Node ≥ 22.18 strips TypeScript types natively)
import { writeFileSync } from 'node:fs';
import { LETTERS, letterChant } from '../src/data/alphabet.ts';
import { BK_CONSONANTS, MATRAS, syllable, syllableRoman } from '../src/data/barakhari.ts';

const rows: string[][] = [['clip_id', 'text_to_say', 'notes']];
for (const l of LETTERS) {
  rows.push([`letter-${l.id}`, l.say ?? l.char, `Letter name only (${l.roman}). Clear, slightly slow.`]);
  rows.push([`word-${l.id}`, l.word, `Example word (${l.wordRoman} = ${l.meaning}).`]);
  rows.push([`chant-${l.id}`, letterChant(l), `Chart chant: "${l.roman}, ${l.wordRoman}-ko ${l.roman}". Warm, playful.`]);
}
// Priority 2 (optional): बाह्रखरी syllables. TTS reads syllables much better than lone letters,
// so record these after the 147 above.
for (const c of BK_CONSONANTS) {
  for (const m of MATRAS) rows.push([`syl-${c.id}-${m.id}`, syllable(c, m), `बाह्रखरी syllable (${syllableRoman(c, m)}). Priority 2.`]);
}
const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n') + '\n';
writeFileSync(new URL('../docs/recording-script.csv', import.meta.url), csv);
console.log(`${rows.length - 1} clips (${LETTERS.length * 3} priority 1)`);
