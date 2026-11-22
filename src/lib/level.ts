// Difficulty by age. A 3-year-old and a 6-year-old are developmentally far apart: a 3-year-old
// can hold ~2 choices in mind, has little pencil control, and counts to 3; a 6-year-old handles
// 4 choices, real tracing and counting to 10. Every game reads these numbers instead of
// hard-coding one difficulty.

import { activeProfile, getState } from './store';

export interface Level {
  age: number;
  /** answer tiles in choice games */
  choices: number;
  /** memory-card pairs */
  pairs: number;
  /** balloons to pop, and a multiplier on how slowly they rise (higher = slower) */
  balloonGoal: number;
  balloonSlow: number;
  /** largest quantity in the counting game */
  countMax: number;
  /** answer pictures in the quiz (younger children also get only the easy questions) */
  quizOptions: number;
  /** how much the trace star thresholds are lowered */
  traceEase: number;
}

const LEVELS: Record<number, Omit<Level, 'age'>> = {
  3: { choices: 2, pairs: 2, balloonGoal: 4, balloonSlow: 1.4, countMax: 3, quizOptions: 2, traceEase: 0.15 },
  4: { choices: 3, pairs: 3, balloonGoal: 4, balloonSlow: 1.2, countMax: 5, quizOptions: 2, traceEase: 0.1 },
  5: { choices: 3, pairs: 4, balloonGoal: 6, balloonSlow: 1.0, countMax: 7, quizOptions: 3, traceEase: 0.05 },
  6: { choices: 4, pairs: 4, balloonGoal: 6, balloonSlow: 1.0, countMax: 10, quizOptions: 3, traceEase: 0 },
};

export const DEFAULT_AGE = 4;

export function levelFor(age: number | undefined): Level {
  const a = Math.max(3, Math.min(6, age ?? DEFAULT_AGE));
  return { age: a, ...LEVELS[a] };
}

export function level(): Level {
  return levelFor(activeProfile(getState()).age);
}
