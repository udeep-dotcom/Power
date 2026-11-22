# अक्षर यात्रा · Akshar Yatra

A game for Nepali children aged 4–8: climb from the Terai to the top of Sagarmatha by learning the 49
letters of the Nepali alphabet, and collect stickers of real places, animals and festivals of Nepal on
the way. Your guide is **Habre**, a red panda in a Dhaka topi.

**Web first, Android second, one codebase:** a Preact + TypeScript web app, wrapped for Android with
Capacitor so it runs fully offline.

| | |
|---|---|
| 📖 Design document | [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md): audience, learning goals, activities, rewards, art, roadmap, a critique of the brief, and the v0.2 audit (§0b) |
| 🤖 Android | [`docs/ANDROID.md`](docs/ANDROID.md): build, publish, what is Android-specific |
| 🎙️ Audio | [`docs/AUDIO.md`](docs/AUDIO.md) + [`docs/recording-script.csv`](docs/recording-script.csv): 147 priority clips (+432 optional बाह्रखरी syllables) for a native voice artist |
| ✅ Content review | [`docs/CONTENT_REVIEW.md`](docs/CONTENT_REVIEW.md): every word and fact, as a checklist for a Nepali teacher |

## What's in v0.2
- **Journey (यात्रा):** 71 stops across Terai → Pahad → Himal. Each letter gets a 3-step lesson: look &
  listen, trace with your finger (scored), find it.
- **4 mini-games:** Listen & pick, Picture match, Balloon pop, Memory pairs. They mix in the child's
  weakest letters for review and use look-alike letters (घ/ध, ब/व, भ/म) as distractors.
- **My Nepal (मेरो नेपाल):** a tappable map of the 7 provinces on the official 2020 (चुच्चे) boundary;
  flip-card decks on national symbols, festivals and nature; a spoken picture quiz.
- **बाह्रखरी:** an explorer for all 36 consonants × 12 vowel forms (`क + ◌ि = कि`, spoken), plus a
  vowel-sign game that always pairs the signs children confuse (ि/ी, ु/ू, े/ै, ो/ौ).
- **Today's practice:** spaced review built from each child's weakest letters (no streaks, no guilt).
- **Players:** up to 4 siblings on one phone, each with an animal avatar and separate progress, chosen
  on a start screen that also unlocks sound so Habre's greeting is heard.
- **Sticker book** (17 stickers, each with a fact), **Letters** grid for free exploration, and a gated
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
npm test               # 127 unit tests (content, trace scoring, saves/players, बाह्रखरी)
npm run test:e2e       # 10 Playwright end-to-end tests against the production build
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
