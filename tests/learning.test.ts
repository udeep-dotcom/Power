import { describe, expect, it } from 'vitest';
import { blankSplit, LETTERS, LETTER_BY_ID } from '../src/data/alphabet';
import { BK_CONSONANTS, MATRAS, MATRA_CONFUSABLE, syllable, syllableRoman } from '../src/data/barakhari';
import { planTargets } from '../src/screens/games/ChoiceGame';
import { planMatraRounds } from '../src/screens/barakhari/MatraGame';
import { tint } from '../src/lib/util';

describe('blankSplit (picture match)', () => {
  it('hides only the letter; attached vowel signs stay visible', () => {
    expect(blankSplit(LETTER_BY_ID.chha)).toEqual({ before: '', marks: 'ा', after: 'ता' }); // छाता
    expect(blankSplit(LETTER_BY_ID.ka)).toEqual({ before: '', marks: '', after: 'मल' }); // कमल
    expect(blankSplit(LETTER_BY_ID.nga)).toEqual({ before: 'र', marks: '', after: '' }); // रङ
    expect(blankSplit(LETTER_BY_ID.ah)).toEqual({ before: 'प्रात', marks: '', after: '' }); // प्रातः
  });
  it.each(LETTERS.map((l) => [l.char, l] as const))('%s: blank + parts rebuild the word', (_, l) => {
    const { before, marks, after } = blankSplit(l);
    const hidden = l.word.length - before.length - marks.length - after.length;
    expect(hidden).toBeGreaterThan(0);
    expect(l.word.startsWith(before)).toBe(true);
    expect(l.word.endsWith(marks + after)).toBe(true);
  });
});

describe('planTargets (game rounds)', () => {
  it('is mostly the unit’s own letters and never repeats back-to-back', () => {
    for (let k = 0; k < 50; k++) {
      const t = planTargets(['ka', 'kha', 'ga', 'gha', 'nga'], ['a', 'aa', 'i']);
      expect(t).toHaveLength(6);
      expect(t.filter((id) => ['ka', 'kha', 'ga', 'gha', 'nga'].includes(id)).length).toBeGreaterThanOrEqual(4);
      for (let i = 1; i < t.length; i++) expect(t[i]).not.toBe(t[i - 1]);
    }
  });
});

describe('बाह्रखरी', () => {
  it('has the 12 traditional forms and 36 consonants', () => {
    expect(MATRAS).toHaveLength(12);
    expect(BK_CONSONANTS).toHaveLength(36);
    expect(MATRAS.map((m) => syllable(LETTER_BY_ID.ka, m)).join(' ')).toBe('क का कि की कु कू के कै को कौ कं कः');
  });
  it('builds conjunct syllables and romanisation', () => {
    expect(syllable(LETTER_BY_ID.ksha, MATRAS[2])).toBe('क्षि');
    expect(syllableRoman(LETTER_BY_ID.ka, MATRAS[3])).toBe('kii');
  });
  it('matra game always offers the confusable partner', () => {
    for (let k = 0; k < 30; k++) {
      for (const r of planMatraRounds(['ka', 'ga', 'ma'])) {
        const partner = MATRA_CONFUSABLE[r.m.id];
        expect(r.options.map((o) => o.id)).toContain(r.m.id);
        if (partner) expect(r.options.map((o) => o.id)).toContain(partner);
        expect(new Set(r.options.map((o) => o.id)).size).toBe(r.options.length);
      }
    }
  });
});

describe('tint (color-mix replacement)', () => {
  it('mixes toward white', () => {
    expect(tint('#000000', 0)).toBe('rgb(255, 255, 255)');
    expect(tint('#dc143c', 1)).toBe('rgb(220, 20, 60)');
  });
});
