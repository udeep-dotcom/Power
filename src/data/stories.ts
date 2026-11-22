// कथा — narrated picture stories. History and culture for under-6s has to be STORY, not facts
// and dates: one short sentence per page, a picture scene, and Habre reading it aloud.
// Each story is labelled as legend, history, festival or nation, so parents (and later the
// child) learn the difference. Content is in docs/CONTENT_REVIEW.md for educator sign-off.

import type { T } from './i18n';

export type SceneBg = 'sky' | 'lake' | 'night' | 'snow' | 'garden' | 'home';
export type Anim = 'bob' | 'float' | 'pop' | 'sway' | 'spin' | 'wiggle' | 'wave';
/** [pic, x %, y %, size as % of scene width, animation] */
export type SceneItem = [string, number, number, number, Anim?];
export interface StoryPage { bg: SceneBg; items: SceneItem[]; text: T }
export interface Story { id: string; title: T; pic: string; color: string; kind: 'legend' | 'history' | 'festival' | 'nation'; sticker: string; pages: StoryPage[] }

export const KIND_LABEL: Record<Story['kind'], T> = {
  legend: { ne: 'किंवदन्ती', en: 'Legend' },
  history: { ne: 'इतिहास', en: 'History' },
  festival: { ne: 'चाडपर्व', en: 'Festival' },
  nation: { ne: 'हाम्रो देश', en: 'Our country' },
};

export const STORIES: Story[] = [
  {
    id: 'valley', title: { ne: 'ताल र कमलको कथा', en: 'The Lake and the Lotus' }, pic: '🪷', color: '#1e88c9', kind: 'legend', sticker: 's-valley',
    pages: [
      { bg: 'lake', items: [['⛰️', 14, 38, 26], ['⛰️', 86, 38, 26], ['🐟', 38, 66, 12, 'bob'], ['🐟', 66, 74, 10, 'bob'], ['🌊', 50, 84, 30, 'float']],
        text: { ne: 'धेरै धेरै पहिले, काठमाडौं उपत्यका एउटा ठूलो ताल थियो।', en: 'Long, long ago, the Kathmandu Valley was a big lake.' } },
      { bg: 'lake', items: [['🪷', 50, 56, 32, 'pop'], ['✨', 30, 34, 11, 'spin'], ['✨', 70, 30, 11, 'spin'], ['🌊', 50, 86, 30, 'float']],
        text: { ne: 'तालको बीचमा एउटा चम्किलो कमलको फूल फुल्यो।', en: 'In the middle of the lake, a shining lotus flower bloomed.' } },
      { bg: 'sky', items: [['🗡️', 34, 40, 22, 'wiggle'], ['⛰️', 64, 56, 34], ['💦', 82, 78, 14, 'bob']],
        text: { ne: 'मञ्जुश्रीले आफ्नो तरवारले चोभारको डाँडा काटिदिनुभयो।', en: 'Manjushri cut open the hill at Chobhar with his sword.' } },
      { bg: 'sky', items: [['🏞️', 50, 48, 44], ['💧', 24, 74, 12, 'float'], ['💧', 76, 76, 10, 'float']],
        text: { ne: 'तालको सबै पानी बगेर गयो।', en: 'All the water of the lake flowed away.' } },
      { bg: 'garden', items: [['🏘️', 28, 54, 30], ['🌳', 86, 50, 18, 'sway'], ['🌾', 68, 72, 18, 'sway'], ['👨‍👩‍👧', 52, 68, 20, 'bob']],
        text: { ne: 'त्यहाँ हरियो उपत्यका बन्यो, अनि मानिसहरू बस्न थाले।', en: 'A green valley appeared, and people came to live there.' } },
      { bg: 'sky', items: [['🛕', 50, 50, 36, 'pop'], ['🐒', 80, 70, 16, 'bob'], ['🪷', 22, 72, 14, 'pop']],
        text: { ne: 'कमल फुलेको डाँडामा आज स्वयम्भू छ!', en: 'Today, Swayambhu stands on the hill where the lotus bloomed!' } },
    ],
  },
  {
    id: 'buddha', title: { ne: 'बुद्धको कथा', en: 'The Story of the Buddha' }, pic: '☸️', color: '#e0a100', kind: 'history', sticker: 's-buddha',
    pages: [
      { bg: 'garden', items: [['🌳', 26, 44, 32, 'sway'], ['👶', 62, 64, 20, 'bob'], ['👑', 62, 42, 12, 'wiggle']],
        text: { ne: 'धेरै पहिले, लुम्बिनीको बगैंचामा राजकुमार सिद्धार्थ जन्मनुभयो।', en: 'Long ago, Prince Siddhartha was born in a garden in Lumbini.' } },
      { bg: 'garden', items: [['🦢', 52, 62, 28, 'bob'], ['❤️', 74, 36, 12, 'pop']],
        text: { ne: 'एक दिन उहाँले घाइते हाँसलाई माया गरेर बचाउनुभयो।', en: 'One day, he lovingly saved a hurt swan.' } },
      { bg: 'garden', items: [['🌳', 50, 38, 42, 'sway'], ['🧘', 50, 68, 22, 'bob']],
        text: { ne: 'उहाँ रूखमुनि शान्त भएर बस्नुहुन्थ्यो र सोच्नुहुन्थ्यो।', en: 'He would sit calmly under a tree and think.' } },
      { bg: 'sky', items: [['☸️', 50, 46, 26, 'spin'], ['🕊️', 22, 32, 16, 'float'], ['🕊️', 78, 28, 14, 'float']],
        text: { ne: 'पछि उहाँ गौतम बुद्ध हुनुभयो र सबैलाई शान्ति र दया सिकाउनुभयो।', en: 'Later he became Gautama Buddha and taught everyone peace and kindness.' } },
      { bg: 'garden', items: [['flag', 50, 46, 26, 'wave'], ['🪷', 22, 72, 14, 'pop'], ['🪷', 78, 72, 14, 'pop']],
        text: { ne: 'बुद्ध जन्मनुभएको ठाउँ, लुम्बिनी, हाम्रो नेपालमा छ!', en: 'Lumbini, where the Buddha was born, is in our Nepal!' } },
    ],
  },
  {
    id: 'everest', title: { ne: 'सगरमाथाको टुप्पोमा', en: 'To the Top of Sagarmatha' }, pic: '🏔️', color: '#3c7fd1', kind: 'history', sticker: 's-everest',
    pages: [
      { bg: 'snow', items: [['🏔️', 50, 52, 52]],
        text: { ne: 'सगरमाथा संसारकै सबैभन्दा अग्लो हिमाल हो।', en: 'Sagarmatha is the highest mountain in the whole world.' } },
      { bg: 'snow', items: [['❄️', 22, 28, 12, 'spin'], ['🌬️', 74, 32, 18, 'float'], ['🏔️', 50, 64, 40]],
        text: { ne: 'माथि धेरै चिसो हुन्छ र हावा चल्छ, चढ्न निकै गाह्रो छ।', en: 'Up high it is very cold and windy, so climbing is very hard.' } },
      { bg: 'snow', items: [['🏔️', 50, 40, 34], ['🧗', 38, 68, 20, 'bob'], ['🧗', 62, 62, 20, 'bob']],
        text: { ne: 'सन् १९५३ मा तेन्जिङ नोर्गे शेर्पा र एडमन्ड हिलारी सँगै चढ्नुभयो।', en: 'In 1953, Tenzing Norgay Sherpa and Edmund Hillary climbed together.' } },
      { bg: 'snow', items: [['🏔️', 50, 36, 30], ['🤝', 50, 66, 22, 'pop']],
        text: { ne: 'बाटोमा उहाँहरूले एकअर्कालाई सघाउनुभयो।', en: 'On the way, they helped each other.' } },
      { bg: 'sky', items: [['🏔️', 50, 60, 46], ['flag', 51, 24, 16, 'wave']],
        text: { ne: 'अनि टुप्पोमा पुग्नुभयो! सँगै मिलेर काम गर्दा ठूलो काम पनि सकिन्छ।', en: 'And they reached the top! Working together, we can do big things.' } },
    ],
  },
  {
    id: 'dashain', title: { ne: 'दशैं आयो!', en: 'Dashain Is Here!' }, pic: '🪁', color: '#d9452b', kind: 'festival', sticker: 's-dashain',
    pages: [
      { bg: 'home', items: [['🎉', 26, 34, 16, 'spin'], ['👨‍👩‍👧‍👦', 56, 62, 30, 'bob']],
        text: { ne: 'दशैं आयो! सबै परिवार घरमा भेला हुन्छ।', en: 'Dashain is here! The whole family comes home.' } },
      { bg: 'home', items: [['🌱', 40, 66, 18, 'sway'], ['🌱', 58, 66, 18, 'sway'], ['☀️', 80, 26, 14, 'spin']],
        text: { ne: 'घरमा जमरा उमारिन्छ — सानो, हरियो बिरुवा।', en: 'We grow jamara at home — little green shoots.' } },
      { bg: 'home', items: [['👴', 34, 60, 24, 'bob'], ['🔴', 58, 36, 9, 'pop'], ['👧', 66, 64, 20, 'bob']],
        text: { ne: 'ठूलाबडाले निधारमा रातो टीका लगाइदिएर आशीर्वाद दिनुहुन्छ।', en: 'Elders put red tika on our forehead and give us their blessings.' } },
      { bg: 'sky', items: [['🪁', 28, 28, 18, 'float'], ['🪁', 72, 20, 14, 'float'], ['👦', 46, 70, 18, 'bob']],
        text: { ne: 'केटाकेटी चङ्गा उडाउँछन् र पिङ खेल्छन्।', en: 'Children fly kites and play on the swing.' } },
      { bg: 'home', items: [['❤️', 50, 34, 16, 'pop'], ['👨‍👩‍👧‍👦', 50, 64, 28]],
        text: { ne: 'दशैंमा सबै मिलेर खुसी मनाउँछौं।', en: 'At Dashain, we all celebrate happily together.' } },
    ],
  },
  {
    id: 'tihar', title: { ne: 'उज्यालो तिहार', en: 'Bright Tihar' }, pic: '🪔', color: '#e88a00', kind: 'festival', sticker: 's-tihar',
    pages: [
      { bg: 'night', items: [['🪔', 24, 64, 16, 'pop'], ['🪔', 50, 68, 16, 'pop'], ['🪔', 76, 64, 16, 'pop'], ['✨', 50, 30, 14, 'spin']],
        text: { ne: 'तिहार बत्ती र दियोको चाड हो।', en: 'Tihar is the festival of lights and lamps.' } },
      { bg: 'sky', items: [['🐦‍⬛', 32, 36, 16, 'float'], ['🐕', 60, 64, 24, 'bob'], ['🌼', 76, 46, 11, 'pop']],
        text: { ne: 'हामी काग र कुकुरलाई माया गरेर खाना र माला दिन्छौं।', en: 'We lovingly give food and flower garlands to crows and dogs.' } },
      { bg: 'garden', items: [['🐄', 46, 62, 30, 'bob'], ['🌼', 72, 38, 12, 'pop']],
        text: { ne: 'गाईको पूजा गर्छौं, अनि घर सफा गरेर सजाउँछौं।', en: 'We honour the cow, then clean and decorate our homes.' } },
      { bg: 'night', items: [['🌈', 50, 28, 30, 'pop'], ['👧', 34, 64, 22, 'bob'], ['👦', 66, 64, 22, 'bob']],
        text: { ne: 'दिदीबहिनीले दाजुभाइलाई सात रङको टीका लगाइदिन्छन्।', en: 'Sisters give their brothers a seven-coloured tika.' } },
      { bg: 'night', items: [['🎶', 28, 32, 14, 'float'], ['💃', 54, 62, 24, 'bob'], ['🪔', 80, 68, 14, 'pop']],
        text: { ne: 'देउसी-भैलो गाउँदै सबै नाच्छन्!', en: 'Everyone sings Deusi and Bhailo and dances!' } },
    ],
  },
  {
    id: 'flag', title: { ne: 'हाम्रो झण्डा', en: 'Our Flag' }, pic: 'flag', color: '#dc143c', kind: 'nation', sticker: 's-flag',
    pages: [
      { bg: 'sky', items: [['flag', 50, 50, 34, 'wave']],
        text: { ne: 'यो हाम्रो झण्डा हो। संसारमा यस्तो आकारको झण्डा अरू कतै छैन!', en: 'This is our flag. No other flag in the world has this shape!' } },
      { bg: 'snow', items: [['🏔️', 34, 56, 30], ['🏔️', 66, 50, 26]],
        text: { ne: 'यसका दुई त्रिकोण हिमालका चुचुराजस्तै देखिन्छन्।', en: 'Its two triangles look like the peaks of the Himalaya.' } },
      { bg: 'garden', items: [['🌺', 36, 54, 22, 'pop'], ['swatch:#DC143C', 66, 54, 16, 'pop']],
        text: { ne: 'यसको सिमरिक रातो रङ लालीगुराँसजस्तै छ।', en: 'Its crimson red is like the rhododendron flower.' } },
      { bg: 'sky', items: [['🌙', 34, 42, 20, 'float'], ['☀️', 68, 42, 22, 'spin']],
        text: { ne: 'यसमा जून र घाम छन्।', en: 'It has the moon and the sun.' } },
      { bg: 'sky', items: [['flag', 50, 48, 28, 'wave'], ['❤️', 78, 28, 12, 'pop']],
        text: { ne: 'जून र घाम रहुन्जेल नेपाल रहोस् भन्ने चाहना यसमा छ।', en: 'It carries the wish that Nepal lasts as long as the moon and the sun.' } },
    ],
  },
];

export const STORY_BY_ID: Record<string, Story> = Object.fromEntries(STORIES.map((s) => [s.id, s]));
