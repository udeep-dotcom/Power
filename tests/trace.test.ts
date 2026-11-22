import { describe, expect, it } from 'vitest';
import { GRID, scoreTrace, starsFor, type Mask } from '../src/lib/trace';

/** A thick "L" shape standing in for a letter. */
function letterL(): Mask {
  const m = new Uint8Array(GRID * GRID);
  for (let y = 10; y < 54; y++) for (let x = 14; x < 22; x++) m[y * GRID + x] = 1;
  for (let y = 46; y < 54; y++) for (let x = 14; x < 50; x++) m[y * GRID + x] = 1;
  return m;
}

const fill = (pred: (x: number, y: number) => boolean): Mask => {
  const m = new Uint8Array(GRID * GRID);
  for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) if (pred(x, y)) m[y * GRID + x] = 1;
  return m;
};

describe('scoreTrace', () => {
  it('a faithful trace earns 3 stars', () => {
    const l = letterL();
    expect(scoreTrace(l, l).stars).toBe(3);
  });

  it('a slightly wobbly trace (offset by 2 cells) still earns 3 stars', () => {
    const l = letterL();
    const wobbly = fill((x, y) => !!l[y * GRID + Math.max(0, x - 2)]);
    expect(scoreTrace(l, wobbly).stars).toBeGreaterThanOrEqual(2);
  });

  it('scribbling over the whole pad is rejected (low precision)', () => {
    const s = scoreTrace(letterL(), fill(() => true));
    expect(s.coverage).toBe(1);
    expect(s.precision).toBeLessThan(0.5);
    expect(s.stars).toBe(0);
  });

  it("colouring in the letter's whole bounding box is not full marks", () => {
    const box = fill((x, y) => x >= 12 && x < 52 && y >= 8 && y < 56);
    const s = scoreTrace(letterL(), box);
    expect(s.coverage).toBe(1);
    expect(s.stars).toBeLessThan(3);
  });

  it('tracing only half the letter is not full marks', () => {
    const l = letterL();
    const half = fill((x, y) => !!l[y * GRID + x] && y < 40);
    const s = scoreTrace(l, half);
    expect(s.coverage).toBeLessThan(0.8);
    expect(s.stars).toBeLessThan(3);
  });

  it('an empty pad scores zero', () => {
    expect(scoreTrace(letterL(), new Uint8Array(GRID * GRID)).stars).toBe(0);
  });

  it('star thresholds are monotonic', () => {
    expect(starsFor(0.9, 0.9)).toBe(3);
    expect(starsFor(0.7, 0.7)).toBe(2);
    expect(starsFor(0.55, 0.55)).toBe(1);
    expect(starsFor(0.3, 0.9)).toBe(0);
  });
});
