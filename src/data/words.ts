// मेरा पहिला शब्द — first words. For children abroad especially, these are the words that let
// them talk with grandparents and family: आमा, हजुरबा, नमस्ते, दाल भात. Each word is spoken
// aloud; the listening game asks the child to find the picture for a word they hear.

import type { T } from './i18n';

export interface WordItem { id: string; ne: string; roman: string; en: string; pic: string }
export interface WordTopic { id: string; title: T; pic: string; color: string; words: WordItem[] }

const w = (id: string, ne: string, roman: string, en: string, pic: string): WordItem => ({ id, ne, roman, en, pic });

export const WORD_TOPICS: WordTopic[] = [
  {
    id: 'family', title: { ne: 'परिवार', en: 'Family' }, pic: '👨‍👩‍👧‍👦', color: '#e8505b',
    words: [
      w('aama', 'आमा', 'aamaa', 'mother', '👩'),
      w('buba', 'बुबा', 'bubaa', 'father', '👨'),
      w('hajuraama', 'हजुरआमा', 'hajuraamaa', 'grandmother', '👵'),
      w('hajurba', 'हजुरबा', 'hajurbaa', 'grandfather', '👴'),
      w('didi', 'दिदी', 'didi', 'older sister', '👧'),
      w('dai', 'दाइ', 'daai', 'older brother', '👦'),
      w('bachcha', 'बच्चा', 'bachchaa', 'baby', '👶'),
      w('pariwar', 'परिवार', 'pariwaar', 'family', '👨‍👩‍👧‍👦'),
    ],
  },
  {
    id: 'greet', title: { ne: 'बोली-व्यवहार', en: 'Kind words' }, pic: '🙏', color: '#8e5bd6',
    words: [
      w('namaste', 'नमस्ते', 'namaste', 'hello (with joined hands)', '🙏'),
      w('dhanyabad', 'धन्यवाद', 'dhanyabaad', 'thank you', '💐'),
      w('maaf', 'माफ गर्नुहोस्', 'maaph garnuhos', 'sorry / excuse me', '🙇'),
      w('ho', 'हो', 'ho', 'yes', '👍'),
      w('hoina', 'होइन', 'hoina', 'no', '🙅'),
      w('thik', 'म ठीक छु', 'ma thik chhu', "I'm fine", '😊'),
      w('maya', 'माया', 'maayaa', 'love', '❤️'),
      w('subharatri', 'शुभ रात्रि', 'shubha raatri', 'good night', '🌙'),
    ],
  },
  {
    id: 'food', title: { ne: 'खाना', en: 'Food' }, pic: '🍛', color: '#ff9f1c',
    words: [
      w('dalbhat', 'दाल भात', 'daal bhaat', 'lentils and rice', '🍛'),
      w('momo', 'मम', 'momo', 'dumplings', '🥟'),
      w('selroti', 'सेल रोटी', 'sel roti', 'ring-shaped rice bread', '🍩'),
      w('chiya', 'चिया', 'chiyaa', 'tea', '🍵'),
      w('dudh', 'दूध', 'doodh', 'milk', '🥛'),
      w('syau', 'स्याउ', 'syaau', 'apple', '🍎'),
      w('kera', 'केरा', 'keraa', 'banana', '🍌'),
      w('pani', 'पानी', 'paani', 'water', '💧'),
    ],
  },
  {
    id: 'animals', title: { ne: 'जनावर', en: 'Animals' }, pic: '🐕', color: '#2fa36b',
    words: [
      w('kukur', 'कुकुर', 'kukur', 'dog', '🐕'),
      w('biralo', 'बिरालो', 'biraalo', 'cat', '🐈'),
      w('gai', 'गाई', 'gaai', 'cow', '🐄'),
      w('kukhura', 'कुखुरा', 'kukhuraa', 'chicken', '🐓'),
      w('bandar', 'बाँदर', 'baandar', 'monkey', '🐒'),
      w('bagh', 'बाघ', 'baagh', 'tiger', '🐅'),
      w('hatti', 'हात्ती', 'haatti', 'elephant', '🐘'),
      w('bhyaguto', 'भ्यागुतो', 'bhyaaguto', 'frog', '🐸'),
    ],
  },
  {
    id: 'colours', title: { ne: 'रङ', en: 'Colours' }, pic: '🎨', color: '#1d4fb0',
    words: [
      w('rato', 'रातो', 'raato', 'red', 'swatch:#e53935'),
      w('nilo', 'निलो', 'nilo', 'blue', 'swatch:#1e63d6'),
      w('hariyo', 'हरियो', 'hariyo', 'green', 'swatch:#2fa36b'),
      w('pahelo', 'पहेंलो', 'pahenlo', 'yellow', 'swatch:#f6c445'),
      w('seto', 'सेतो', 'seto', 'white', 'swatch:#ffffff'),
      w('kalo', 'कालो', 'kaalo', 'black', 'swatch:#222222'),
      w('gulabi', 'गुलाबी', 'gulaabi', 'pink', 'swatch:#ff7ab6'),
      w('khairo', 'खैरो', 'khairo', 'brown', 'swatch:#8d5a3b'),
    ],
  },
  {
    id: 'body', title: { ne: 'मेरो शरीर', en: 'My body' }, pic: '✋', color: '#17a2b8',
    words: [
      w('aankha', 'आँखा', 'aankhaa', 'eyes', '👁️'),
      w('kaan', 'कान', 'kaan', 'ears', '👂'),
      w('naak', 'नाक', 'naak', 'nose', '👃'),
      w('mukh', 'मुख', 'mukh', 'mouth', '👄'),
      w('haat', 'हात', 'haat', 'hand', '✋'),
      w('khutta', 'खुट्टा', 'khuttaa', 'leg', '🦵'),
      w('daat', 'दाँत', 'daant', 'teeth', '🦷'),
      w('kapal', 'कपाल', 'kapaal', 'hair', '💇'),
    ],
  },
];

export const TOPIC_BY_ID: Record<string, WordTopic> = Object.fromEntries(WORD_TOPICS.map((t) => [t.id, t]));
export const ALL_WORDS: WordItem[] = WORD_TOPICS.flatMap((t) => t.words);
