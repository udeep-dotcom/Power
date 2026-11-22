import { describe, expect, it } from 'vitest';
import { EMOJI } from '../src/data/emoji.generated';
import { STICKERS, STICKER_BY_ID, stickerGroup } from '../src/data/journey';
import { COUNTABLES, NUMBERS } from '../src/data/numbers';
import { STORIES } from '../src/data/stories';
import { ALL_WORDS, WORD_TOPICS } from '../src/data/words';
import { UI } from '../src/data/i18n';
import { levelFor } from '../src/lib/level';
import { flagIsCorrect, PAGES, PALETTE } from '../src/screens/play/Colouring';

const SPECIAL = /^(flag|hex|danfe|habre|txt:.+|swatch:#[0-9a-fA-F]{6})$/;
const picOk = (pic: string) => SPECIAL.test(pic) || pic in EMOJI;

describe('words (शब्द)', () => {
  it('has 6 topics × 8 words, unique ids, bundled pictures, Nepali text', () => {
    expect(WORD_TOPICS).toHaveLength(6);
    WORD_TOPICS.forEach((t) => expect(t.words).toHaveLength(8));
    expect(new Set(ALL_WORDS.map((w) => w.id)).size).toBe(ALL_WORDS.length);
    ALL_WORDS.forEach((w) => {
      expect(picOk(w.pic), w.id).toBe(true);
      expect(w.ne).toMatch(/[ऀ-ॿ]/);
    });
  });
  it('no two words in a topic share a picture (the listening game would be ambiguous)', () => {
    WORD_TOPICS.forEach((t) => expect(new Set(t.words.map((w) => w.pic)).size).toBe(t.words.length));
  });
  it('every topic has a sticker', () => WORD_TOPICS.forEach((t) => expect(STICKER_BY_ID[`w-${t.id}`]).toBeDefined()));
});

describe('numbers (अङ्क)', () => {
  it('१–१० in order with Nepali digits', () => {
    expect(NUMBERS.map((n) => n.digit).join(' ')).toBe('१ २ ३ ४ ५ ६ ७ ८ ९ १०');
    NUMBERS.forEach((n, i) => expect(n.n).toBe(i + 1));
    COUNTABLES.forEach((c) => expect(picOk(c.pic)).toBe(true));
  });
});

describe('stories (कथा)', () => {
  it('6 stories, 5–6 pages each, short sentences, scenes within bounds, stickers exist', () => {
    expect(STORIES).toHaveLength(6);
    for (const st of STORIES) {
      expect(st.pages.length).toBeGreaterThanOrEqual(5);
      expect(st.pages.length).toBeLessThanOrEqual(6);
      expect(STICKER_BY_ID[st.sticker], st.id).toBeDefined();
      for (const p of st.pages) {
        expect(p.text.ne.length, `${st.id}: "${p.text.ne}"`).toBeLessThanOrEqual(70); // one short sentence for a 3–6-year-old
        expect(p.text.en.length).toBeGreaterThan(0);
        for (const [pic, x, y, size] of p.items) {
          expect(picOk(pic), `${st.id} ${pic}`).toBe(true);
          expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThanOrEqual(100);
          expect(y).toBeGreaterThanOrEqual(0); expect(y).toBeLessThanOrEqual(100);
          expect(size).toBeGreaterThan(5); expect(size).toBeLessThanOrEqual(55);
        }
      }
    }
  });
});

describe('stickers', () => {
  it('unique ids, bundled pictures, every one in a sticker-book section', () => {
    expect(new Set(STICKERS.map((s) => s.id)).size).toBe(STICKERS.length);
    STICKERS.forEach((s) => {
      expect(picOk(s.pic), s.id).toBe(true);
      expect(['journey', 'letters', 'words', 'stories', 'nepal', 'play']).toContain(stickerGroup(s));
    });
  });
});

describe('levels by age', () => {
  it('gets harder from 3 to 6 and clamps outside that range', () => {
    const [a3, a4, a5, a6] = [3, 4, 5, 6].map(levelFor);
    expect(a3.choices).toBe(2);
    expect(a6.choices).toBe(4);
    expect(a3.countMax).toBeLessThan(a4.countMax);
    expect(a5.countMax).toBeLessThan(a6.countMax);
    expect(a3.traceEase).toBeGreaterThan(a6.traceEase);
    expect(levelFor(2).age).toBe(3);
    expect(levelFor(9).age).toBe(6);
    expect(levelFor(undefined).age).toBe(4);
  });
});

describe('colouring', () => {
  it('pages have unique region ids and the flag check knows the real colours', () => {
    PAGES.forEach((p) => expect(new Set(p.regions.map((r) => r.id)).size).toBe(p.regions.length));
    expect(PALETTE).toContain('#dc143c');
    expect(flagIsCorrect({ border: '#1d4fb0', body: '#dc143c', moon: '#ffffff', moonrays: '#ffffff', sun: '#ffffff' })).toBe(true);
    expect(flagIsCorrect({ border: '#dc143c', body: '#1d4fb0', moon: '#ffffff', moonrays: '#ffffff', sun: '#ffffff' })).toBe(false);
  });
});

describe('Nepali first', () => {
  it('every UI string has Nepali (Devanagari) text', () => {
    for (const [k, v] of Object.entries(UI)) {
      const list = Array.isArray(v) ? v : [v];
      for (const t of list) expect((t as { ne: string }).ne, k).toMatch(/[ऀ-ॿ]/);
    }
  });
});
