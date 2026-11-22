# अक्षर यात्रा · Akshar Yatra — Game Design Document

*Version 0.2 · November 2026 · Status: playable web build + Android project (audited and extended — see §0b)*

A game in which Nepali children climb from the Terai to the top of Sagarmatha by learning the
49 letters of the Nepali alphabet, collecting stickers of real Nepali places, animals and festivals on
the way. Their guide is **Habre (हाब्रे)**, a red panda in a Dhaka topi.

---

## 0. Critique of the brief, and the decisions taken

The brief was: *a detailed game, web first and then Android, for Nepali kids to learn about their
country and especially the alphabet; highly interactive, premium-looking, easy to use.* It is a good
brief, but it has gaps that would sink the product if left implicit. Here they are, with the decision
taken for each.

| # | Gap or risk in the brief | Why it matters | Decision |
|---|---|---|---|
| 1 | **"Kids" is not an audience.** A 4-year-old and a 10-year-old need different games. | Alphabet learning is age 4–7. Older children find it babyish. Younger ones can't read instructions. | Design for **ages 4–8, pre-readers first**. Every instruction is spoken, tappable to replay, and shown with a picture. Older children get the Nepal quiz and fact cards. |
| 2 | **"Web first, then Android" can mean building it twice.** | Two codebases double cost and drift apart. | **One codebase.** The web app is wrapped for Android with Capacitor; the APK bundles the web files and works offline. Go native only if real low-end devices prove too slow. |
| 3 | **Audio is the product, and the brief doesn't mention it.** | Pre-readers learn letters by *hearing* them. Browser and phone text-to-speech for Nepali is uneven, and Android's WebView has no speech API at all. | Built a fallback chain: **recorded clip → Android native TTS → browser TTS (Nepali or Hindi only) → silent with pictures.** It never lets an English voice read Devanagari. **The real fix is a native Nepali voice artist:** 147 clips, about half a day in a studio (`docs/recording-script.csv`). |
| 4 | **"Premium" can't come from emoji.** | Emoji look different on every phone, and Android 10/11 (common in Nepal) can't draw newer ones such as 🪷 or 🪞. | For now: bundled **Twemoji SVGs** (the same on every device and offline) plus hand-built SVG for the flag, the Danfe, the mascot and the scenery. **For launch:** commission roughly 90 custom illustrations in one style (see §9). |
| 5 | **Nepali isn't Hindi.** | Most Devanagari fonts draw झ and the numerals ५ and ८ the Hindi way. Nepali parents notice at once. | Devanagari is drawn in **Noto Sans Devanagari with `lang="ne"`**, which switches to the Nepali forms. This was checked by rendering both. Baloo 2 is used only for Latin text. |
| 6 | **The map is political.** | Since May 2020 Nepal's official map includes Kalapani, Lipulekh and Limpiyadhura. Common open datasets (OCHA 2019) leave them out, and a Nepali school app with the old map would be rejected. | Province shapes come from MIT-licensed data that ships the **official 2020 (चुच्चे) boundary**. The three points were verified to fall inside Sudurpashchim before the data was used. |
| 7 | **An alphabet is not literacy.** | Nepali children can usually recite क-ख-ग. What they struggle with is **बाह्रखरी** (consonant + vowel-sign combinations: क का कि की …) and reading words. | v0.1 covered letters. **v0.2 adds a बाह्रखरी explorer and a vowel-sign game (§4.4).** |
| 8 | **Who pays?** | Families in Nepal rarely pay for apps. Ads in a children's app are both unethical and a Google Play policy risk. | **No ads, no tracking, no accounts.** Likely paying market: diaspora parents (US, UK, Australia, Gulf, Japan) who want their children to read Nepali. That is why there is an English instruction mode. Other route: school or NGO licences. **This needs validating before more money is spent (§13).** |
| 9 | **Facts go stale.** | Province names and capitals changed between 2020 and 2023 (Koshi, Madhesh; the Lumbini and Sudurpashchim capitals). | All content lives in data files. `docs/CONTENT_REVIEW.md` is generated from them as a checklist for a Nepali teacher to sign off before every release. |

---

## 0b. v0.2 audit — what was wrong with v0.1, and what changed

v0.1 was audited by testing on a 360×640 low-end phone, a 768×1024 tablet and a 390×844 phone, reading
the code, and reading the Capacitor 8 Android sources. Findings, most serious first:

| Severity | Finding | Fix |
|---|---|---|
| High | **Android edge-to-edge conflict.** v0.1 called `StatusBar.setOverlaysWebView(true)`, fighting Capacitor 8's own `SystemBars` inset handling. On WebViews older than Chrome 140 that can put the top bar under the phone's status bar. | Removed the status-bar plugin. `SystemBars` is configured in `capacitor.config.ts`; CSS reads `var(--safe-area-inset-*, env(…))`, which is correct in both Capacitor modes. |
| High | **Crash on older WebViews:** `structuredClone` (Chrome 98+) was used to save progress. | Replaced with a JSON clone. Build targets Chrome 88; older engines get a bilingual "please update WebView" screen instead of a broken game. |
| High | **Blank tiles on older WebViews:** `color-mix()` (Chrome 111+) styled the My Nepal tiles. | Tints are computed in code (`tileVars`). |
| High | **Web users never got updates:** the service worker served the cached page forever. | Pages are network-first; hashed assets stay cache-first. |
| High | **Silent first impression:** browsers block sound until the first tap, so Habre's greeting was never heard. | New start screen: one big tap (or "who's playing?") unlocks audio, then Habre speaks. |
| Medium | **Tracing could be gamed:** colouring in the letter's bounding box scored 3★. Measured: careful traces use ≤ 1.33× the letter's area in ink, box scribbles 1.39–2.1×. | Excess ink above 1.3× lowers precision (box scribble → 0★, careful → 3★). After 3 failed tries the child moves on with 1★, so there is no dead end. |
| Medium | **Picture match was misleading:** for छाता it hid `छा` but asked for `छ`. | Only the letter is hidden; attached vowel signs stay on a dotted placeholder (`◌ाता`). There is an automated test for it. |
| Medium | **Balloon pop:** when the target changed, balloons that had just been correct counted as mistakes; fast double-pops lost a count. | Old balloons float away on a target change; hits use a ref counter. |
| Medium | **Memory pairs could leave out the unit's own letters** in favour of review letters. | The unit's letters always come first. |
| Medium | **Game instructions were never spoken.** Pre-readers saw a text bubble they couldn't read. | Habre explains each game aloud before the first prompt; English mode now waits for speech to finish and works on Android (native TTS). |
| Medium | **Tablets showed a phone-sized UI** in the middle of the screen. | The whole UI scales up (CSS zoom, 1–1.7×); trace input maps coordinates correctly under zoom. |
| Low | Home header overlapped the logo on 360 px phones. *(v0.1 also reported "horizontal scroll" there; that was a false positive from the audit script. The document never scrolled sideways.)* | The header is a 3-column grid with a fitted logo. |
| Low | Duplicate player ids possible on fast double-tap (found by the new unit tests). | Random, collision-checked ids. |
| Low | No visible keyboard focus; journey nodes had English-only labels like "game". | `:focus-visible` rings; bilingual labels. |

**New in v0.2:** player profiles for siblings, Today's practice (spaced review), बाह्रखरी, a live
trace star meter with a sparkle trail, the start screen, and a Playwright end-to-end suite in CI.

---

## 1. Goals

### Learning goals (measurable)
After about 3 weeks of 10-minute sessions, a child aged 5–7 should be able to:
1. **Recognise** all 49 letters when hearing them (≥ 80% accuracy in "Listen & pick").
2. **Name** each letter with its chart word ("क — कमलको क").
3. **Trace** each letter recognisably (≥ 2★ trace score).
4. **Know 20+ facts** about Nepal: provinces, national symbols, festivals, geography.

### Experience goals
- A 4-year-old can play **without an adult** after the first minute.
- **No failure states.** A wrong answer wiggles, gives a gentle sound, and the child tries again. There are no lives, timers or "game over".
- Sessions fit **5–10 minutes**. Every activity is 1–3 minutes long and ends in a celebration.

### Non-goals (v0.1)
Writing whole words, spelling, grammar, multiplayer, accounts, cloud sync.

---

## 2. Core loop

```
 Journey stop ──► activity (1–3 min) ──► stars + celebration ──► next stop unlocks
      ▲                                                                   │
      └──────── every 3–5 letters: mini-game ──► 🎁 sticker + fact ◄────────┘
```

**The journey is the hook. Stickers are the collection drive. Facts about Nepal are the reward.**
Geography isn't a separate subject competing for time: it is the reward for literacy.

---

## 3. Structure — the Journey (यात्रा)

A vertical, scrolling path climbed **from the bottom up**: Terai → Pahad → Himal → the summit of
Sagarmatha with the Nepal flag. There are 71 stops: 49 letters, 11 mini-games and 11 sticker chests.

| Unit | Region | Letters | Mini-game | Sticker reward |
|---|---|---|---|---|
| 1 | तराई Terai | अ आ इ ई | Listen & pick | ☸️ Lumbini |
| 2 | तराई | उ ऊ ऋ ए | Picture match | 🦏 Chitwan |
| 3 | तराई | ऐ ओ औ अं अः | Balloon pop | 🛕 Janakpur |
| 4 | पहाड Hills | क ख ग घ ङ | Memory pairs | 🐒 Swayambhu |
| 5 | पहाड | च छ ज झ ञ | Listen & pick | 🛶 Pokhara |
| 6 | पहाड | ट ठ ड ढ ण | Balloon pop | 🏯 Bhaktapur |
| 7 | पहाड | त थ द ध न | Picture match | 🪔 Tihar |
| 8 | हिमाल Himal | प फ ब भ म | Memory pairs | 🏞️ Rara |
| 9 | हिमाल | य र ल व | Balloon pop | 🐆 Snow leopard |
| 10 | हिमाल | श ष स ह | Listen & pick | ⛰️ Annapurna |
| 11 | हिमाल | क्ष त्र ज्ञ | Picture match | 🏔️ Sagarmatha (finale) |

**Letter order follows the traditional chart.** Nepali parents and teachers use this order, so the app
lines up with school and home. (Teaching by frequency or shape group would be pedagogically
defensible but would put the app at odds with what children see at school.)

**Unlocking:** stops unlock one after another. A locked stop wiggles and Habre says "finish the earlier
steps first". Parents can **unlock everything** in the Parent zone, for children who already know some
letters. The **Letters** screen always allows free exploration of all 49 letters.

---

## 4. Activities

### 4.1 Letter lesson (3 steps, about 90 seconds)
1. **हेर र सुन · Look & listen.** A big letter card flips in. Habre says the chart chant ("क, कमलको क").
   A picture card shows the example word with the target letter in crimson. Tapping anything replays it.
2. **लेख्ने अभ्यास · Trace.** The letter is shown faint and dashed on a writing pad with शिरोरेखा guide
   lines. The child traces with a finger.
   - **Scoring** (`src/lib/trace.ts`): the letter and the child's strokes are each turned into a 64×64
     grid. *Coverage* is the share of the letter that was painted. *Precision* is the share of the
     painting that lies on or near the letter (3 cells of slack), reduced when the child uses much more
     ink than the letter has (more than 1.3× its area: that is colouring in, not tracing). 3★ is ≥ 80% on
     both; 2★ ≥ 65%; 1★ ≥ 50%.
   - A **live star meter** under the pad lights up as the trace improves, and the ✓ button pulses once
     1★ is reached. A sparkle trail follows the finger.
   - A 3★ trace is accepted automatically the moment it's reached. Otherwise the child taps ✓. A score
     below 1★ shows "Almost! A little more", clears the pad and lets them retry. After 3 tries the child
     moves on with 1★, so it is never a dead end.
   - *Known limitation:* stroke **order and direction** are not checked. Doing that needs hand-made
     stroke data for all 49 letters (§12).
3. **खोज त! · Find it.** Four letter tiles. Distractors are *look-alikes* (घ/ध, ब/व, भ/म, प/ष …) once
   the child has seen both letters, otherwise letters of the same kind.

**Stars** = the trace stars, minus one if the Find step needed more than one try (never below 1★).

### 4.2 Mini-games (6 rounds each, 1–2 minutes)
Habre explains each game aloud before the first round. At least 4 of the 6 rounds use the unit's own
letters; the rest are **the child's weakest earlier letters** (spaced review).

| Game | Mechanic | Difficulty dial | Stars |
|---|---|---|---|
| **सुन र छान · Listen & pick** | Hear a letter, tap it from 3–4 tiles | 3 tiles for 4-letter units, 4 for 5-letter units; look-alike distractors | ≤1 mistake 3★, ≤3 2★, else 1★ |
| **चित्र र अक्षर · Picture match** | Picture plus word with the letter hidden (`?मल`, `◌ाता`); tap the missing letter. Vowel signs attached to the letter stay visible. The full word is revealed on success. | Same | Same |
| **बेलुन फुटाऊ · Balloon pop** | Balloons rise with letters; pop the target (6 pops, target changes every 2) | Balloons drift slowly; escaping balloons cost nothing | Wrong pops only |
| **जोडी मिलाऊ · Memory pairs** | 8 face-down cards, letter ↔ picture | 4 pairs (working-memory limit for age 5) | Mismatches ÷ 2 |

**Accessibility rule:** if no Nepali voice is available, *Listen & pick* turns into *Picture match*
without saying anything. A child is never asked to answer a sound they can't hear.

### 4.3 आजको अभ्यास · Today's practice (spaced review)
Appears on the home screen once 4 letters are learned. It is a 6-round mix of Listen and Picture rounds,
built from the **4 learned letters with the lowest mastery plus 2 random learned letters** (so it isn't
always the same hard set). Completing it is recorded for the parent report. There is no streak and
nothing is lost for skipping a day.

### 4.4 बाह्रखरी · Barakhari (vowel signs)
- **Explorer:** pick any of the 36 consonants, tap any of the 12 forms (क का कि की कु कू के कै को कौ
  कं कः). `क + ◌ि = कि` assembles with an animation and is spoken. Each sign's Nepali name (ह्रस्व
  इकार, दीर्घ ईकार …) is shown.
- **Vowel-sign game:** hear कि (or, without a voice, see it), see क with an empty slot, and choose the
  sign. The options **always include the confusable partner** (ि/ी, ु/ू, े/ै, ो/ौ, ं/ः). This short/long
  distinction is where Nepali children actually struggle. 8 rounds; ≥ 2★ earns the ✍️ sticker.
- It uses consonants the child has already learned, or the first eight if fewer than three are learned.

### 4.5 मेरो नेपाल · My Nepal
| Mode | Interaction | Reward |
|---|---|---|
| **नक्सा · Map** | Tap any of the 7 provinces on the official map. It lifts up and Habre reads its name, capital and one fact. Kathmandu and Sagarmatha are pinned. | 🗺️ sticker when all 7 have been explored |
| **हाम्रो चिनारी · Symbols** | 9 flip cards: flag, Lali Gurans, Danfe, cow, crimson, Kathmandu, anthem, volleyball, Devanagari | 🇳🇵 sticker |
| **चाडपर्व · Festivals** | 6 flip cards: Dashain, Tihar, Holi, Chhath, Lhosar, Teej (chosen to reflect Nepal's diversity) | 🪁 sticker |
| **प्रकृति · Nature** | 8 flip cards: Himal/Pahad/Terai, Sagarmatha, Karnali, rhino, tiger, red panda | Danfe sticker |
| **प्रश्नोत्तर · Quiz** | 8 random questions from a pool of 20, each read aloud, with 3 picture answers | 🏆 sticker at ≥ 6/8 |

---

## 5. Motivation and rewards — deliberately gentle

- **Stars (1–3)** on every stop. They are always earned, never lost.
- **17 stickers** in a sticker book: 11 from the journey, 5 from My Nepal and 1 from बाह्रखरी. Each one tells a real fact
  when tapped. New stickers get a badge on the home screen.
- **Celebrations:** confetti, fanfare, Habre jumping, stars popping in one by one.
- **Avoided on purpose:** streaks and streak-loss guilt, timers, lives, loot boxes, ads, and anything
  that pressures the child to come back. These are dark patterns for young children, and Google Play's
  *Families* policy discourages them.

---

## 6. Pedagogy notes

- **Chant-based naming** ("क — कमलको क") mirrors how Nepali homes and schools teach, so parents
  recognise it and join in.
- **Look-alike distractors** (`CONFUSABLE` in `src/data/alphabet.ts`) target the real errors: ख is read
  as र+व, घ/ध, भ/म, ब/व, प/ष, ङ/ड/इ.
- **Mastery estimate** per letter (`mastery()` in `src/lib/store.ts`): 30% tracing quality + 70%
  recognition accuracy, discounted when there are few attempts. It drives review selection and the
  parent heat-map.
- **Letters that never start a word** (ङ ञ ण अः) use words that *contain* them, with the letter
  highlighted. This is the same compromise printed charts make.

---

## 7. UX principles for pre-readers

1. **Audio first, text second.** Every instruction comes from Habre's speech bubble, read aloud and
   replayed on tap. A start screen gets the first tap, so the greeting is actually heard.
2. **One decision per screen.** Huge targets (tiles ≥ 100 px, buttons ≥ 60 px), with nothing important
   near the screen edges.
3. **Physical feedback:** 3D "squishy" buttons that press down, haptics on Android, a sound on every tap.
4. **The back button never exits by accident.** Android's hardware back steps back inside the app and
   only minimises the app from the home screen.
5. **Parent zone behind a gate:** a multiplication question written in English words (e.g.
   "six × four"), which a 4–7-year-old can't solve.
6. **Respects `prefers-reduced-motion`** and shows a clear focus ring for keyboard or switch access.
7. **Shared phones:** up to 4 players, each with an animal avatar and separate progress. Children pick
   their animal; they don't need to read their name.
8. **Every screen size:** phones are never shrunk (small targets hurt young children). Tablets and
   desktops scale the whole UI up to 1.7×.

---

## 8. Art direction and sound

- **Palette:** flag crimson `#DC143C` and border blue, Tihar marigold, terrace greens, Himalayan snow
  and sky.
- **Type:** Noto Sans Devanagari 800 (Nepali forms) for letters and all Nepali text; Baloo 2 for
  English.
- **Mascot:** Habre the red panda. Red pandas live in Nepal's mountain forests, so the mascot is itself
  a fact. He wears a Dhaka-patterned topi. Moods: idle (blinks, breathes, tail sway), wave, happy
  (jump), think, oops.
- **Scenery:** layered SVG landscapes with drifting clouds and a glowing sun. Prayer flags (लुङ्दार)
  flutter on the home screen.
- **The flag** is drawn from the construction rules in Schedule 1 of the Constitution, not traced from
  an image.
- **Sound:** every effect is synthesised in real time on a pentatonic scale, so no combination sounds
  bad, there are zero audio files, and it works offline.

---

## 9. Production plan for a "premium" launch (what code can't do)

| Item | Scope | Rough effort |
|---|---|---|
| Native Nepali voice recording | 147 priority clips plus 432 optional बाह्रखरी syllables (`docs/recording-script.csv`), and about 40 instruction lines | 1 day studio + 1–2 days editing |
| Custom illustrations | 49 word pictures + 17 stickers + 23 fact cards ≈ 90, one consistent style | 3–5 weeks for one illustrator |
| Educator content review | `docs/CONTENT_REVIEW.md` | 1–2 days |
| Stroke-order data | 49 letters × hand-authored SVG strokes | 3–4 days |
| Background music | 2–3 gentle loops (madal / bansuri flavour), off by default | Commission or license |
| Play-testing | 5–8 children aged 4–8, observed, at least 2 rounds | 2 weeks |

---

## 10. Technical architecture

```
src/
  data/        alphabet.ts · barakhari.ts · journey.ts · nepal.ts · i18n.ts  ← all content, reviewable
               emoji.generated.ts · nepalMap.generated.ts                    ← built by scripts/
  lib/         store (players, progress, migrations, Android Preferences mirror) · speech (fallback chain)
               sfx (Web Audio) · trace (scoring) · router · native (back button, splash)
               scale (tablet zoom) · compat (minimum-engine gate)
  components/  Habre · Art (flag, Danfe, Pic) · Scenery · TraceCanvas · Word · UI kit
  screens/     Start · Home · Journey · Lesson · LetterGrid · Chest · games/* · barakhari/* · nepal/*
               StickerBook · ParentZone
tests/         unit (vitest) + e2e/ (Playwright)
android/       Capacitor project (bundles dist/ — fully offline)
```

- **Stack:** Preact + TypeScript + Vite. Preact was chosen over React for size: about 130 KB of
  gzipped JS in total, including all 94 pictures and the map.
- **Minimum engine:** Chrome / Android System WebView 88 (January 2021). Older engines get a bilingual
  "please update" screen rather than a half-broken game. CSS avoids features newer than that
  (no `color-mix()`, for example).
- **Offline:** the web build registers a service worker; the Android build serves files from inside the
  APK.
- **Storage:** `localStorage`, mirrored to `@capacitor/preferences` on Android so that WebView storage
  eviction can't wipe a child's progress.
- **Privacy:** no network calls, analytics or accounts. This simplifies Google Play *Families* compliance
  and COPPA/GDPR-K.
- **Performance budget:** must run smoothly on a 2 GB RAM, Android 10 phone. Only CSS transforms are
  animated. Canvas is used only for tracing and confetti.

---

## 11. Quality gates (in CI)

- **127 unit tests** (vitest):
  - Content integrity: every word contains its highlight, every picture is bundled, the journey covers
    all 49 letters exactly once in chart order, every province has a map shape.
  - Trace scoring: faithful = 3★, colouring in the box < 3★, scribbling = 0★, half a letter < 3★.
  - Save migration (v1 → v2), player isolation, reset and limits.
  - Review planning, the picture-match blank, and बाह्रखरी (all 12 forms; the confusable partner is
    always offered).
- **10 end-to-end tests** (Playwright, against the production build):
  - Every screen renders with no console errors.
  - A full lesson with real tracing; balloon, memory, vowel-sign and practice games played to the end.
  - Picture match never hides a vowel sign; siblings keep separate progress; the map sticker is earned.
  - No sideways scroll at 360×640.
- A web build, a single-file build and an **Android debug APK** on every push
  (`.github/workflows/build.yml`).

---

## 12. Roadmap

| Version | Content |
|---|---|
| 0.1 | 49 letters, trace, 4 mini-games, journey, map, 3 fact decks, quiz, stickers, parent zone, Android project |
| **0.2 (this build)** | Audit fixes (§0b), start screen, sibling profiles, Today's practice, बाह्रखरी explorer + vowel-sign game, live trace meter, tablet scaling, e2e tests |
| 0.3 — "Premium pass" | Recorded voice, custom illustrations, stroke-order animation, music, play-test fixes. *Needs people and budget, not code.* |
| 0.4 — Words and numbers | बाह्रखरी tracing, Nepali numerals ०–९ with counting, then 2–3-letter words (घर, कलम, माछा) |
| 1.0 — Launch | Google Play (Designed for Families), web PWA, a school/NGO edition |

---

## 13. Open questions (answer before investing in the premium pass)

1. **Who is the first paying customer:** diaspora parents, Nepali private schools, or an NGO? Interview
   10 of each.
2. Does a 4-year-old understand "trace" without a demonstration? *Watch real children.*
3. Is "Picture match" confusing for words where the letter isn't first (रङ, बाण), or where a vowel sign
   sits on a dotted circle (`◌ाता`)? *Watch children with these specific rounds.*
4. Is portrait-only right for tablets used at school? (Android 16 ignores orientation locks on large
   screens anyway.)
5. Instruction language: is Nepali default + English toggle enough, or do Maithili- and
   Bhojpuri-speaking families need their own instruction voice?
6. Do siblings actually switch players, or does the youngest always play as the eldest? If they don't
   switch, profiles add a tap for nothing.
