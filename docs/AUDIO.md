# Recorded audio (required for a premium app)

## Two ways to get real voices
1. **The Voice Studio (in the app).** Parent zone → 🎙️ Voice Studio. A family member records line by
   line, in priority order. Each take is trimmed, levelled and faded on the device and **used in the
   app on that phone at once** (stored in IndexedDB, never uploaded). **Export** downloads a zip of
   WAVs plus a manifest. *(Inside the Android app, export isn't available yet: record in the web
   version to export.)*
2. **A professional voice artist** reads `docs/recording-script.csv` (897 lines: voice, priority,
   group, text, direction for each).

Either way, bundle the files for every family:
```bash
node scripts/import-voices.mjs akshar-yatra-voices-2026-11-25.zip   # or a folder of <clip_id>.wav/.mp3/.m4a
```
It converts each clip with ffmpeg to mono MP3 (64 kbps, loudness −18 LUFS), writes
`public/audio/<clip_id>.mp3`, updates `public/audio/manifest.json`, and skips ids that aren't in
`src/data/clips.ts`. Order of use at runtime: **this device's studio recording → bundled recording →
text-to-speech**. English phonics sounds (`en-s-*`) never fall back to text-to-speech. Without them
the sound button plays the key word, and the games that need pure sounds stay locked.


Text-to-speech for Nepali is serviceable at best. Letter names spoken alone ("ङ", "अः") are where TTS
is weakest, and those are exactly the sounds children must learn. A native speaker's voice is the
single biggest quality upgrade available.

## What to record
`docs/recording-script.csv` (generated from `src/data/clips.ts`, 897 lines) starts with Habre's 37 spoken lines, then **236 letter/word/number/story clips**: 49 letters × 3 (the letter name, the example
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
| `en-s-<letter>` | a **UK English** voice | the letter's **sound** | **No "uh"**: say "sss" not "suh", "mmm" not "muh". Stops (t p k b d g) short and crisp. This is the single most important English recording, because text-to-speech can't do it. |
| `en-n-<letter>` | UK English voice | the letter's **name** ("bee") | UK names: **zed**, **aitch** |
| `en-w-<word>` | UK English voice | key words, blend words, minimal-pair words | — |
| `en-r-<rime>` | UK English voice | the rime ("-at", "-og") | One syllable; never spelled out. |

**Accent: UK English** (decided): standard Southern British, as heard in UK primary-school phonics
lessons. Keep the same speaker for every English clip. Watch the short vowels: *a* as in *apple* (not
the *ah* of *father*), *o* as in *hot*. Ids are ASCII on purpose: Devanagari file names get
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

Size: the ~300 priority-1 clips at 64 kbps come to about 3–4 MB; all 897 come to about 10–13 MB. Both are fine inside the APK.

## Fallback order (for reference)
recorded clip → Android native TTS (`ne-NP`, then `hi-IN`) → browser `speechSynthesis` with a Nepali or
Hindi voice → silent (games switch to picture prompts). English clips (`en-*`) fall back to an English
TTS voice. The 🐢 slow button plays recorded clips at 0.7× speed and asks TTS for a slower rate. See
`src/lib/speech.ts`.
