// नेपाली वर्णमाला — 13 vowels (स्वर) + 36 consonants (व्यञ्जन, incl. क्ष त्र ज्ञ) = 49 letters.
//
// `pic` is either an emoji (rendered from bundled Twemoji SVGs so it looks the same on every
// device, including old Android phones whose system fonts lack newer emoji) or a special
// key handled by <Pic>:  'flag' | 'hex' | 'danfe' | 'habre' | 'txt:<glyph>' | 'swatch:<css colour>'.
//
// `hl` is the part of the example word that contains the letter; it is drawn in crimson.
// Words were chosen to (1) start with the letter where Nepali allows it, (2) be known to a
// 4–8 year old, and (3) be picturable. Letters that never start a word (ङ ञ ण अः) use a word
// that CONTAINS the letter — this is how Nepali primary charts handle them too.
// Every word is flagged for review by a Nepali primary teacher before release (see docs).

export type LetterKind = 'vowel' | 'consonant' | 'conjunct';

export interface Letter {
  id: string;
  char: string;
  roman: string;
  kind: LetterKind;
  word: string;
  hl: string;
  wordRoman: string;
  meaning: string;
  pic: string;
  /** what the speech engine should say for the letter on its own, if different from `char` */
  say?: string;
}

const V = (id: string, char: string, roman: string, word: string, hl: string, wordRoman: string, meaning: string, pic: string, say?: string): Letter =>
  ({ id, char, roman, kind: 'vowel', word, hl, wordRoman, meaning, pic, say });
const C = (id: string, char: string, roman: string, word: string, hl: string, wordRoman: string, meaning: string, pic: string, say?: string): Letter =>
  ({ id, char, roman, kind: 'consonant', word, hl, wordRoman, meaning, pic, say });
const J = (id: string, char: string, roman: string, word: string, hl: string, wordRoman: string, meaning: string, pic: string): Letter =>
  ({ id, char, roman, kind: 'conjunct', word, hl, wordRoman, meaning, pic });

export const LETTERS: Letter[] = [
  // ── स्वर वर्ण (vowels) ──
  V('a', 'अ', 'a', 'अण्डा', 'अ', 'anda', 'egg', '🥚'),
  V('aa', 'आ', 'aa', 'आँप', 'आँ', 'aanp', 'mango', '🥭'),
  V('i', 'इ', 'i', 'इँटा', 'इँ', 'inta', 'brick', '🧱'),
  V('ii', 'ई', 'ii', 'ईगल', 'ई', 'igal', 'eagle', '🦅'),
  V('u', 'उ', 'u', 'उल्लु', 'उ', 'ullu', 'owl', '🦉'),
  V('uu', 'ऊ', 'uu', 'ऊन', 'ऊ', 'un', 'wool', '🧶'),
  V('ri', 'ऋ', 'ri', 'ऋषि', 'ऋ', 'rishi', 'sage', '🧘', 'रि'),
  V('e', 'ए', 'e', 'एक', 'ए', 'ek', 'one', 'txt:१'),
  V('ai', 'ऐ', 'ai', 'ऐना', 'ऐ', 'aina', 'mirror', '🪞'),
  V('o', 'ओ', 'o', 'ओठ', 'ओ', 'oth', 'lips', '👄'),
  V('au', 'औ', 'au', 'औषधि', 'औ', 'aushadhi', 'medicine', '💊'),
  V('am', 'अं', 'am', 'अंगुर', 'अं', 'angur', 'grapes', '🍇'),
  V('ah', 'अः', 'ah', 'प्रातः', 'तः', 'praatah', 'morning', '🌅'),

  // ── व्यञ्जन वर्ण (consonants) ──
  C('ka', 'क', 'ka', 'कमल', 'क', 'kamal', 'lotus', '🪷'),
  C('kha', 'ख', 'kha', 'खरायो', 'ख', 'kharayo', 'rabbit', '🐇'),
  C('ga', 'ग', 'ga', 'गमला', 'ग', 'gamala', 'flower pot', '🪴'),
  C('gha', 'घ', 'gha', 'घर', 'घ', 'ghar', 'house', '🏠'),
  C('nga', 'ङ', 'nga', 'रङ', 'ङ', 'rang', 'colour', '🎨'),
  C('cha', 'च', 'cha', 'चरा', 'च', 'chara', 'bird', '🐦'),
  C('chha', 'छ', 'chha', 'छाता', 'छा', 'chhata', 'umbrella', '☂️'),
  C('ja', 'ज', 'ja', 'जहाज', 'ज', 'jahaj', 'aeroplane', '✈️'),
  C('jha', 'झ', 'jha', 'झण्डा', 'झ', 'jhanda', 'flag', 'flag'),
  C('nya', 'ञ', 'nya', 'पञ्जा', 'ञ्', 'panja', 'glove', '🧤'),
  C('tta', 'ट', 'Ta', 'टमाटर', 'ट', 'tamatar', 'tomato', '🍅'),
  C('ttha', 'ठ', 'Tha', 'ठेला', 'ठे', 'thela', 'cart', '🛒'),
  C('dda', 'ड', 'Da', 'डोको', 'डो', 'doko', 'basket', '🧺'),
  C('ddha', 'ढ', 'Dha', 'ढोल', 'ढो', 'dhol', 'drum', '🥁'),
  C('nna', 'ण', 'Na', 'बाण', 'ण', 'baan', 'arrow', '🏹'),
  C('ta', 'त', 'ta', 'तराजु', 'त', 'taraju', 'scales', '⚖️'),
  C('tha', 'थ', 'tha', 'थाल', 'था', 'thaal', 'plate', '🍽️'),
  C('da', 'द', 'da', 'दमकल', 'द', 'damakal', 'fire engine', '🚒'),
  C('dha', 'ध', 'dha', 'धान', 'धा', 'dhaan', 'rice plant', '🌾'),
  C('na', 'न', 'na', 'नरिवल', 'न', 'nariwal', 'coconut', '🥥'),
  C('pa', 'प', 'pa', 'परेवा', 'प', 'parewa', 'pigeon', '🕊️'),
  C('pha', 'फ', 'pha', 'फूल', 'फू', 'phool', 'flower', '🌺'),
  C('ba', 'ब', 'ba', 'बाख्रा', 'बा', 'baakhra', 'goat', '🐐'),
  C('bha', 'भ', 'bha', 'भालु', 'भा', 'bhalu', 'bear', '🐻'),
  C('ma', 'म', 'ma', 'माछा', 'मा', 'maachha', 'fish', '🐟'),
  C('ya', 'य', 'ya', 'याक', 'या', 'yak', 'yak', '🦬'),
  C('ra', 'र', 'ra', 'रुख', 'रु', 'rukh', 'tree', '🌳'),
  C('la', 'ल', 'la', 'लसुन', 'ल', 'lasun', 'garlic', '🧄'),
  C('wa', 'व', 'wa', 'वर्षा', 'व', 'barsha', 'rain', '🌧️'),
  C('sha', 'श', 'sha', 'शङ्ख', 'श', 'shankha', 'conch shell', '🐚'),
  C('ssa', 'ष', 'Sha', 'षट्कोण', 'ष', 'shatkon', 'hexagon', 'hex'),
  C('sa', 'स', 'sa', 'सुन्तला', 'सु', 'suntala', 'orange', '🍊'),
  C('ha', 'ह', 'ha', 'हात्ती', 'हा', 'hatti', 'elephant', '🐘'),
  J('ksha', 'क्ष', 'ksha', 'क्षितिज', 'क्षि', 'kshitij', 'horizon', '🌄'),
  J('tra', 'त्र', 'tra', 'त्रिशूल', 'त्रि', 'trishul', 'trident', '🔱'),
  J('gya', 'ज्ञ', 'gya', 'ज्ञान', 'ज्ञा', 'gyan', 'knowledge', '📚'),
];

export const LETTER_BY_ID: Record<string, Letter> = Object.fromEntries(LETTERS.map((l) => [l.id, l]));

/**
 * Letters children commonly confuse. Games prefer these as distractors once a child has
 * seen both, which is where real learning happens (easy distractors teach little).
 */
export const CONFUSABLE: Record<string, string[]> = {
  a: ['aa'], aa: ['a'], i: ['ii', 'dda'], ii: ['i'], u: ['uu', 'dda'], uu: ['u'],
  e: ['ai'], ai: ['e'], o: ['au', 'aa'], au: ['o'], am: ['a', 'ah'], ah: ['am'],
  kha: ['ra', 'wa'], gha: ['dha', 'ma'], dha: ['gha'], nga: ['dda', 'i'], dda: ['nga', 'i'],
  ba: ['wa', 'ka'], wa: ['ba'], bha: ['ma', 'jha'], ma: ['bha', 'ya'], pa: ['ssa', 'ya'],
  ssa: ['pa'], ya: ['tha', 'pa'], tha: ['ya'], da: ['ddha', 'dda'], ddha: ['da'],
  ja: ['nya', 'jha'], nya: ['ja'], jha: ['bha', 'ja'], tta: ['ttha'], ttha: ['tta', 'ddha'],
  sa: ['ma', 'ra'], ra: ['sa'], ksha: ['ka'], ka: ['ksha'], tra: ['ta'], ta: ['tra'],
  gya: ['ja'], na: ['ta', 'la'], la: ['na'], sha: ['ra'], cha: ['wa'],
};

/** Text spoken when a letter is introduced: "क — कमलको क" (the classic chart chant). */
export function letterChant(l: Letter): string {
  const say = l.say ?? l.char;
  return `${say}, ${l.word}को ${say}`;
}
