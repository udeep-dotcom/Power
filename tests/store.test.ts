import { beforeEach, describe, expect, it } from 'vitest';
import {
  addProfile, completeNode, defaultState, getState, learnedLetterIds, mastery, migrate, removeProfile,
  resetProgress, switchProfile, update,
} from '../src/lib/store';

describe('migrate', () => {
  it('upgrades a v1 save (no players) into player 1 without losing progress', () => {
    const v1 = { v: 1, lang: 'en', nodes: { 'L:ka': 3 }, stickers: ['lumbini'], letters: { ka: { trace: 3, correct: 2, wrong: 0, seen: true } } };
    const s = migrate(v1);
    expect(s.v).toBe(2);
    expect(s.lang).toBe('en');
    expect(s.profiles).toHaveLength(1);
    expect(s.active).toBe(s.profiles[0].id);
    expect(s.nodes['L:ka']).toBe(3);
    expect(s.stickers).toEqual(['lumbini']);
    expect(s.barakhari).toEqual([]); // new fields get defaults
    expect(s.practiceDays).toEqual([]);
  });
  it('survives garbage', () => {
    expect(migrate(null).v).toBe(2);
    expect(migrate('nope').profiles).toHaveLength(1);
  });
  it('repairs an active id that no longer exists', () => {
    const s = migrate({ ...defaultState(), active: 'ghost' });
    expect(s.active).toBe('p1');
  });
});

describe('players', () => {
  beforeEach(() => {
    update((s) => { Object.assign(s, defaultState()); });
  });

  it('keeps each player’s progress separate when switching', () => {
    completeNode('L:a', 3);
    const p2 = addProfile('🐘', 'Asha')!;
    switchProfile(p2);
    expect(learnedLetterIds(getState())).toEqual([]);
    completeNode('L:ka', 2);
    switchProfile('p1');
    expect(learnedLetterIds(getState())).toEqual(['a']);
    switchProfile(p2);
    expect(learnedLetterIds(getState())).toEqual(['ka']);
  });

  it('reset affects only the chosen player', () => {
    completeNode('L:a', 3);
    const p2 = addProfile('🐘')!;
    resetProgress(p2);
    expect(learnedLetterIds(getState())).toEqual(['a']);
    resetProgress();
    expect(learnedLetterIds(getState())).toEqual([]);
  });

  it('caps players at 4 and never removes the last one', () => {
    addProfile('🐘'); addProfile('🦏'); addProfile('🐒');
    expect(addProfile('🐻')).toBeNull();
    for (const p of [...getState().profiles]) removeProfile(p.id);
    expect(getState().profiles).toHaveLength(1);
  });
});

describe('mastery', () => {
  it('is 0 for unseen letters and grows with accuracy and tracing', () => {
    expect(mastery({ trace: 0, correct: 0, wrong: 0, seen: false })).toBe(0);
    const weak = mastery({ trace: 1, correct: 1, wrong: 4, seen: true });
    const strong = mastery({ trace: 3, correct: 9, wrong: 1, seen: true });
    expect(strong).toBeGreaterThan(weak);
    expect(strong).toBeLessThanOrEqual(1);
  });
});
