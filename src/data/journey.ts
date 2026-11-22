// The Journey: a climb from the Terai plains, through the hills, to Sagarmatha.
// 11 units × 3–5 letters. Each unit = learn each letter → one mini-game → a sticker of a
// real Nepali place/animal/festival with a one-line fact. Geography is the reward loop for
// literacy, so the two learning goals reinforce each other instead of competing for time.

import type { T } from './i18n';

export type Region = 'terai' | 'pahad' | 'himal';
export type GameType = 'listen' | 'picture' | 'balloon' | 'memory';

export interface Sticker { id: string; pic: string; name: T; fact: T }
export interface Unit { id: string; region: Region; letters: string[]; game: GameType; sticker: string }

export const REGIONS: Record<Region, { name: T; blurb: T; colors: [string, string] }> = {
  terai: {
    name: { ne: 'तराई', en: 'Terai' },
    blurb: { ne: 'दक्षिणको समथर र हरियो भूभाग', en: 'The flat, green plains of the south' },
    colors: ['#8fd16a', '#d8f2b8'],
  },
  pahad: {
    name: { ne: 'पहाड', en: 'Hills' },
    blurb: { ne: 'बीचका पहाड, खोला र उपत्यका', en: 'Hills, rivers and valleys in the middle' },
    colors: ['#5fae7a', '#c6e8cf'],
  },
  himal: {
    name: { ne: 'हिमाल', en: 'Himalaya' },
    blurb: { ne: 'उत्तरका हिउँले ढाकिएका हिमाल', en: 'Snowy mountains in the north' },
    colors: ['#9cc3e6', '#f3f8ff'],
  },
};

export const STICKERS: Sticker[] = [
  { id: 'lumbini', pic: '☸️', name: { ne: 'लुम्बिनी', en: 'Lumbini' },
    fact: { ne: 'गौतम बुद्ध लुम्बिनीमा जन्मनुभएको हो।', en: 'Gautama Buddha was born in Lumbini.' } },
  { id: 'chitwan', pic: '🦏', name: { ne: 'चितवन', en: 'Chitwan' },
    fact: { ne: 'चितवनको जङ्गलमा एकसिङ्गे गैंडा बस्छ।', en: 'One-horned rhinos live in the forests of Chitwan.' } },
  { id: 'janakpur', pic: '🛕', name: { ne: 'जनकपुर', en: 'Janakpur' },
    fact: { ne: 'जनकपुरमा सुन्दर जानकी मन्दिर छ।', en: 'Janakpur is home to the beautiful Janaki Mandir.' } },
  { id: 'swayambhu', pic: '🐒', name: { ne: 'स्वयम्भू', en: 'Swayambhu' },
    fact: { ne: 'स्वयम्भूमा धेरै बाँदर हुन्छन्, त्यसैले यसलाई बाँदर मन्दिर पनि भनिन्छ।', en: 'So many monkeys live at Swayambhu that it is called the Monkey Temple.' } },
  { id: 'pokhara', pic: '🛶', name: { ne: 'पोखरा', en: 'Pokhara' },
    fact: { ne: 'पोखराको फेवातालमा रङ्गीचङ्गी डुङ्गा चल्छन्।', en: 'Colourful boats sail on Phewa Lake in Pokhara.' } },
  { id: 'bhaktapur', pic: '🏯', name: { ne: 'भक्तपुर', en: 'Bhaktapur' },
    fact: { ne: 'भक्तपुरमा पाँच तले न्यातपोल मन्दिर छ।', en: 'Bhaktapur has the five-storey Nyatapola temple.' } },
  { id: 'tihar', pic: '🪔', name: { ne: 'तिहार', en: 'Tihar' },
    fact: { ne: 'तिहारमा दियो बालिन्छ र कुकुरलाई पनि माला लगाइन्छ।', en: 'At Tihar we light lamps — and even dogs get flower garlands!' } },
  { id: 'rara', pic: '🏞️', name: { ne: 'राराताल', en: 'Rara Lake' },
    fact: { ne: 'राराताल नेपालकै सबैभन्दा ठूलो ताल हो।', en: 'Rara is the biggest lake in Nepal.' } },
  { id: 'snowleopard', pic: '🐆', name: { ne: 'हिउँ चितुवा', en: 'Snow leopard' },
    fact: { ne: 'हिउँ चितुवा अग्ला हिमालमा लुकेर बस्छ।', en: 'Snow leopards hide high up in the snowy mountains.' } },
  { id: 'annapurna', pic: '⛰️', name: { ne: 'अन्नपूर्णा', en: 'Annapurna' },
    fact: { ne: 'अन्नपूर्णा संसारको दशौं अग्लो हिमाल हो।', en: 'Annapurna is the tenth-highest mountain in the world.' } },
  { id: 'sagarmatha', pic: '🏔️', name: { ne: 'सगरमाथा', en: 'Sagarmatha (Everest)' },
    fact: { ne: 'सगरमाथा संसारकै सबैभन्दा अग्लो हिमाल हो — ८,८४८.८६ मिटर!', en: 'Sagarmatha is the highest mountain on Earth — 8,848.86 metres!' } },
  // Earned in "My Nepal"
  { id: 'mapper', pic: '🗺️', name: { ne: 'नक्सा जान्ने', en: 'Map explorer' },
    fact: { ne: 'नेपालमा ७ प्रदेश र ७७ जिल्ला छन्।', en: 'Nepal has 7 provinces and 77 districts.' } },
  { id: 'symbols', pic: 'flag', name: { ne: 'हाम्रो चिनारी', en: 'Our symbols' },
    fact: { ne: 'नेपालको झण्डा संसारकै अनौठो झण्डा हो।', en: "Nepal's flag is the only national flag that isn't a rectangle." } },
  { id: 'festivals', pic: '🪁', name: { ne: 'चाडपर्व', en: 'Festivals' },
    fact: { ne: 'दशैंमा आकाशभरि चङ्गा उड्छन्।', en: 'At Dashain the sky fills with kites.' } },
  { id: 'nature', pic: 'danfe', name: { ne: 'प्रकृति', en: 'Nature' },
    fact: { ne: 'डाँफे नेपालको राष्ट्रिय चरा हो।', en: 'The Danfe (Himalayan monal) is our national bird.' } },
  { id: 'barakhari', pic: '✍️', name: { ne: 'बाह्रखरी', en: 'Syllable builder' },
    fact: { ne: 'क + ा = का! मात्राले अक्षरलाई नयाँ आवाज दिन्छ।', en: 'क + ा = का! Vowel signs give letters new sounds.' } },
  { id: 'quiz', pic: '🏆', name: { ne: 'प्रश्न विजेता', en: 'Quiz champion' },
    fact: { ne: 'तिमीलाई नेपालबारे धेरै थाहा छ!', en: 'You know so much about Nepal!' } },
];

export const STICKER_BY_ID: Record<string, Sticker> = Object.fromEntries(STICKERS.map((s) => [s.id, s]));

export const UNITS: Unit[] = [
  { id: 'u1', region: 'terai', letters: ['a', 'aa', 'i', 'ii'], game: 'listen', sticker: 'lumbini' },
  { id: 'u2', region: 'terai', letters: ['u', 'uu', 'ri', 'e'], game: 'picture', sticker: 'chitwan' },
  { id: 'u3', region: 'terai', letters: ['ai', 'o', 'au', 'am', 'ah'], game: 'balloon', sticker: 'janakpur' },
  { id: 'u4', region: 'pahad', letters: ['ka', 'kha', 'ga', 'gha', 'nga'], game: 'memory', sticker: 'swayambhu' },
  { id: 'u5', region: 'pahad', letters: ['cha', 'chha', 'ja', 'jha', 'nya'], game: 'listen', sticker: 'pokhara' },
  { id: 'u6', region: 'pahad', letters: ['tta', 'ttha', 'dda', 'ddha', 'nna'], game: 'balloon', sticker: 'bhaktapur' },
  { id: 'u7', region: 'pahad', letters: ['ta', 'tha', 'da', 'dha', 'na'], game: 'picture', sticker: 'tihar' },
  { id: 'u8', region: 'himal', letters: ['pa', 'pha', 'ba', 'bha', 'ma'], game: 'memory', sticker: 'rara' },
  { id: 'u9', region: 'himal', letters: ['ya', 'ra', 'la', 'wa'], game: 'balloon', sticker: 'snowleopard' },
  { id: 'u10', region: 'himal', letters: ['sha', 'ssa', 'sa', 'ha'], game: 'listen', sticker: 'annapurna' },
  { id: 'u11', region: 'himal', letters: ['ksha', 'tra', 'gya'], game: 'picture', sticker: 'sagarmatha' },
];

export const GAME_META: Record<GameType, { pic: string; name: T; howto: T }> = {
  listen: { pic: '👂', name: { ne: 'सुन र छान', en: 'Listen & pick' },
    howto: { ne: 'सुन त, कुन अक्षर हो? छान।', en: 'Listen! Which letter is it?' } },
  picture: { pic: '🖼️', name: { ne: 'चित्र र अक्षर', en: 'Picture match' },
    howto: { ne: 'यो शब्द कुन अक्षरबाट सुरु हुन्छ?', en: 'Which letter is missing from the word?' } },
  balloon: { pic: '🎈', name: { ne: 'बेलुन फुटाऊ', en: 'Balloon pop' },
    howto: { ne: 'ठीक अक्षर भएको बेलुन फुटाऊ!', en: 'Pop the balloons with the right letter!' } },
  memory: { pic: '🃏', name: { ne: 'जोडी मिलाऊ', en: 'Memory pairs' },
    howto: { ne: 'अक्षर र चित्रको जोडी खोज।', en: 'Find each letter and its picture.' } },
};

export type NodeKind = 'letter' | 'game' | 'chest';
export interface JourneyNode { key: string; kind: NodeKind; unit: Unit; letterId?: string }

/** Flattened, ordered list of every stop on the journey path. */
export const JOURNEY: JourneyNode[] = UNITS.flatMap((u) => [
  ...u.letters.map((id): JourneyNode => ({ key: `L:${id}`, kind: 'letter', unit: u, letterId: id })),
  { key: `G:${u.id}`, kind: 'game', unit: u },
  { key: `S:${u.id}`, kind: 'chest', unit: u },
]);
