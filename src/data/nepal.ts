// "मेरो नेपाल" content. Facts are deliberately simple, verifiable statements suitable for
// ages 4–8. Every entry must be checked by a Nepali educator before release (docs/CONTENT_REVIEW.md).

import type { T } from './i18n';

export interface Province {
  id: string; // matches PROVINCE_SHAPES keys (P1..P7)
  name: T;
  capital: T;
  capitalPlace: string; // key in PLACE_XY
  color: string;
  fact: T;
  pics: string[];
}

export const PROVINCES: Province[] = [
  { id: 'P1', name: { ne: 'कोशी', en: 'Koshi' }, capital: { ne: 'विराटनगर', en: 'Biratnagar' }, capitalPlace: 'biratnagar', color: '#f28b82',
    fact: { ne: 'संसारको सबैभन्दा अग्लो हिमाल सगरमाथा र इलामको चिया बगान यही प्रदेशमा छन्।', en: 'Sagarmatha (Everest), the highest mountain on Earth, and the tea gardens of Ilam are in Koshi.' },
    pics: ['🏔️', '🍵'] },
  { id: 'P2', name: { ne: 'मधेश', en: 'Madhesh' }, capital: { ne: 'जनकपुरधाम', en: 'Janakpurdham' }, capitalPlace: 'janakpur', color: '#fbbc58',
    fact: { ne: 'मधेश समथर तराईमा छ। यहाँको रङ्गीन मिथिला चित्रकला निकै प्रसिद्ध छ।', en: 'Madhesh lies on the flat Terai and is famous for colourful Mithila paintings.' },
    pics: ['🎨', '🛕'] },
  { id: 'P3', name: { ne: 'बागमती', en: 'Bagmati' }, capital: { ne: 'हेटौंडा', en: 'Hetauda' }, capitalPlace: 'hetauda', color: '#81c995',
    fact: { ne: 'नेपालको राजधानी काठमाडौं बागमती प्रदेशमा छ।', en: "Nepal's capital city, Kathmandu, is in Bagmati." },
    pics: ['🐒', '🏯'] },
  { id: 'P4', name: { ne: 'गण्डकी', en: 'Gandaki' }, capital: { ne: 'पोखरा', en: 'Pokhara' }, capitalPlace: 'pokhara', color: '#78d9ec',
    fact: { ne: 'अन्नपूर्णा हिमाल र सुन्दर फेवाताल गण्डकी प्रदेशमा छन्।', en: 'Mount Annapurna and lovely Phewa Lake are in Gandaki.' },
    pics: ['⛰️', '🛶'] },
  { id: 'P5', name: { ne: 'लुम्बिनी', en: 'Lumbini' }, capital: { ne: 'देउखुरी', en: 'Deukhuri' }, capitalPlace: 'deukhuri', color: '#c58af9',
    fact: { ne: 'गौतम बुद्धको जन्मस्थल लुम्बिनी यही प्रदेशमा छ।', en: 'Lumbini, where Gautama Buddha was born, is in this province.' },
    pics: ['☸️', '🪷'] },
  { id: 'P6', name: { ne: 'कर्णाली', en: 'Karnali' }, capital: { ne: 'वीरेन्द्रनगर', en: 'Birendranagar' }, capitalPlace: 'birendranagar', color: '#fdcfe8',
    fact: { ne: 'कर्णाली सबैभन्दा ठूलो प्रदेश हो। नेपालकै ठूलो ताल, रारा, यहीँ छ।', en: 'Karnali is the largest province. Rara, the biggest lake in Nepal, is here.' },
    pics: ['🏞️', '🍎'] },
  { id: 'P7', name: { ne: 'सुदूरपश्चिम', en: 'Sudurpashchim' }, capital: { ne: 'गोदावरी', en: 'Godawari' }, capitalPlace: 'godawari', color: '#a7c7f9',
    fact: { ne: 'नेपालको नक्साको उत्तर-पश्चिमको टुप्पो, लिम्पियाधुरा, यही प्रदेशमा पर्छ।', en: "Limpiyadhura, the north-west tip of Nepal's map, is in Sudurpashchim." },
    pics: ['🌲', '🐅'] },
];

export interface FactCard { id: string; pic: string; title: T; fact: T }
export interface Deck { id: 'symbols' | 'festivals' | 'nature'; title: T; pic: string; color: string; cards: FactCard[] }

export const DECKS: Deck[] = [
  {
    id: 'symbols', title: { ne: 'हाम्रो चिनारी', en: 'Our symbols' }, pic: 'flag', color: '#e63950',
    cards: [
      { id: 'flag', pic: 'flag', title: { ne: 'राष्ट्रिय झण्डा', en: 'National flag' },
        fact: { ne: 'हाम्रो झण्डा दुई त्रिकोण मिलेर बनेको छ। यसमा चन्द्रमा र सूर्य छन्।', en: 'Our flag is made of two triangles, with the moon and the sun on it.' } },
      { id: 'flower', pic: '🌺', title: { ne: 'लालीगुराँस', en: 'Rhododendron' },
        fact: { ne: 'लालीगुराँस हाम्रो राष्ट्रिय फूल हो। यो वसन्तमा पहाडभरि फुल्छ।', en: 'Lali Gurans is our national flower. It blooms all over the hills in spring.' } },
      { id: 'bird', pic: 'danfe', title: { ne: 'डाँफे', en: 'Danfe' },
        fact: { ne: 'डाँफे हाम्रो राष्ट्रिय चरा हो। यसका प्वाँख इन्द्रेणीजस्तै चम्किला हुन्छन्।', en: 'The Danfe is our national bird. Its feathers shine like a rainbow.' } },
      { id: 'animal', pic: '🐄', title: { ne: 'गाई', en: 'Cow' },
        fact: { ne: 'गाई हाम्रो राष्ट्रिय जनावर हो।', en: 'The cow is our national animal.' } },
      { id: 'colour', pic: 'swatch:#DC143C', title: { ne: 'सिमरिक रङ', en: 'Crimson' },
        fact: { ne: 'सिमरिक हाम्रो राष्ट्रिय रङ हो। झण्डामा पनि यही रङ छ।', en: 'Crimson is our national colour — the same red as our flag.' } },
      { id: 'capital', pic: '🛕', title: { ne: 'काठमाडौं', en: 'Kathmandu' },
        fact: { ne: 'काठमाडौं नेपालको राजधानी हो।', en: 'Kathmandu is the capital of Nepal.' } },
      { id: 'anthem', pic: '🎵', title: { ne: 'राष्ट्रिय गान', en: 'National anthem' },
        fact: { ne: 'हाम्रो राष्ट्रिय गान "सयौं थुङ्गा फूलका" हो।', en: 'Our national anthem is "Sayaun Thunga Phulka" (Made of hundreds of flowers).' } },
      { id: 'sport', pic: '🏐', title: { ne: 'भलिबल', en: 'Volleyball' },
        fact: { ne: 'भलिबल नेपालको राष्ट्रिय खेल हो।', en: 'Volleyball is the national sport of Nepal.' } },
      { id: 'script', pic: 'txt:क', title: { ne: 'देवनागरी लिपि', en: 'Devanagari script' },
        fact: { ne: 'नेपाली भाषा देवनागरी लिपिमा लेखिन्छ — तिमीले सिकिरहेको अक्षर!', en: 'Nepali is written in Devanagari — the letters you are learning!' } },
    ],
  },
  {
    id: 'festivals', title: { ne: 'चाडपर्व', en: 'Festivals' }, pic: '🪁', color: '#ff9f1c',
    cards: [
      { id: 'dashain', pic: '🪁', title: { ne: 'दशैं', en: 'Dashain' },
        fact: { ne: 'दशैंमा ठूलाबडाबाट टीका थापिन्छ, पिङ खेलिन्छ र चङ्गा उडाइन्छ।', en: 'At Dashain we receive tika from elders, play on swings and fly kites.' } },
      { id: 'tihar', pic: '🪔', title: { ne: 'तिहार', en: 'Tihar' },
        fact: { ne: 'तिहारमा दियो बालिन्छ, काग, कुकुर र गाईको पूजा गरिन्छ, र भाइटीका लगाइन्छ।', en: 'At Tihar we light lamps, honour crows, dogs and cows, and celebrate Bhai Tika.' } },
      { id: 'holi', pic: '🎨', title: { ne: 'होली', en: 'Holi' },
        fact: { ne: 'होलीमा साथीहरूसँग रङ खेलिन्छ।', en: 'At Holi we play with colours with our friends.' } },
      { id: 'chhath', pic: '🌇', title: { ne: 'छठ', en: 'Chhath' },
        fact: { ne: 'छठमा अस्ताउँदो र उदाउँदो सूर्यलाई अर्घ्य दिइन्छ।', en: 'At Chhath people give offerings to the setting and the rising sun.' } },
      { id: 'lhosar', pic: '🎉', title: { ne: 'ल्होसार', en: 'Lhosar' },
        fact: { ne: 'ल्होसार गुरुङ, तामाङ, शेर्पालगायत धेरै समुदायको नयाँ वर्ष हो।', en: 'Lhosar is the New Year of the Gurung, Tamang, Sherpa and other communities.' } },
      { id: 'teej', pic: '💃', title: { ne: 'तीज', en: 'Teej' },
        fact: { ne: 'तीजमा महिलाहरू रातो लुगा लगाएर नाचगान गर्छन्।', en: 'At Teej women wear red and sing and dance together.' } },
    ],
  },
  {
    id: 'nature', title: { ne: 'प्रकृति', en: 'Nature' }, pic: 'danfe', color: '#2fa36b',
    cards: [
      { id: 'himal', pic: '🏔️', title: { ne: 'हिमाल', en: 'Mountains' },
        fact: { ne: 'नेपालको उत्तरमा हिउँले ढाकिएका हिमाल छन्।', en: 'In the north of Nepal are snowy mountains.' } },
      { id: 'pahad', pic: '⛰️', title: { ne: 'पहाड', en: 'Hills' },
        fact: { ne: 'बीचमा हरिया पहाड, खोला र उपत्यका छन्।', en: 'In the middle are green hills, rivers and valleys.' } },
      { id: 'terai', pic: '🌾', title: { ne: 'तराई', en: 'Terai' },
        fact: { ne: 'दक्षिणमा समथर तराई छ, जहाँ धेरै धान फल्छ।', en: 'In the south are the flat Terai plains, where lots of rice grows.' } },
      { id: 'everest', pic: '🏔️', title: { ne: 'सगरमाथा', en: 'Sagarmatha' },
        fact: { ne: 'संसारका ८,००० मिटरभन्दा अग्ला १४ हिमालमध्ये ८ वटा नेपालमा छन्।', en: '8 of the 14 mountains on Earth taller than 8,000 metres are in Nepal.' } },
      { id: 'karnali', pic: '🌊', title: { ne: 'कर्णाली नदी', en: 'Karnali River' },
        fact: { ne: 'कर्णाली नेपालको सबैभन्दा लामो नदी हो।', en: 'The Karnali is the longest river in Nepal.' } },
      { id: 'rhino', pic: '🦏', title: { ne: 'एकसिङ्गे गैंडा', en: 'One-horned rhino' },
        fact: { ne: 'एकसिङ्गे गैंडा चितवन र बर्दियाका जङ्गलमा पाइन्छ।', en: 'One-horned rhinos live in Chitwan and Bardiya.' } },
      { id: 'tiger', pic: '🐅', title: { ne: 'बाघ', en: 'Tiger' },
        fact: { ne: 'पाटे बाघ तराईका जङ्गलमा बस्छ।', en: 'Royal Bengal tigers live in the forests of the Terai.' } },
      { id: 'habre', pic: 'habre', title: { ne: 'हाब्रे', en: 'Red panda' },
        fact: { ne: 'हाब्रे (रातो पाण्डा) हिमाली जङ्गलमा बस्छ — हाम्रो साथी हाब्रेजस्तै!', en: 'Red pandas live in mountain forests — just like our friend Habre!' } },
    ],
  },
];

export interface QuizQ { q: T; options: { pic: string; label: T }[]; answer: number }

const o = (pic: string, ne: string, en: string) => ({ pic, label: { ne, en } });

/** Pool of questions; each quiz run draws 8 at random and shuffles the options. */
export const QUIZ: QuizQ[] = [
  { q: { ne: 'संसारको सबैभन्दा अग्लो हिमाल कुन हो?', en: 'Which is the highest mountain in the world?' },
    options: [o('🏔️', 'सगरमाथा', 'Sagarmatha'), o('⛰️', 'फूलचोकी', 'Phulchoki'), o('🏞️', 'राराताल', 'Rara Lake')], answer: 0 },
  { q: { ne: 'नेपालको राष्ट्रिय फूल कुन हो?', en: 'What is the national flower of Nepal?' },
    options: [o('🌺', 'लालीगुराँस', 'Rhododendron'), o('🌻', 'सूर्यमुखी', 'Sunflower'), o('🌹', 'गुलाफ', 'Rose')], answer: 0 },
  { q: { ne: 'नेपालको राष्ट्रिय जनावर कुन हो?', en: 'What is the national animal of Nepal?' },
    options: [o('🐄', 'गाई', 'Cow'), o('🐅', 'बाघ', 'Tiger'), o('🐘', 'हात्ती', 'Elephant')], answer: 0 },
  { q: { ne: 'नेपालको राजधानी कुन हो?', en: 'What is the capital of Nepal?' },
    options: [o('🛕', 'काठमाडौं', 'Kathmandu'), o('🛶', 'पोखरा', 'Pokhara'), o('🏭', 'विराटनगर', 'Biratnagar')], answer: 0 },
  { q: { ne: 'गौतम बुद्ध कहाँ जन्मनुभएको हो?', en: 'Where was Gautama Buddha born?' },
    options: [o('☸️', 'लुम्बिनी', 'Lumbini'), o('🛕', 'जनकपुर', 'Janakpur'), o('🛶', 'पोखरा', 'Pokhara')], answer: 0 },
  { q: { ne: 'नेपालमा कतिवटा प्रदेश छन्?', en: 'How many provinces does Nepal have?' },
    options: [o('txt:७', 'सात', 'Seven'), o('txt:५', 'पाँच', 'Five'), o('txt:९', 'नौ', 'Nine')], answer: 0 },
  { q: { ne: 'नेपालको राष्ट्रिय रङ कुन हो?', en: 'What is the national colour of Nepal?' },
    options: [o('swatch:#DC143C', 'सिमरिक', 'Crimson'), o('swatch:#2fa36b', 'हरियो', 'Green'), o('swatch:#f6c445', 'पहेंलो', 'Yellow')], answer: 0 },
  { q: { ne: 'एकसिङ्गे गैंडा कहाँ बस्छ?', en: 'Where does the one-horned rhino live?' },
    options: [o('🌳', 'चितवनको जङ्गलमा', 'In Chitwan’s forests'), o('🏔️', 'सगरमाथाको टुप्पोमा', 'On top of Everest'), o('🌊', 'समुद्रमा', 'In the sea')], answer: 0 },
  { q: { ne: 'तिहारमा के बालिन्छ?', en: 'What do we light at Tihar?' },
    options: [o('🪔', 'दियो', 'Lamps'), o('🪁', 'चङ्गा', 'Kites'), o('🎨', 'रङ', 'Colours')], answer: 0 },
  { q: { ne: 'दशैंमा आकाशमा के उडाइन्छ?', en: 'What do we fly in the sky at Dashain?' },
    options: [o('🪁', 'चङ्गा', 'Kites'), o('🪔', 'दियो', 'Lamps'), o('🛶', 'डुङ्गा', 'Boats')], answer: 0 },
  { q: { ne: 'होलीमा के खेलिन्छ?', en: 'What do we play with at Holi?' },
    options: [o('🎨', 'रङ', 'Colours'), o('🪁', 'चङ्गा', 'Kites'), o('🪔', 'दियो', 'Lamps')], answer: 0 },
  { q: { ne: 'नेपालको राष्ट्रिय खेल कुन हो?', en: 'What is the national sport of Nepal?' },
    options: [o('🏐', 'भलिबल', 'Volleyball'), o('⚽', 'फुटबल', 'Football'), o('🏏', 'क्रिकेट', 'Cricket')], answer: 0 },
  { q: { ne: 'नेपालको सबैभन्दा ठूलो ताल कुन हो?', en: 'Which is the biggest lake in Nepal?' },
    options: [o('🏞️', 'राराताल', 'Rara'), o('🛶', 'फेवाताल', 'Phewa'), o('💧', 'बेगनासताल', 'Begnas')], answer: 0 },
  { q: { ne: 'हाब्रे (रातो पाण्डा) कहाँ बस्छ?', en: 'Where do red pandas live?' },
    options: [o('🌲', 'हिमाली जङ्गलमा', 'In mountain forests'), o('🌊', 'समुद्रमा', 'In the sea'), o('🏜️', 'मरुभूमिमा', 'In the desert')], answer: 0 },
  { q: { ne: 'नेपालको उत्तरतिर के छ?', en: 'What is in the north of Nepal?' },
    options: [o('🏔️', 'हिमाल', 'Mountains'), o('🌾', 'तराई', 'Plains'), o('🌊', 'समुद्र', 'The sea')], answer: 0 },
  { q: { ne: 'नेपालको झण्डामा के-के छन्?', en: "What is on Nepal's flag?" },
    options: [o('🌙', 'चन्द्रमा र सूर्य', 'Moon and sun'), o('⭐', 'तारा', 'A star'), o('🌳', 'रूख', 'A tree')], answer: 0 },
  { q: { ne: 'डाँफे के हो?', en: 'What is the Danfe?' },
    options: [o('danfe', 'राष्ट्रिय चरा', 'National bird'), o('🌺', 'राष्ट्रिय फूल', 'National flower'), o('🏐', 'राष्ट्रिय खेल', 'National sport')], answer: 0 },
  { q: { ne: 'मिथिला चित्रकला कुन प्रदेशमा प्रसिद्ध छ?', en: 'Which province is famous for Mithila painting?' },
    options: [o('🎨', 'मधेश', 'Madhesh'), o('🏞️', 'कर्णाली', 'Karnali'), o('⛰️', 'गण्डकी', 'Gandaki')], answer: 0 },
  { q: { ne: '"क" बाट सुरु हुने शब्द कुन हो?', en: 'Which word starts with "क"?' },
    options: [o('🪷', 'कमल', 'kamal'), o('🏠', 'घर', 'ghar'), o('🐟', 'माछा', 'maachha')], answer: 0 },
  { q: { ne: 'नेपाली भाषा कुन लिपिमा लेखिन्छ?', en: 'Which script is Nepali written in?' },
    options: [o('txt:क', 'देवनागरी', 'Devanagari'), o('txt:A', 'रोमन', 'Roman'), o('txt:ا', 'अरबी', 'Arabic')], answer: 0 },
];
