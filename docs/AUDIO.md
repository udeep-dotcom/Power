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

## How to add the files
1. Export each clip as **mono MP3, 64–96 kbps, 44.1 kHz**, named by `clip_id`, e.g. `chant-ka.mp3`.
2. Put the files in `public/audio/`.
3. List the ids in `public/audio/manifest.json`:
   ```json
   { "clips": ["letter-ka", "word-ka", "chant-ka", "..."] }
   ```
4. Rebuild. Any clip in the manifest is played instead of TTS. Missing clips still fall back to TTS,
   so you can add them gradually.

Size: 147 short clips at 64 kbps come to about 1.5–2.5 MB; all 579 come to about 6–8 MB. Both are fine inside the APK.

## Fallback order (for reference)
recorded clip → Android native TTS (`ne-NP`, then `hi-IN`) → browser `speechSynthesis` with a Nepali or
Hindi voice → silent (games switch to picture prompts). See `src/lib/speech.ts`.
