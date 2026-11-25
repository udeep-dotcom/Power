// Shared helpers for the end-to-end tests.
import { expect, type Page } from '@playwright/test';

export const KEY = 'akshar-yatra:v1';

export async function boot(page: Page, state?: object, age = 6) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  if (state) await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(state)] as const);
  await page.goto('/');
  const start = page.locator('.start-play, .player').first();
  await start.click({ force: true });
  await pickAgeIfAsked(page, age);
  await expect(page.locator('.home-grid')).toBeVisible();
  return errors;
}
/** First time a player starts, Habre asks their age (3–6). Tests default to 6 = hardest. */
export async function pickAgeIfAsked(page: Page, age = 6) {
  const btn = page.locator(`.age-btn[aria-label="${age}"]`);
  try { await btn.waitFor({ timeout: 1500 }); await btn.click(); } catch { /* not asked */ }
}
export const go = (page: Page, route: string) => page.evaluate((r) => { location.hash = r; }, route);
export const saved = (page: Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), KEY);

/** A player who has finished the first 6 letters (enough for practice/review features). */
export const veteran = {
  v: 2,
  nodes: { 'L:a': 3, 'L:aa': 2, 'L:i': 3, 'L:ii': 1, 'L:ka': 3, 'L:kha': 2 },
  letters: Object.fromEntries(['a', 'aa', 'i', 'ii', 'ka', 'kha'].map((id) => [id, { trace: 2, correct: 3, wrong: 1, seen: true }])),
  profiles: [{ id: 'p1', avatar: '🐯', name: '' }], active: 'p1',
};
