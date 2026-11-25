// Phonics content checks (v0.4): every English letter, sound friend, minimal pair and blend word
// must point at real letters and bundled pictures, and the round planners must never ask a child
// to tell apart two answers that SOUND the same.
import { describe, expect, it } from 'vitest';
import { LETTERS, LETTER_BY_ID } from '../src/data/alphabet';
import { EMOJI } from '../src/data/emoji.generated';
import { BLEND_WORDS, COLUMN_FEATURES, EN_BY_ID, EN_LETTERS, MINIMAL_PAIRS, PLACE_LABEL, VARGAS, soundInfo } from '../src/data/phonics';
import { FRIENDS, planFriends, planHunt } from '../src/screens/sounds/PhonicsGames';
import { RIME_SAY } from '../src/screens/sounds/Blend';

const SPECIAL = /^(flag|hex|danfe|habre|txt:.+|swatch:#[0-9a-fA-F]{6})$/;
const picOk = (pic: string) => SPECIAL.test(pic) || pic in EMOJI;

describe('English letters', () => {
  it('covers a–z once each, in five teaching groups', () => {
    expect(EN_LETTERS.map((l) => l.id).sort().join('')).toBe('abcdefghijklmnopqrstuvwxyz');
    for (const l of EN_LETTERS) {
      expect(l.lower).toBe(l.id);
      expect(l.upper).toBe(l.id.toUpperCase());
      expect([1, 2, 3, 4, 5]).toContain(l.group);
    }
  });
  it('starts with the Jolly Phonics first six: s a t p i n', () => {
    expect(EN_LETTERS.filter((l) => l.group === 1).map((l) => l.id)).toEqual(['s', 'a', 't', 'p', 'i', 'n']);
  });
  it.each(EN_LETTERS.map((l) => [l.id, l] as const))('%s: picture bundled, key word has the letter where it says', (_, l) => {
    expect(picOk(l.pic)).toBe(true);
    if (l.pos === 'end') expect(l.word.endsWith(l.id)).toBe(true);
    else expect(l.word.startsWith(l.id)).toBe(true);
    expect(l.ipa).toMatch(/^\/.+\/$/);
    expect(l.action.ne.length).toBeGreaterThan(0);
  });
  it('sound friends point at real Nepali letters and say how close they are', () => {
    for (const l of EN_LETTERS) {
      if (!l.friend) { expect(l.friendHow).toBeUndefined(); continue; }
      expect(LETTER_BY_ID[l.friend], l.id).toBeDefined();
      expect(['same', 'close']).toContain(l.friendHow);
    }
  });
  it('English t and d are only "close" to ट/ड — never claimed to be the same sound', () => {
    expect(EN_BY_ID.t).toMatchObject({ friend: 'tta', friendHow: 'close' });
    expect(EN_BY_ID.d).toMatchObject({ friend: 'dda', friendHow: 'close' });
  });
});

describe('Nepali sound map (वर्ग)', () => {
  it('five rows of five real consonants, each row with a label', () => {
    expect(VARGAS).toHaveLength(5);
    expect(COLUMN_FEATURES).toHaveLength(5);
    for (const v of VARGAS) {
      expect(v.letters).toHaveLength(5);
      v.letters.forEach((id) => expect(LETTER_BY_ID[id]?.kind, id).toBe('consonant'));
      expect(PLACE_LABEL[v.id]).toBeDefined();
    }
  });
  it('every consonant has a place; only the nasal column goes through the nose', () => {
    for (const l of LETTERS.filter((x) => x.kind === 'consonant')) {
      const s = soundInfo(l.id);
      expect(s?.place, l.id).toBeDefined();
    }
    for (const v of VARGAS) v.letters.forEach((id, i) => expect(soundInfo(id)!.nose).toBe(i === 4));
  });
  it('aspirates (ख घ …) have air; voiced (ग घ …) buzz', () => {
    expect(soundInfo('kha')).toMatchObject({ place: 'throat', air: true, buzz: false });
    expect(soundInfo('bha')).toMatchObject({ place: 'lips', air: true, buzz: true });
    expect(soundInfo('da')).toMatchObject({ place: 'teeth', air: false, buzz: true });
    expect(soundInfo('dda')).toMatchObject({ place: 'roof' });
  });
  it('श ष स get the same features (they sound the same in Nepali)', () => {
    expect(soundInfo('sha')).toEqual(soundInfo('sa'));
    expect(soundInfo('ssa')).toEqual(soundInfo('sa'));
  });
  it('vowels have no consonant place', () => {
    for (const l of LETTERS.filter((x) => x.kind === 'vowel')) expect(soundInfo(l.id)).toBeNull();
  });
});

describe('Minimal pairs', () => {
  it.each(MINIMAL_PAIRS.map((p) => [p.id, p] as const))('%s: two different words with different, bundled pictures', (_, p) => {
    expect(p.a.word).not.toBe(p.b.word);
    expect(p.a.pic).not.toBe(p.b.pic);
    expect(picOk(p.a.pic)).toBe(true);
    expect(picOk(p.b.pic)).toBe(true);
    expect(p.feature.ne.length).toBeGreaterThan(0);
  });
  it('the two words are the same length ± one character (they differ in one sound)', () => {
    for (const p of MINIMAL_PAIRS) expect(Math.abs([...p.a.word].length - [...p.b.word].length), p.id).toBeLessThanOrEqual(1);
  });
  it('has enough pairs in both languages for a 6-round game', () => {
    expect(MINIMAL_PAIRS.filter((p) => p.lang === 'ne').length).toBeGreaterThanOrEqual(4);
    expect(MINIMAL_PAIRS.filter((p) => p.lang === 'en').length).toBeGreaterThanOrEqual(4);
  });
  it('never pairs ि with ी or ु with ू alone — those differ in spelling, not sound', () => {
    const strip = (w: string) => w.replace(/ी/g, 'ि').replace(/ू/g, 'ु');
    for (const p of MINIMAL_PAIRS.filter((x) => x.lang === 'ne')) expect(strip(p.a.word), p.id).not.toBe(strip(p.b.word));
  });
});

describe('Blend words', () => {
  it.each(BLEND_WORDS.map((w) => [w.id, w] as const))('%s: parts join back into the word; picture bundled', (_, w) => {
    expect(w.phonemes.join('')).toBe(w.word);
    expect(w.chunks.join('')).toBe(w.word);
    expect(w.chunks.length).toBeLessThanOrEqual(w.phonemes.length);
    expect(picOk(w.pic)).toBe(true);
  });
  it('no two words in one language share a picture (the picture check would be ambiguous)', () => {
    for (const lang of ['ne', 'en'] as const) {
      const pics = BLEND_WORDS.filter((w) => w.lang === lang).map((w) => w.pic);
      expect(new Set(pics).size).toBe(pics.length);
    }
  });
  it('every English sound part is a letter we can say; every 2+ letter rime is a word TTS reads', () => {
    for (const w of BLEND_WORDS.filter((x) => x.lang === 'en')) {
      w.phonemes.forEach((p) => expect(EN_BY_ID[p], `${w.word}:${p}`).toBeDefined());
      // rimes like "at", "un", "ig" read fine; the ones TTS spells out letter by letter are mapped
      for (const c of w.chunks.filter((c) => c.length > 1)) {
        const said = RIME_SAY[c] ?? c;
        expect(said, `${w.word}:${c}`).toMatch(/^[a-z]+$/);
      }
    }
  });
  it('has enough words per language for five rounds with distractors', () => {
    expect(BLEND_WORDS.filter((w) => w.lang === 'ne').length).toBeGreaterThanOrEqual(8);
    expect(BLEND_WORDS.filter((w) => w.lang === 'en').length).toBeGreaterThanOrEqual(8);
  });
});

describe('Round planners never offer two answers that sound the same', () => {
  it('sound hunt: no c+k together, no x (it is heard at the end of "fox")', () => {
    for (let k = 0; k < 200; k++) {
      for (const choices of [2, 3, 4]) {
        const rounds = planHunt(choices);
        expect(rounds).toHaveLength(6);
        for (const r of rounds) {
          expect(r.options.map((o) => o.id)).toContain(r.target.id);
          expect(r.options).toHaveLength(choices);
          expect(new Set(r.options.map((o) => o.soundSay)).size).toBe(r.options.length);
          expect(r.options.map((o) => o.id)).not.toContain('x');
          expect(new Set(r.options.map((o) => o.pic)).size).toBe(r.options.length);
        }
      }
    }
  });
  it('friends game: distinct Nepali options, the right friend exactly once, one letter per friend', () => {
    for (let k = 0; k < 200; k++) {
      const rounds = planFriends(3);
      expect(rounds).toHaveLength(6);
      expect(new Set(rounds.map((r) => r.letter.friend)).size).toBe(6);
      for (const r of rounds) {
        expect(new Set(r.options).size).toBe(r.options.length);
        expect(r.options.filter((o) => o === r.letter.friend)).toHaveLength(1);
        expect(r.options).toHaveLength(3);
      }
    }
  });
  it('friends are consonants only (English vowels only roughly match Nepali ones)', () => {
    for (const l of FRIENDS) expect(LETTER_BY_ID[l.friend!].kind).toBe('consonant');
  });
});
