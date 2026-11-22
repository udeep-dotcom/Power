// Content integrity: catches the mistakes that are easy to make when editing data files
// (a typo'd letter id, a picture with no bundled image, a highlight not found in its word).
import { describe, expect, it } from 'vitest';
import { CONFUSABLE, LETTERS, LETTER_BY_ID } from '../src/data/alphabet';
import { EMOJI } from '../src/data/emoji.generated';
import { JOURNEY, STICKERS, STICKER_BY_ID, UNITS } from '../src/data/journey';
import { DECKS, PROVINCES, QUIZ } from '../src/data/nepal';
import { PLACE_XY, PROVINCE_SHAPES } from '../src/data/nepalMap.generated';

const SPECIAL = /^(flag|hex|danfe|habre|txt:.+|swatch:#[0-9a-fA-F]{6})$/;
const picOk = (pic: string) => SPECIAL.test(pic) || pic in EMOJI;

describe('alphabet', () => {
  it('has 13 vowels and 36 consonants (incl. क्ष त्र ज्ञ)', () => {
    expect(LETTERS.filter((l) => l.kind === 'vowel')).toHaveLength(13);
    expect(LETTERS.filter((l) => l.kind !== 'vowel')).toHaveLength(36);
  });
  it('has unique ids and characters', () => {
    expect(new Set(LETTERS.map((l) => l.id)).size).toBe(LETTERS.length);
    expect(new Set(LETTERS.map((l) => l.char)).size).toBe(LETTERS.length);
  });
  it.each(LETTERS.map((l) => [l.char, l] as const))('%s: highlight is in the word and picture is bundled', (_, l) => {
    expect(l.word).toContain(l.hl);
    expect(picOk(l.pic)).toBe(true);
  });
  it('confusable pairs reference real letters', () => {
    for (const [k, vs] of Object.entries(CONFUSABLE)) {
      expect(LETTER_BY_ID[k]).toBeDefined();
      vs.forEach((v) => expect(LETTER_BY_ID[v]).toBeDefined());
    }
  });
});

describe('journey', () => {
  it('teaches every letter exactly once, in chart order', () => {
    const order = UNITS.flatMap((u) => u.letters);
    expect(order).toEqual(LETTERS.map((l) => l.id));
  });
  it('every unit has a game and a valid sticker; stops = letters + 2 per unit', () => {
    UNITS.forEach((u) => expect(STICKER_BY_ID[u.sticker]).toBeDefined());
    expect(JOURNEY).toHaveLength(LETTERS.length + UNITS.length * 2);
  });
  it('sticker pictures are bundled', () => STICKERS.forEach((s) => expect(picOk(s.pic)).toBe(true)));
});

describe('my nepal', () => {
  it('has 7 provinces, each with a map shape and capital pin', () => {
    expect(PROVINCES).toHaveLength(7);
    for (const p of PROVINCES) {
      expect(PROVINCE_SHAPES[p.id]?.fill.length).toBeGreaterThan(100);
      expect(PROVINCE_SHAPES[p.id]?.line.startsWith('M')).toBe(true);
      expect(PLACE_XY[p.capitalPlace]).toBeDefined();
    }
  });
  it('deck and quiz pictures are bundled; quiz answers are valid', () => {
    DECKS.forEach((d) => d.cards.forEach((c) => expect(picOk(c.pic)).toBe(true)));
    QUIZ.forEach((q) => {
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      q.options.forEach((o) => expect(picOk(o.pic)).toBe(true));
    });
  });
  it('every deck has a sticker', () => DECKS.forEach((d) => expect(STICKER_BY_ID[d.id]).toBeDefined()));
});
