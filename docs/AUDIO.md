# Recorded audio (strongly recommended before launch)

Text-to-speech for Nepali is serviceable at best. Letter names spoken alone ("ङ", "अः") are where TTS
is weakest, and those are exactly the sounds children must learn. A native speaker's voice is the
single biggest quality upgrade available.

## What to record
`docs/recording-script.csv` lists **236 priority clips**: 49 letters × 3 (the letter name, the example
word, and the chart chant "क, कमलको क"), 48 first words, 10 numbers and all 31 story pages (ids like
`story-valley-1`, read in a slow, warm storyteller voice). They are followed by **432 optional बाह्रखरी
syllables** (36 consonants ×
12 forms, ids like `syl-ka-i`). Text-to-speech reads whole syllables far better than lone letters, so
record the priority clips first. Regenerate the list after content changes:

```bash
node scripts/gen-recording-script.ts
```

Direction for the voice artist: warm, smiling, unhurried. Leave about 150 ms of silence at each end.
Use the standard Nepali pronunciation taught in schools (e.g. श/ष/स are all commonly said "sa").

## Phonics clips (priority 3, v0.4): two voices
The last **125 clips** are for the sounds features. They need **two** people:

| Ids | Voice | What to say | Watch out for |
|---|---|---|---|
| `mp-<pair>-a/b` (e.g. `mp-bat-bhat-b` = भात) | the Nepali voice | one word of a minimal pair | Say **only** that word. Make the difference natural, not exaggerated: the child must learn to hear real speech. |
| `w-blend-ne-*` | the Nepali voice | the blend word (कमल) | Natural speed; the app plays it slowed down itself. |
| `en-s-<letter>` | a **native English** voice | the letter's **sound** | **No "uh"**: say "sss" not "suh", "mmm" not "muh". Stops (t p k b d g) short and crisp. This is the single most important English recording, because text-to-speech can't do it. |
| `en-n-<letter>` | English voice | the letter's **name** ("bee") | — |
| `en-w-<word>` | English voice | key words, blend words, minimal-pair words | — |
| `en-r-<rime>` | English voice | the rime ("-at", "-og") | One syllable; never spelled out. |

Pick **one English accent**, the one used in the schools most of your families attend (UK, US or
Australian), and keep it for every English clip. Ids are ASCII on purpose: Devanagari file names get
mangled by some export tools and operating systems.

## How to add the files
1. Export each clip as **mono MP3, 64–96 kbps, 44.1 kHz**, named by `clip_id`, e.g. `chant-ka.mp3`.
2. Put the files in `public/audio/`.
3. List the ids in `public/audio/manifest.json`:
   ```json
   { "clips": ["letter-ka", "word-ka", "chant-ka", "..."] }
   ```
4. Rebuild. Any clip in the manifest is played instead of TTS. Missing clips still fall back to TTS,
   so you can add them gradually.

Size: the 236 priority clips at 64 kbps come to about 2.5–3.5 MB; all 793 come to about 8–11 MB. Both are fine inside the APK.

## Fallback order (for reference)
recorded clip → Android native TTS (`ne-NP`, then `hi-IN`) → browser `speechSynthesis` with a Nepali or
Hindi voice → silent (games switch to picture prompts). English clips (`en-*`) fall back to an English
TTS voice. The 🐢 slow button plays recorded clips at 0.7× speed and asks TTS for a slower rate. See
`src/lib/speech.ts`.
