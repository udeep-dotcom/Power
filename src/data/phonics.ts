// ध्वनि — phonetics for Nepali and English. Research basis: docs/PHONICS_RESEARCH.md.
//
// NEPALI: the वर्णमाला is itself a phonetic chart. Rows (वर्ग) go from the throat to the lips by
// PLACE of articulation; columns encode AIR (महाप्राण = a puff of breath) and BUZZ (घोष = the
// throat hums). Children feel these with a candle-flame and a throat-buzz animation.
// Honest Nepali facts the app teaches (and never contradicts):
//   • ि/ी and ु/ू sound the SAME in spoken Nepali — the difference is spelling only.
//   • श, ष and स are all usually said "sa".
//
// ENGLISH: synthetic phonics — letter SOUNDS (not names) taught in small groups starting with
// s a t p i n (the order popularised by Jolly Phonics), each with a picture and an action, then
// blended into words. Text-to-speech can't say isolated phonemes well, so `soundSay` is an
// approximation until recorded clips (`en-s-<letter>`) exist — see docs/AUDIO.md.

import type { T } from './i18n';

// ── Nepali: places and features ──

export type Place = 'throat' | 'palate' | 'roof' | 'teeth' | 'lips';

export interface Varga { id: Place; letters: string[]; name: T; how: T }

export const VARGAS: Varga[] = [
  { id: 'throat', letters: ['ka', 'kha', 'ga', 'gha', 'nga'], name: { ne: 'कण्ठ्य — घाँटीबाट', en: 'Throat (velar)' },
    how: { ne: 'जिब्रोको पछाडिको भाग माथि छुन्छ।', en: 'The back of the tongue touches the back of the mouth.' } },
  { id: 'palate', letters: ['cha', 'chha', 'ja', 'jha', 'nya'], name: { ne: 'तालव्य — तालुबाट', en: 'Palate (palatal)' },
    how: { ne: 'जिब्रो तालुतिर उठ्छ।', en: 'The tongue rises towards the roof of the mouth.' } },
  { id: 'roof', letters: ['tta', 'ttha', 'dda', 'ddha', 'nna'], name: { ne: 'मूर्धन्य — जिब्रो फर्काएर', en: 'Tongue turned up (retroflex)' },
    how: { ne: 'जिब्रोको टुप्पो अलिकति पछाडि फर्काएर माथि छुन्छ।', en: 'The tip of the tongue turns back a little and touches the roof.' } },
  { id: 'teeth', letters: ['ta', 'tha', 'da', 'dha', 'na'], name: { ne: 'दन्त्य — दाँतबाट', en: 'Teeth (dental)' },
    how: { ne: 'जिब्रोको टुप्पो माथिल्लो दाँतमा छुन्छ।', en: 'The tip of the tongue touches the top teeth.' } },
  { id: 'lips', letters: ['pa', 'pha', 'ba', 'bha', 'ma'], name: { ne: 'ओष्ठ्य — ओठबाट', en: 'Lips (labial)' },
    how: { ne: 'दुवै ओठ जोडिन्छन्।', en: 'Both lips press together.' } },
];

/** Column features of the वर्ग table: [air puff, throat buzz, nose]. */
export const COLUMN_FEATURES: { air: boolean; buzz: boolean; nose: boolean; name: T }[] = [
  { air: false, buzz: false, nose: false, name: { ne: 'अल्पप्राण', en: 'little air' } },
  { air: true, buzz: false, nose: false, name: { ne: 'महाप्राण', en: 'big puff of air' } },
  { air: false, buzz: true, nose: false, name: { ne: 'घोष', en: 'throat buzzes' } },
  { air: true, buzz: true, nose: false, name: { ne: 'घोष महाप्राण', en: 'buzz + puff' } },
  { air: false, buzz: true, nose: true, name: { ne: 'नासिक्य', en: 'through the nose' } },
];

export interface SoundInfo { place?: Place; air: boolean; buzz: boolean; nose: boolean }

/** Phonetic features of a Nepali letter (consonants in the five वर्ग; others get partial info). */
export function soundInfo(letterId: string): SoundInfo | null {
  for (const v of VARGAS) {
    const i = v.letters.indexOf(letterId);
    if (i >= 0) { const f = COLUMN_FEATURES[i]; return { place: v.id, air: f.air, buzz: f.buzz, nose: f.nose }; }
  }
  const other: Record<string, SoundInfo> = {
    ya: { place: 'palate', air: false, buzz: true, nose: false },
    ra: { place: 'teeth', air: false, buzz: true, nose: false },
    la: { place: 'teeth', air: false, buzz: true, nose: false },
    wa: { place: 'lips', air: false, buzz: true, nose: false },
    sha: { place: 'teeth', air: false, buzz: false, nose: false },
    ssa: { place: 'teeth', air: false, buzz: false, nose: false },
    sa: { place: 'teeth', air: false, buzz: false, nose: false },
    ha: { place: 'throat', air: true, buzz: true, nose: false },
  };
  return other[letterId] ?? null;
}

export const PLACE_LABEL: Record<Place, T> = {
  throat: { ne: 'घाँटी', en: 'throat' }, palate: { ne: 'तालु', en: 'palate' }, roof: { ne: 'जिब्रो फर्काएर', en: 'tongue up' },
  teeth: { ne: 'दाँत', en: 'teeth' }, lips: { ne: 'ओठ', en: 'lips' },
};

/** How the letters outside the five वर्ग rows are made. Their row's description ("the tongue tip
 *  touches the top teeth") is right for त but wrong for स, र or ल, so each gets its own. */
export const EXTRA_HOW: Record<string, T> = {
  ya: { ne: 'जिब्रो तालुतिर उठ्छ, तर छुँदैन।', en: 'The tongue rises towards the palate but does not touch it.' },
  ra: { ne: 'जिब्रोको टुप्पोले दाँतको ठीक पछाडि छिटो एक पटक छुन्छ।', en: 'The tongue tip taps once, quickly, just behind the top teeth.' },
  la: { ne: 'जिब्रोको टुप्पो दाँतको पछाडि छुन्छ; हावा जिब्रोको छेउबाट निस्कन्छ।', en: 'The tongue tip touches behind the teeth; air flows out at the sides.' },
  wa: { ne: 'दुवै ओठ गोलो हुन्छन्।', en: 'Both lips make a round shape.' },
  sha: { ne: 'जिब्रो दाँतको नजिक जान्छ तर छुँदैन — सर्पजस्तै "स्स्स्"।', en: 'The tongue comes close to the teeth without touching: a snake\'s "sss".' },
  ssa: { ne: 'जिब्रो दाँतको नजिक जान्छ तर छुँदैन — सर्पजस्तै "स्स्स्"।', en: 'The tongue comes close to the teeth without touching: a snake\'s "sss".' },
  sa: { ne: 'जिब्रो दाँतको नजिक जान्छ तर छुँदैन — सर्पजस्तै "स्स्स्"।', en: 'The tongue comes close to the teeth without touching: a snake\'s "sss".' },
  ha: { ne: 'मुख खुला रहन्छ; हावा घाँटीबाटै निस्कन्छ।', en: 'The mouth stays open; the air comes straight from the throat.' },
};

/** Where school books (the Sanskrit उच्चारण-स्थान) place a letter, when that differs from how it
 *  is said today. The mouth map shows the spoken place and adds this line, so a teacher and a
 *  child abroad are both told the truth. */
export const TEXTBOOK_PLACE: Record<string, T> = {
  sha: { ne: 'पाठ्यपुस्तकमा: तालव्य (तालुबाट)। बोल्दा प्रायः "स" जस्तै।', en: 'School books: palatal. When we speak, usually like "sa".' },
  ssa: { ne: 'पाठ्यपुस्तकमा: मूर्धन्य (जिब्रो फर्काएर)। बोल्दा प्रायः "स" जस्तै।', en: 'School books: retroflex. When we speak, usually like "sa".' },
  ra: { ne: 'पाठ्यपुस्तकमा: मूर्धन्य। बोल्दा जिब्रोको टुप्पोले दाँतको ठीक पछाडि छुन्छ।', en: 'School books: retroflex. When we speak, the tongue tip taps just behind the teeth.' },
  wa: { ne: 'पाठ्यपुस्तकमा: दन्तोष्ठ्य (दाँत र ओठ)। बोल्दा प्रायः गोलो ओठले "व" वा "ब"।', en: 'School books: teeth + lip. When we speak, usually round lips ("wa") or "ba".' },
};

/** Letters that are spelled differently but SOUND the same in Nepali (shown honestly in the app). */
export const SAME_SOUND_NOTES: { letters: string; note: T }[] = [
  { letters: 'श ष स', note: { ne: 'यी तीनै प्रायः "स" नै सुनिन्छन् — फरक लेख्दा मात्र।', en: 'All three usually sound like "sa" — they differ only in spelling.' } },
  { letters: 'ि ी · ु ू', note: { ne: 'ह्रस्व र दीर्घ उस्तै सुनिन्छन् — फरक लेख्दा मात्र।', en: 'Short and long i/u sound the same — the difference is only in spelling.' } },
];

// ── English: letter sounds ──

export interface EnLetter {
  id: string; upper: string; lower: string;
  /** TTS approximation of the SOUND (recordings `en-s-<id>` replace it) */
  soundSay: string;
  /** IPA, for parents */
  ipa: string;
  word: string; pic: string;
  /** where the sound is in the word (x is heard at the end of "fox") */
  pos?: 'end';
  group: 1 | 2 | 3 | 4 | 5;
  action: T;
  /** the Nepali letter that makes the same (or a close) sound */
  friend?: string;
  friendHow?: 'same' | 'close';
}

const L = (id: string, soundSay: string, ipa: string, word: string, pic: string, group: EnLetter['group'], action: T, friend?: string, friendHow?: 'same' | 'close', pos?: 'end'): EnLetter =>
  ({ id, upper: id.toUpperCase(), lower: id, soundSay, ipa, word, pic, group, action, friend, friendHow, pos });

export const EN_LETTERS: EnLetter[] = [
  // group 1 — s a t p i n: enough to read "sat, tap, pin, nap" straight away
  L('s', 'sss', '/s/', 'sun', '🌞', 1, { ne: 'सर्पजस्तै: स्स्स्', en: 'Like a snake: sss' }, 'sa', 'same'),
  L('a', 'ah', '/æ/', 'apple', '🍎', 1, { ne: 'स्याउ टोक्न मुख खोल: अ्या', en: 'Open wide to bite an apple: a' }),
  L('t', 'tuh', '/t/', 'tiger', '🐅', 1, { ne: 'घडी बज्छ: ट् ट् ट्', en: 'The clock ticks: t t t' }, 'tta', 'close'),
  L('p', 'puh', '/p/', 'pig', '🐷', 1, { ne: 'बुलबुला फुटाऊ: प् प् प्', en: 'Pop the bubbles: p p p' }, 'pa', 'same'),
  L('i', 'ih', '/ɪ/', 'insect', '🐞', 1, { ne: 'कीराले चिलायो: इ इ इ', en: 'An insect tickles: i i i' }, 'i', 'close'),
  L('n', 'nnn', '/n/', 'nest', '🪺', 1, { ne: 'टाउको हल्लाऊ: न्न्न्', en: 'Shake your head: nnn' }, 'na', 'same'),
  // group 2
  L('m', 'mmm', '/m/', 'moon', '🌙', 2, { ne: 'मीठो खाना: म्म्म्', en: 'Yummy food: mmm' }, 'ma', 'same'),
  L('d', 'duh', '/d/', 'dog', '🐶', 2, { ne: 'डाइनोसर हिँड्छ: ड् ड् ड्', en: 'A dinosaur stomps: d d d' }, 'dda', 'close'),
  L('g', 'guh', '/ɡ/', 'goat', '🐐', 2, { ne: 'पानी घुटुक्क: ग् ग् ग्', en: 'Gulp some water: g g g' }, 'ga', 'same'),
  L('o', 'aw', '/ɒ/', 'octopus', '🐙', 2, { ne: 'अचम्म! ओ', en: 'Oh, a surprise! o' }, 'o', 'close'),
  L('c', 'kuh', '/k/', 'cat', '🐱', 2, { ne: 'क्यामेरा क्लिक: क् क्', en: 'Click the camera: c c' }, 'ka', 'same'),
  L('k', 'kuh', '/k/', 'kite', '🪁', 2, { ne: 'चङ्गा उडाऊ: क् क्', en: 'Fly a kite: k k' }, 'ka', 'same'),
  // group 3
  L('e', 'eh', '/e/', 'egg', '🥚', 3, { ne: 'अण्डा फुट्यो: ए', en: 'The egg cracks: e' }, 'e', 'same'),
  L('u', 'uh', '/ʌ/', 'umbrella', '☂️', 3, { ne: 'छाता माथि: अ', en: 'Umbrella up: u' }, 'a', 'close'),
  L('r', 'rrr', '/r/', 'rabbit', '🐇', 3, { ne: 'कुकुर घुर्छ: र्र्र्', en: 'A puppy growls: rrr' }, 'ra', 'close'),
  L('h', 'huh', '/h/', 'hat', '🎩', 3, { ne: 'दौडेर स्वाँ स्वाँ: ह् ह्', en: 'Out of breath: h h' }, 'ha', 'same'),
  L('b', 'buh', '/b/', 'ball', '⚽', 3, { ne: 'बल उफ्रिन्छ: ब् ब्', en: 'Bounce the ball: b b' }, 'ba', 'same'),
  L('f', 'fff', '/f/', 'fish', '🐟', 3, { ne: 'पङ्खाको हावा: fff', en: 'Air from a fan: fff' }, 'pha', 'close'),
  // group 4
  L('l', 'lll', '/l/', 'lion', '🦁', 4, { ne: 'ललिपप चाट: ल्ल्ल्', en: 'Lick a lollipop: lll' }, 'la', 'same'),
  L('j', 'juh', '/dʒ/', 'juice', '🧃', 4, { ne: 'उफ्र उफ्र: ज् ज्', en: 'Jump, jump: j j' }, 'ja', 'close'),
  L('v', 'vvv', '/v/', 'van', '🚐', 4, { ne: 'गाडीको इन्जिन: vvv', en: "A van's engine: vvv" }, 'wa', 'close'),
  L('w', 'wuh', '/w/', 'whale', '🐳', 4, { ne: 'हावा चल्यो: व', en: 'The wind blows: w' }, 'wa', 'close'),
  L('y', 'yuh', '/j/', 'yo-yo', '🪀', 4, { ne: 'योयो माथि तल: य', en: 'Yo-yo up and down: y' }, 'ya', 'same'),
  // group 5
  L('x', 'ks', '/ks/', 'fox', '🦊', 5, { ne: 'फ्याउरोको अन्त्यमा: क्स', en: 'At the end of fox: ks' }, undefined, undefined, 'end'),
  L('z', 'zzz', '/z/', 'zebra', '🦓', 5, { ne: 'मौरी भुनभुनायो: zzz', en: 'A bee buzzes: zzz' }),
  L('q', 'kwuh', '/kw/', 'queen', '👸', 5, { ne: 'रानी भन्छिन्: क्व', en: 'The queen says: kw' }),
];

export const EN_BY_ID: Record<string, EnLetter> = Object.fromEntries(EN_LETTERS.map((l) => [l.id, l]));
export const EN_GROUPS = [1, 2, 3, 4, 5] as const;

/** English sounds Nepali doesn't have, and Nepali sounds English doesn't have (for the friends screen). */
export const ONLY_IN: { lang: 'en' | 'ne'; sounds: string; note: T }[] = [
  { lang: 'en', sounds: 'f · v · z · th', note: { ne: 'यी आवाजका लागि नेपाली अक्षर छैन — ओठ, दाँत र जिब्रो मिलाएर बनाउँछौं।', en: 'No Nepali letter makes these sounds — we shape them with lips, teeth and tongue.' } },
  { lang: 'ne', sounds: 'घ झ ढ ध भ', note: { ne: 'आवाज + हावा: अङ्ग्रेजीमा यस्ता आवाज छैनन्।', en: 'Buzz + a puff of air: English has no sounds like these.' } },
  { lang: 'ne', sounds: 'त / ट', note: { ne: 'नेपालीमा दुईवटा "t" छन्: दाँतको त र फर्काएको ट।', en: 'Nepali has two "t" sounds: त at the teeth, ट with the tongue turned up.' } },
];

// ── Blending ──

export interface BlendWord { id: string; lang: 'ne' | 'en'; word: string; pic: string; en: string; phonemes: string[]; chunks: string[] }

/** English CVC words. `chunks` = onset + rime (easier, ages 3–4); `phonemes` = every sound (ages 5–6). */
const EB = (word: string, pic: string, rimeAt = 1): BlendWord =>
  ({ id: `en-${word}`, lang: 'en', word, pic, en: word, phonemes: word.split(''), chunks: [word.slice(0, rimeAt), word.slice(rimeAt)] });

export const BLEND_WORDS: BlendWord[] = [
  EB('sun', '🌞'), EB('cat', '🐱'), EB('dog', '🐶'), EB('pig', '🐷'), EB('hat', '🎩'), EB('bed', '🛏️'),
  EB('bus', '🚌'), EB('map', '🗺️'), EB('pen', '🖊️'), EB('box', '📦'), EB('fox', '🦊'), EB('web', '🕸️'),
  // Nepali blends by अक्षर (syllable): the script is built that way. Note the final अ is dropped
  // when the word is said: क-म-ल → "kamal" (not "kamala").
  { id: 'ne-kamal', lang: 'ne', word: 'कमल', pic: '🪷', en: 'lotus', phonemes: ['क', 'म', 'ल'], chunks: ['क', 'मल'] },
  { id: 'ne-ghar', lang: 'ne', word: 'घर', pic: '🏠', en: 'house', phonemes: ['घ', 'र'], chunks: ['घ', 'र'] },
  { id: 'ne-phal', lang: 'ne', word: 'फल', pic: '🍎', en: 'fruit', phonemes: ['फ', 'ल'], chunks: ['फ', 'ल'] },
  { id: 'ne-nal', lang: 'ne', word: 'नल', pic: '🚰', en: 'tap', phonemes: ['न', 'ल'], chunks: ['न', 'ल'] },
  { id: 'ne-bas', lang: 'ne', word: 'बस', pic: '🚌', en: 'bus', phonemes: ['ब', 'स'], chunks: ['ब', 'स'] },
  { id: 'ne-kalam', lang: 'ne', word: 'कलम', pic: '🖊️', en: 'pen', phonemes: ['क', 'ल', 'म'], chunks: ['क', 'लम'] },
  { id: 'ne-matar', lang: 'ne', word: 'मटर', pic: '🫛', en: 'peas', phonemes: ['म', 'ट', 'र'], chunks: ['म', 'टर'] },
  { id: 'ne-aama', lang: 'ne', word: 'आमा', pic: '👩', en: 'mother', phonemes: ['आ', 'मा'], chunks: ['आ', 'मा'] },
  { id: 'ne-machha', lang: 'ne', word: 'माछा', pic: '🐟', en: 'fish', phonemes: ['मा', 'छा'], chunks: ['मा', 'छा'] },
  { id: 'ne-kera', lang: 'ne', word: 'केरा', pic: '🍌', en: 'banana', phonemes: ['के', 'रा'], chunks: ['के', 'रा'] },
];

// ── Minimal pairs: two words that differ in ONE sound ("कान खोलेर सुन") ──

export interface PairWord { word: string; pic: string; en: string }
export interface MinimalPair { id: string; lang: 'ne' | 'en'; a: PairWord; b: PairWord; feature: T }

const P = (id: string, lang: 'ne' | 'en', a: PairWord, b: PairWord, feature: T): MinimalPair => ({ id, lang, a, b, feature });
const w = (word: string, pic: string, en: string): PairWord => ({ word, pic, en });

export const MINIMAL_PAIRS: MinimalPair[] = [
  // Nepali — breath (अल्पप्राण/महाप्राण) and tongue (दन्त्य/मूर्धन्य): contrasts English doesn't have
  P('bat-bhat', 'ne', w('बात', '💬', 'talk'), w('भात', '🍚', 'rice'), { ne: 'भ मा धेरै हावा आउँछ 🕯️', en: 'भ has a big puff of air 🕯️' }),
  P('pul-phul', 'ne', w('पुल', '🌉', 'bridge'), w('फूल', '🌸', 'flower'), { ne: 'फ मा धेरै हावा आउँछ 🕯️', en: 'फ has a big puff of air 🕯️' }),
  P('kam-kham', 'ne', w('काम', '👷', 'work'), w('खाम', '✉️', 'envelope'), { ne: 'ख मा धेरै हावा आउँछ 🕯️', en: 'ख has a big puff of air 🕯️' }),
  P('dal-ddal', 'ne', w('दाल', '🍲', 'lentils'), w('डाल', '🌿', 'branch'), { ne: 'द दाँतमा, ड जिब्रो फर्काएर 👅', en: 'द at the teeth, ड with the tongue turned up 👅' }),
  P('tin-ttin', 'ne', w('तीन', 'txt:३', 'three'), w('टिन', '🥫', 'tin can'), { ne: 'त दाँतमा, ट जिब्रो फर्काएर 👅', en: 'त at the teeth, ट with the tongue turned up 👅' }),
  // English — sounds that are tricky for Nepali speakers (and for all young children)
  P('fan-van', 'en', w('fan', '🪭', 'fan'), w('van', '🚐', 'van'), { ne: 'f मा हावा मात्र, v मा आवाज पनि 🐝', en: 'f is just air; v buzzes 🐝' }),
  P('three-tree', 'en', w('three', 'txt:3', 'three'), w('tree', '🌳', 'tree'), { ne: 'th मा जिब्रो दाँतबीच 👅', en: 'For th, the tongue goes between the teeth 👅' }),
  P('sheep-ship', 'en', w('sheep', '🐑', 'sheep'), w('ship', '🚢', 'ship'), { ne: 'ee लामो, i छोटो', en: 'ee is long, i is short' }),
  P('bear-pear', 'en', w('bear', '🐻', 'bear'), w('pear', '🍐', 'pear'), { ne: 'b मा आवाज, p मा हावा', en: 'b buzzes, p puffs' }),
  P('pen-pan', 'en', w('pen', '🖊️', 'pen'), w('pan', '🍳', 'pan'), { ne: 'e मा मुख अलिकति खुल्छ, a मा धेरै खुल्छ 😮', en: 'For e the mouth opens a little; for a it opens wide 😮' }),
  P('cap-cup', 'en', w('cap', '🧢', 'cap'), w('cup', '☕', 'cup'), { ne: 'a मुख ठूलो खोलेर, u छोटो "अ"', en: 'a opens wide; u is a short "uh"' }),
];
