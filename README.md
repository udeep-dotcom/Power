# अक्षर यात्रा · Akshar Yatra

नेपाली अक्षर, शब्द, कथा र संस्कृति — साना नानीहरूका लागि, नेपालमा र विदेशमा।

A Nepali-first app and website for children **under 6**, in Nepal and abroad, to grow up with their
language: letters, first words, numbers, stories, music and Nepal itself. Your guide is **Habre (हाब्रे)**,
a red panda in a Dhaka topi. Since v0.4 it also teaches **how Nepali and English sounds are made**.

**Web first, Android second, one codebase:** a Preact + TypeScript web app, wrapped for Android with
Capacitor so it runs fully offline.

| | |
|---|---|
| 📖 Design document | [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md): audience, learning goals, activities, rewards, art, roadmap, a critique of the brief, the v0.2 audit (§0b) and the v0.4 phonics decisions (§0d) |
| 👄 Phonics research | [`docs/PHONICS_RESEARCH.md`](docs/PHONICS_RESEARCH.md): what Jolly Phonics, Google Read Along and ELSA do, what we adopted and rejected, Nepali-specific findings, sources |
| 🤖 Android | [`docs/ANDROID.md`](docs/ANDROID.md): build, publish, what is Android-specific |
| 🎙️ Audio | [`docs/AUDIO.md`](docs/AUDIO.md) + [`docs/recording-script.csv`](docs/recording-script.csv): 236 priority clips, 432 optional बाह्रखरी syllables and 125 phonics clips (Nepali and English voices) |
| ✅ Content review | [`docs/CONTENT_REVIEW.md`](docs/CONTENT_REVIEW.md): every word and fact, as a checklist for a Nepali teacher |

## What's in v0.4
- **ध्वनि (Sounds) — मुखको नक्सा:** the वर्ग table as a living mouth map. Tap a letter: the head lights up
  where it is made, a 🕯️ flame blows for महाप्राण, a 🐝 buzzes for घोष, 👃 for नासिक्य. Every letter lesson
  links to it.
- **ए बी सी (English phonics):** 26 letters in 5 Jolly-Phonics-style groups (s a t p i n first), each with
  its *sound* before its name, a key word, an action, IPA and its Nepali "sound friend" (m = म, t ≈ ट).
- **जोडेर पढौं (Blending):** slide a finger along the arrow and the sounds run together into a word.
  Onset + rime for ages 3–4, every sound for 5–6; Nepali blends by अक्षर.
- **कान खोलेर सुन (Minimal pairs):** बात/भात, दाल/डाल, तीन/टिन; fan/van, sheep/ship, vest/west. Habre
  names the difference after each answer.
- **आवाज खोज and ध्वनि साथी:** find the picture that starts with a sound; match English sounds to Nepali
  ones, and see which sounds exist in only one language.
- **मेरो आवाज (Say it too):** record 2 seconds and hear yourself next to Habre, on-device only. No
  pronunciation "scores": speech recognition is unreliable for under-6s (see the research doc).
  Parents can turn the mic off.
- **🐢 Slow** button wherever a sound plays.
- **Fixed:** the बाह्रखरी listening game no longer asks children to hear ि vs ी (they sound the same).

## Also in the app (v0.1–v0.3)
- **Nepali first, for every family:** Nepali text is always shown and spoken first. The "नेपाली +
  English" mode adds a small English line and spoken translation for families abroad.
- **Made for ages 3–6:** Habre asks each child's age once, and every game adapts (2 choices at 3, 4 at 6;
  counting to 3 vs to 10; gentler tracing for little hands).
- **शब्द (Words):** 48 first words (family, kind words, food, animals, colours, body), each spoken, with
  a listening game. These are the words that let children abroad talk to their grandparents.
- **अङ्क (Numbers):** numerals १–१० with count-along and a tap-to-count game.
- **कथा (Stories):** 6 narrated picture stories: the Kathmandu Valley legend, the Buddha, Everest 1953,
  Dashain, Tihar and our flag.
- **खेल (Play):** play मादल, डम्फू, बाँसुरी and a temple घण्टी, and colour the flag, a Danfe, लालीगुराँस and
  a pagoda (artwork is saved).
- **For parents:** an optional daily play limit (Habre gets sleepy), gentle menu music, and a
  progress report for each child.
- **Journey (यात्रा):** 71 stops across Terai → Pahad → Himal. Each letter gets a 3-step lesson: look &
  listen, trace with your finger (scored), find it.
- **4 mini-games:** Listen & pick, Picture match, Balloon pop, Memory pairs. They mix in the child's
  weakest letters for review and use look-alike letters (घ/ध, ब/व, भ/म) as distractors.
- **My Nepal (मेरो नेपाल):** a tappable map of the 7 provinces on the official 2020 (चुच्चे) boundary;
  flip-card decks on national symbols, festivals and nature; a spoken picture quiz.
- **बाह्रखरी:** an explorer for all 36 consonants × 12 vowel forms (`क + ◌ि = कि`, spoken), plus a
  vowel-sign game: reading rounds pair the signs children confuse in spelling (ि/ी, ु/ू); listening
  rounds only offer signs that really sound different.
- **Today's practice:** spaced review built from each child's weakest letters (no streaks, no guilt).
- **Players:** up to 4 siblings on one phone, each with an animal avatar and separate progress, chosen
  on a start screen that also unlocks sound so Habre's greeting is heard.
- **Sticker book** (37 stickers, each with a fact), **Letters** grid for free exploration, and a gated
  **Parent zone** with players, a per-letter mastery heat-map for each child, and settings (Nepali/English
  instructions, voice, romanisation, unlock all).
- Works on 360 px phones through to tablets, which get the whole UI scaled up.
- Nepali-correct letter forms (Noto Sans Devanagari with `lang="ne"`), synthesised sound effects, and
  speech that falls back from recorded audio to native TTS to browser TTS. No ads, no tracking, works
  offline.

## Run it
```bash
npm ci
npm run dev            # http://localhost:5173
npm test               # 214 unit tests (content, phonics data, trace scoring, saves/players, age levels, Nepali-first)
npm run test:e2e       # 29 Playwright end-to-end tests against the production build (incl. a fake mic)
npm run build          # dist/ (PWA)
npm run build:single   # dist-single/index.html — one self-contained file to share
npm run android:sync   # build + copy into android/ (then open in Android Studio)
```

Regenerate the derived files after editing content:
```bash
npm run gen                              # emoji subset + map paths
node scripts/gen-content-review.ts       # docs/CONTENT_REVIEW.md
node scripts/gen-recording-script.ts     # docs/recording-script.csv
```

## Credits
- Emoji graphics: [Twemoji](https://github.com/jdecked/twemoji), © Twitter/X and contributors, CC-BY 4.0
- Province boundaries: official 2020 map of Nepal via [`nepali-geo-pro-max`](https://www.npmjs.com/package/nepali-geo-pro-max) (MIT)
- Fonts: Noto Sans Devanagari and Baloo 2 (SIL Open Font License 1.1)

---
*This repository hosts several unrelated projects, each on its own branch (see `main`). This branch
holds Akshar Yatra.*
