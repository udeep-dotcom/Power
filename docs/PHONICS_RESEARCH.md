# Phonics & pronunciation — research notes (v0.4)

**Brief:** "teach phonetics and pronunciation of Nepali and English alphabets. Research some top apps
and integrate."

This file records what was studied, what was **adopted**, what was **rejected and why**, and the
weaknesses that remain. Sources are listed at the end. Where research figures come from different
studies and corpora, this says so; they are not directly comparable.

---

## 1. What the leading apps do

| App / method | What it does well | Taken into अक्षर यात्रा | Not taken (and why) |
|---|---|---|---|
| **Jolly Phonics** (synthetic phonics, UK) | 42 sounds in 7 groups, starting **s a t i p n** so children can read real words (*sat, pin, tap*) within days. **One action per sound** (snake for *s*, ticking clock for *t*). Sound before letter name. | English letters taught in 5 groups starting **s a t p i n**. Every letter has a **sound button first**, the name second, and an **action** written for a Nepali child ("सर्पजस्तै: स्स्स्"). | The 42-sound set (sh, ch, th, ai, oa …) and tricky words. That's v0.5, after the 26 single letters are solid. We wrote our own actions rather than copy Jolly's (they're Jolly Learning's published material). |
| **Google Read Along** (began as *Bolo*, India, Hindi + English) | A friendly in-app guide (Diya). Listens while a child reads aloud. **Speech is analysed on the device, works offline, and voice data isn't sent to servers.** No ads. | The **privacy posture**: our mic feature records on-device only, never uploads or saves, and switches the mic off after each 2-second clip. Habre already plays Diya's role. | **Speech-recognition scoring.** See §3. Read Along scores *reading a known sentence* with a model trained on that language. No such model exists for 3-year-olds speaking Nepali. |
| **ELSA Speak** (adult English pronunciation) | Phoneme-level feedback, with **mouth and tongue guidance** for each sound. | The **mouth diagram**: a side-view head that shows *where* each Nepali sound is made, whether air puffs (🕯️ flame), whether the throat buzzes (🐝), whether it goes through the nose (👃). | Percentage scores and red/green phoneme marking. That's an adult tool; for a 4-year-old, a red mark on a sound they can't yet make is discouragement, not feedback. |
| **Reading Rockets / onset–rime research** | Blending is easier with **bigger chunks first** (syllables, then onset + rime *c + at*), then single phonemes (*c-a-t*). | **Blend game** uses onset + rime for ages 3–4 and every sound for ages 5–6 (read from the age setting). Nepali blends by **अक्षर** (क-म-ल), because the script is syllabic. | — |
| **Phonics app round-ups** (Brighterly and others) | Short sessions, picture choices, immediate audio, no reading needed to play. | Already true of the app since v0.3. | We only skimmed these lists. They are marketing round-ups, not evidence. |

---

## 2. What is specific to Nepali (and to Nepali children learning English)

1. **The Nepali alphabet is already a phonetics chart.** The वर्ग rows are *places* in the mouth
   (throat → palate → tongue-turned-up → teeth → lips), and the columns are *how* the sound is made
   (little air, big puff, buzz, buzz + puff, nose). English has nothing like it. The **मुखको नक्सा
   (mouth map)** shows that structure directly: tap any letter and the head lights up the place, the
   flame blows for महाप्राण, the bee buzzes for घोष.
2. **Aspiration and voicing are four-way:** क ख ग घ. English has no breathy-voiced sounds (घ झ ढ ध भ),
   so children growing up abroad often merge them (भात → "baat"). **Minimal pairs** such as
   बात/भात, पुल/फूल and काम/खाम practise exactly this.
3. **Two kinds of "t" and "d":** dental त द vs retroflex ट ड. English t/d fall between them. Loanword
   research finds speakers of Indo-Aryan languages hear English t/d as **retroflex**, which is why
   "tomato" is written टमाटर. In the app, English **t ≈ ट** and **d ≈ ड** are marked *close*, never
   *same*. The pairs दाल/डाल and तीन/टिन train the Nepali contrast.
4. **ि/ी and ु/ू differ in spelling, not in sound.** Modern spoken Nepali has no vowel-length
   contrast: कि and की sound the same. *See §4: this was a bug in our own earlier version.*
5. **श ष स are all said "sa"** in everyday Nepali. The mouth map places all three together and says
   so, rather than teaching three different sounds no one uses.
6. **The final अ is dropped in speech:** क-म-ल is said *kamal*, not *kamala*. The blend game says
   the whole word after the parts so children hear the real form.
7. **English sounds with no Nepali letter:** f, v, z, th. v and w both map to व, which is why
   *vest/west* is a minimal pair. An "Only in English" card says this plainly. An "Only in Nepali"
   card names घ झ ढ ध भ and the two t's, so children abroad learn their Nepali has sounds English
   doesn't.

---

## 3. The big decision: no automatic pronunciation scoring (for now)

**Evidence.** Speech recognition is much less accurate on children than on adults, and worst for the
youngest:
- One study reports word error rates of about 40% on children's read speech (CSLU Kids) against under
  2% on adult read speech.
- A preschool-classroom study reports a best word error rate of 57.8% for 3–5-year-olds.
- A 2025 causal analysis finds age (physiology) to be among the largest factors.
- Training data for children under 5 is very scarce, and almost nonexistent for Nepali.

These figures come from different corpora and tasks, so they aren't directly comparable, but they
point the same way.

**The counter-evidence, honestly.** The same literature finds recognition is much better on **short,
scripted prompts**, and "say *kamal*" is exactly that. So scoring isn't impossible. It's
**unproven for this audience and language**, and a false "wrong!" teaches a 3-year-old to stop
trying.

**What we built instead: मेरो आवाज (record-and-compare).** Tap 🎤:
1. Habre says it.
2. The child says it while a 2-second red dot shows.
3. They hear **their own voice** and then Habre's again.

Self-monitoring like this works at any age and needs no model. It is fully on-device: nothing is
uploaded or saved, and the mic is on only while the red dot shows. Parents can turn it off in the
Parent Zone.

**When to revisit:** for ages 5–6 only, with a small on-device keyword-spotting model, and with
**positive feedback only** (celebrate a match, stay silent on a miss). Test it on real children first.

---

## 4. A correction to our own earlier version

The v0.2 vowel-sign game **asked children to tell ि from ी (and ु from ू) by ear.** The design doc
called it "where Nepali children actually struggle". That was wrong. The difficulty is **spelling**,
not hearing, because spoken Nepali doesn't distinguish them. A listening round with both कि and की as
options has two correct answers, and the child is marked wrong for hearing correctly.

**Fixed in v0.4:**
- Listening rounds now use **audio partners**: ि is paired with े, and ु with ो, sounds that really
  do differ.
- The same-sound twin is never offered alongside.
- Reading rounds (where the child sees the sign) still include ि/ी, because that's a spelling skill.
- The बाह्रखरी explorer shows a note when you pick ि ी ु ू: "these sound the same; only the spelling
  differs".
- A unit test guarantees a listening round never offers both twins.

---

## 5. What shipped in v0.4

| Feature | Where | Evidence it rests on |
|---|---|---|
| **मुखको नक्सा:** mouth map with the वर्ग table, air/buzz/nose cues, slow button and mic | ध्वनि → मुखको नक्सा; also chips on every letter lesson | §2.1; ELSA-style articulation guidance |
| **ए बी सी:** 26 English letters in 5 groups. Sound, name, IPA, key word, action, Nepali "friend", mic | Home → ए बी सी | Jolly Phonics order and actions |
| **जोडेर पढौं:** blend game. Slide a finger along the arrow; parts light up and run together | ध्वनि and ए बी सी | Reading Rockets / onset–rime progression |
| **कान खोलेर सुन:** minimal pairs (5 Nepali, 6 English), with a hint after each answer | ध्वनि and ए बी सी | §2.2–2.3, §2.7 |
| **आवाज खोज:** hear a sound and find the picture that starts with it (never c and k together) | ए बी सी | Phonemic awareness, "first sound" |
| **ध्वनि साथी:** English sounds with their Nepali friends (= same, ≈ close), plus "only in" cards, plus a game | ध्वनि and ए बी सी | §2.3, §2.7. Turns a bilingual child's Nepali into an asset for English |
| **🐢 slow speech** everywhere a sound is played | All phonics screens | A design choice so each part can be heard. Not a research claim |
| **मेरो आवाज:** record-and-compare | Lessons, mouth map, ABC | §3 |
| 5 new stickers (👄 🔤 🧩 👂 🤝), parent report line, mic switch | Sticker book, Parent Zone | — |

---

## 6. Weaknesses that remain (read before launch)

1. **Text-to-speech can't say a pure sound.** Asked for *t*, TTS says "tuh" or "tee". Phonics
   teachers specifically warn against the added "uh", because it makes blending harder (*tuh-a-puh* ≠
   *tap*). **Until real recordings exist, the English sound buttons model stop consonants slightly
   wrong.** This is the most important gap. Fix: the 125 priority-3 clips in
   `docs/recording-script.csv`, read by a native English speaker following the notes ("no *uh*").
2. **Which English accent?** Children in the UK, US and Australia learn different vowels. Record in
   the accent of the schools most families use, or offer two.
3. **Descriptive vs textbook places.** We show where sounds are made *in today's speech*: श/ष with स,
   and र at the teeth. Nepali school books teach the Sanskrit उच्चारण-स्थान (ष मूर्धन्य, श तालव्य).
   A teacher may object. The trade-off is flagged in `docs/CONTENT_REVIEW.md` §10a for a decision.
4. **The mouth diagram is schematic** and hasn't been checked by a speech-language therapist.
5. **The mic on the web** needs a permission prompt. It works in current Chrome, Edge, Firefox and
   Safari (MediaRecorder); on Android, `RECORD_AUDIO` is requested at first use. On devices without
   either, the mic button simply doesn't appear.
6. **No evidence yet that any of this works for *these* children.** Before investing in recordings,
   watch 5–10 children (ages 3–6, in Nepal and abroad) use the blend and minimal-pair games. Measure
   first-try accuracy on a few pairs before and after a week.

---

## Sources

- Jolly Phonics: [Jolly Learning — Jolly Phonics](https://www.jollylearning.co.uk/jolly-phonics-) ·
  [Jolly Phonics (US)](https://jollylearning.com/en-us/our-programs/jolly-phonics) ·
  [Structural Learning — Jolly Phonics teacher's guide](https://www.structural-learning.com/post/jolly-phonics-teachers-guide-synthetic) ·
  [Nat Geo Kids — Group 1: s a t i p n](https://natgeokids.com/uk/primary-resource/group-1-satipn-phonics-primary-resource) ·
  [Teachwire — Jolly Phonics actions](https://teachwire.net/teaching-resources/jolly-phonics-actions-sheet-english-resource-for-eyfs-to-ks1)
- Google Read Along: [Google blog — Read Along](https://blog.google/outreach-initiatives/education/early-access-read-along/) ·
  [Android Developers — on-device ML design insights](https://android-developers.googleblog.com/2020/06/on-device-ML-design-insights.html) ·
  [Android Central — no ads, no IAPs](https://www.androidcentral.com/no-ads-no-iaps-googles-new-read-along-app-designed-appeal-privacy-conscious-parents) ·
  [TechCrunch — launch](https://techcrunch.com/2020/05/07/google-launches-read-along-a-free-app-that-helps-young-children-practice-reading)
- ELSA Speak: [ELSA — feedback](https://blog.elsaspeak.com/en/advantage-of-elsa-feedback) ·
  [ELSA — mouth positions](https://elsaspeak.com/en/learn-english/how-to-pronounce/mouth) ·
  [Headway — ELSA review](https://makeheadway.com/blog/elsa-speak-review/)
- Blending and onset–rime: [Reading Rockets — blending sounds in syllables](https://www.readingrockets.org/helping-all-readers/looking-reading-interventions/blending-sounds-syllables-autumn-kindergartner) ·
  [Reading Universe — onset–rime](https://readinguniverse.org/skill-explainer/onset-rime/onset-rime-skill/onset-rime-resource-hub-for-teachers)
- App round-ups: [Brighterly — best phonics apps](https://brighterly.com/blog/best-phonics-apps-for-kids/)
- Children's speech recognition: [Causal analysis of ASR errors for children (arXiv 2502.08587)](https://arxiv.org/html/2502.08587v1) ·
  [On the difficulties of ASR for kindergarten-aged children (Interspeech 2018)](https://www.isca-archive.org/interspeech_2018/yeung18_interspeech.html) ·
  [Automated analysis of naturalistic recordings in early childhood (arXiv 2509.18235)](https://arxiv.org/pdf/2509.18235) ·
  [Transfer learning from adult to children for ASR (arXiv 1805.03322)](https://arxiv.org/pdf/1805.03322) ·
  [End-to-end neural systems for children's ASR (arXiv 2102.09918)](https://arxiv.org/pdf/2102.09918)
- Nepali phonetics: [Khatiwada, "Nepali" — Journal of the IPA](https://www.cambridge.org/core/journals/journal-of-the-international-phonetic-association/article/nepali/A887820E3B1293EFD43FBD3259D41F73) ·
  [Wikipedia — Nepali phonology](https://en.wikipedia.org/wiki/Nepali_phonology) ·
  [nepalilanguage.org — pronunciation](https://nepalilanguage.org/pronounce/) ·
  [nepalilanguage.org — ह्रस्व/दीर्घ](https://nepalilanguage.org/orthography/raswa-dirgha/) ·
  [Hindi Script — retroflex and dental](https://iu.pressbooks.pub/hindiscript/?p=254)
- English loanwords in Indo-Aryan: [The adaptation of English coronals into Indian languages (Linguistics in Amsterdam)](https://linguisticsinamsterdam.nl/article/view/26183)
