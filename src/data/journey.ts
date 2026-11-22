// The Journey: a climb from the Terai plains, through the hills, to Sagarmatha.
// 11 units × 3–5 letters. Each unit = learn each letter → one mini-game → a sticker of a
// real Nepali place/animal/festival with a one-line fact. Geography is the reward loop for
// literacy, so the two learning goals reinforce each other instead of competing for time.

import type { T } from './i18n';

export type Region = 'terai' | 'pahad' | 'himal';
export type GameType = 'listen' | 'picture' | 'balloon' | 'memory';

export type StickerGroup = 'journey' | 'letters' | 'words' | 'stories' | 'nepal' | 'play';
export interface Sticker { id: string; pic: string; name: T; fact: T; group?: StickerGroup }
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
  // शब्द — one per topic (earned in the listening game)
  { id: 'w-family', group: 'words', pic: '👨‍👩‍👧‍👦', name: { ne: 'परिवार', en: 'Family' },
    fact: { ne: 'हजुरआमा र हजुरबासँग नेपालीमा कुरा गर — उहाँहरू कति खुसी हुनुहुन्छ!', en: 'Talk to grandma and grandpa in Nepali — see how happy they are!' } },
  { id: 'w-greet', group: 'words', pic: '🙏', name: { ne: 'बोली-व्यवहार', en: 'Kind words' },
    fact: { ne: 'नमस्ते भन्दा दुई हात जोडिन्छ।', en: 'When we say namaste, we join our two hands.' } },
  { id: 'w-food', group: 'words', pic: '🍛', name: { ne: 'खाना', en: 'Food' },
    fact: { ne: 'दाल भात नेपालको सबैभन्दा मन पराइने खाना हो।', en: 'Daal bhaat is the most loved meal in Nepal.' } },
  { id: 'w-animals', group: 'words', pic: '🐸', name: { ne: 'जनावर', en: 'Animals' },
    fact: { ne: 'भ्यागुतो वर्षामा "टर्र टर्र" कराउँछ।', en: 'In the rainy season, frogs go "tarr tarr".' } },
  { id: 'w-colours', group: 'words', pic: '🎨', name: { ne: 'रङ', en: 'Colours' },
    fact: { ne: 'होलीमा सबै रङ एकैचोटि देखिन्छन्!', en: 'At Holi you can see every colour at once!' } },
  { id: 'w-body', group: 'words', pic: '✋', name: { ne: 'मेरो शरीर', en: 'My body' },
    fact: { ne: 'हातले नमस्ते गर्छौं, खुट्टाले नाच्छौं!', en: 'We say namaste with our hands and dance with our feet!' } },
  // कथा — one per story read to the end
  { id: 's-valley', group: 'stories', pic: '🪷', name: { ne: 'ताल र कमल', en: 'Lake and lotus' },
    fact: { ne: 'काठमाडौं उपत्यका पहिले ताल थियो भन्ने किंवदन्ती छ।', en: 'Legend says the Kathmandu Valley was once a lake.' } },
  { id: 's-buddha', group: 'stories', pic: '🦢', name: { ne: 'दयालु राजकुमार', en: 'The kind prince' },
    fact: { ne: 'सिद्धार्थले घाइते हाँसलाई बचाउनुभयो।', en: 'Siddhartha saved a hurt swan.' } },
  { id: 's-everest', group: 'stories', pic: '🧗', name: { ne: 'हिमाल चढ्ने साथी', en: 'Climbing friends' },
    fact: { ne: 'तेन्जिङ र हिलारी सन् १९५३ मा सगरमाथा चढ्नुभयो।', en: 'Tenzing and Hillary climbed Sagarmatha in 1953.' } },
  { id: 's-dashain', group: 'stories', pic: '🌱', name: { ne: 'जमरा', en: 'Jamara' },
    fact: { ne: 'दशैंमा जमरा र टीका लगाइन्छ।', en: 'At Dashain we wear jamara and tika.' } },
  { id: 's-tihar', group: 'stories', pic: '🐕', name: { ne: 'कुकुर तिहार', en: 'Kukur Tihar' },
    fact: { ne: 'तिहारमा कुकुरलाई फूलको माला लगाइन्छ।', en: 'At Tihar dogs wear flower garlands.' } },
  { id: 's-flag', group: 'stories', pic: '🌙', name: { ne: 'जून र घाम', en: 'Moon and sun' },
    fact: { ne: 'हाम्रो झण्डामा जून र घाम छन्।', en: 'Our flag has the moon and the sun.' } },
  // खेल
  { id: 'counting', group: 'play', pic: 'txt:१२३', name: { ne: 'गन्ती', en: 'Counting' },
    fact: { ne: 'एक, दुई, तीन … तिमी नेपालीमा गन्न सक्छौ!', en: 'One, two, three … you can count in Nepali!' } },
  { id: 'music', group: 'play', pic: '🥁', name: { ne: 'बाजा', en: 'Music' },
    fact: { ne: 'मादल नेपाली लोकगीतको मुटु हो।', en: 'The madal drum is the heartbeat of Nepali folk songs.' } },
  { id: 'colouring', group: 'play', pic: '🖍️', name: { ne: 'चित्रकार', en: 'Little artist' },
    fact: { ne: 'तिमीले नेपालका चित्रहरूमा रङ भर्यौ!', en: 'You coloured pictures of Nepal!' } },
];

const NEPAL_STICKERS = ['mapper', 'symbols', 'festivals', 'nature', 'quiz'];
/** Which sticker-book section a sticker belongs to. */
export function stickerGroup(s: Sticker): StickerGroup {
  if (s.group) return s.group;
  if (s.id === 'barakhari') return 'letters';
  return NEPAL_STICKERS.includes(s.id) ? 'nepal' : 'journey';
}
export const STICKER_GROUPS: { id: StickerGroup; title: T }[] = [
  { id: 'journey', title: { ne: 'यात्रा', en: 'Journey' } },
  { id: 'letters', title: { ne: 'अक्षर', en: 'Letters' } },
  { id: 'words', title: { ne: 'शब्द', en: 'Words' } },
  { id: 'stories', title: { ne: 'कथा', en: 'Stories' } },
  { id: 'nepal', title: { ne: 'मेरो नेपाल', en: 'My Nepal' } },
  { id: 'play', title: { ne: 'खेल', en: 'Play' } },
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
