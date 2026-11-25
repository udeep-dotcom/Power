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
  await pickTalkIfAsked(page);
  await pickAgeIfAsked(page, age);
  await expect(page.locator('.home-grid')).toBeVisible();
  return errors;
}
/** Once per install a grown-up chooses the language Habre speaks (tests keep Nepali). */
export async function pickTalkIfAsked(page: Page, talk: 'ne' | 'both' | 'en' = 'ne') {
  const btn = page.locator(`.talk-btn[data-talk="${talk}"]`);
  try { await btn.waitFor({ timeout: 1500 }); await btn.click(); } catch { /* not asked */ }
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

/** Put recordings on this device as if made in the Voice Studio (a short silent WAV per id),
 *  then reload so the app sees them. Used to unlock the English phonics games. */
export async function seedRecordings(page: Page, ids: string[]) {
  await page.evaluate(async (ids) => {
    const wav = (() => {
      const n = 2400, b = new ArrayBuffer(44 + n * 2), v = new DataView(b);
      const s = (o: number, t: string) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
      s(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); s(8, 'WAVE'); s(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
      v.setUint16(22, 1, true); v.setUint32(24, 24000, true); v.setUint32(28, 48000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
      s(36, 'data'); v.setUint32(40, n * 2, true);
      return new Blob([b], { type: 'audio/wav' });
    })();
    const db: IDBDatabase = await new Promise((res, rej) => {
      const r = indexedDB.open('akshar-yatra-voice', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('clips', { keyPath: 'id' });
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    await new Promise<void>((res, rej) => {
      const tx = db.transaction('clips', 'readwrite');
      for (const id of ids) tx.objectStore('clips').put({ id, blob: wav, ms: 100, at: Date.now() });
      tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
    });
    db.close();
  }, ids);
  await page.goto('/'); // a reload would reopen the last route; start from home
  await page.locator('.start-play, .player').first().click({ force: true });
  await expect(page.locator('.home-grid')).toBeVisible();
}
