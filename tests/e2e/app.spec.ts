// End-to-end smoke tests: every screen renders without errors and every game can be played
// to completion by a "perfect child". Run: npm run test:e2e  (builds first)
import { expect, test, type Page } from '@playwright/test';

const KEY = 'akshar-yatra:v1';

async function boot(page: Page, state?: object) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  if (state) await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(state)] as const);
  await page.goto('/');
  const start = page.locator('.start-play, .player').first();
  await start.click({ force: true });
  await expect(page.locator('.home-menu')).toBeVisible();
  return errors;
}
const go = (page: Page, route: string) => page.evaluate((r) => { location.hash = r; }, route);
const saved = (page: Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), KEY);

/** A player who has finished the first 6 letters (enough for practice/review features). */
const veteran = {
  v: 2,
  nodes: { 'L:a': 3, 'L:aa': 2, 'L:i': 3, 'L:ii': 1, 'L:ka': 3, 'L:kha': 2 },
  letters: Object.fromEntries(['a', 'aa', 'i', 'ii', 'ka', 'kha'].map((id) => [id, { trace: 2, correct: 3, wrong: 1, seen: true }])),
  profiles: [{ id: 'p1', avatar: '🐯', name: '' }], active: 'p1',
};

test('start screen → home, all main screens render without errors', async ({ page }) => {
  const errors = await boot(page);
  for (const r of ['/journey', '/letters', '/barakhari', '/nepal', '/nepal/map', '/nepal/deck/symbols', '/nepal/quiz', '/stickers', '/parents', '/learn/ka', '/game/u1']) {
    await go(page, r);
    await expect(page.locator('.screen').first()).toBeVisible();
    await page.waitForTimeout(250);
  }
  expect(errors).toEqual([]);
});

test('letter lesson: trace perfectly, find the letter, progress is saved', async ({ page }) => {
  await boot(page);
  await go(page, '/learn/ka/j');
  await page.locator('.lesson-next').click();
  await expect(page.locator('.trace-guide')).toBeVisible();
  await page.waitForTimeout(800); // font + guide
  // Trace along horizontal runs of the guide letter's fill colour (#f1dcc0).
  const runs = await page.evaluate(() => {
    const c = document.querySelector('.trace-guide') as HTMLCanvasElement;
    const r = c.getBoundingClientRect();
    const g = c.getContext('2d')!;
    const sx = c.width / r.width;
    const out: [number, number, number][] = [];
    for (let y = 4; y < r.height; y += 9) {
      const row = g.getImageData(0, Math.round(y * sx), c.width, 1).data;
      let start = -1;
      for (let x = 0; x <= c.width; x++) {
        const i = x * 4;
        const fill = x < c.width && row[i + 3] > 200 && Math.abs(row[i] - 241) < 8 && Math.abs(row[i + 1] - 220) < 8 && Math.abs(row[i + 2] - 192) < 10;
        if (fill && start < 0) start = x;
        if (!fill && start >= 0) { if (x - start > 2) out.push([r.left + start / sx, r.left + (x - 1) / sx, r.top + y]); start = -1; }
      }
    }
    return out;
  });
  expect(runs.length).toBeGreaterThan(20);
  for (const [x1, x2, y] of runs) {
    if (await page.locator('.find-target').count()) break; // auto-accepted at 3★
    await page.mouse.move(x1, y); await page.mouse.down();
    await page.mouse.move(x2, y, { steps: 4 }); await page.mouse.up();
  }
  if (!(await page.locator('.find-target').count())) await page.locator('.trace-actions .btn.big').click();
  await expect(page.locator('.find-target')).toBeVisible();
  await page.locator('.choice', { hasText: /^क$/ }).click();
  await expect(page.locator('.celebrate')).toBeVisible();
  await expect.poll(async () => (await saved(page)).nodes?.['L:ka'] ?? 0).toBeGreaterThanOrEqual(2);
  const st = await saved(page);
  expect(st.letters.ka.seen).toBe(true);
});

test('balloon pop can be completed', async ({ page }) => {
  await boot(page);
  await go(page, '/game/u3');
  for (let t = 0; t < 200 && !(await page.locator('.celebrate').count()); t++) {
    const target = await page.locator('.balloon-target .tgt').textContent();
    const hit = await page.evaluate((tg) => {
      const b = [...document.querySelectorAll<HTMLElement>('.balloon:not(.popped):not(.leaving)')]
        .find((x) => x.querySelector('.b-letter')!.textContent === tg && x.getBoundingClientRect().top > 170 && x.getBoundingClientRect().bottom < innerHeight);
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return [r.left + r.width / 2, r.top + 40];
    }, target);
    if (hit) await page.mouse.click(hit[0], hit[1]);
    await page.waitForTimeout(200);
  }
  await expect(page.locator('.celebrate')).toBeVisible();
  await expect.poll(async () => (await saved(page)).nodes?.['G:u3']).toBe(3);
});

test('memory pairs can be completed', async ({ page }) => {
  await boot(page);
  await go(page, '/game/u4');
  await page.waitForTimeout(500);
  const ids = await page.locator('.mcard').evaluateAll((cs) => cs.map((c) => (c as HTMLElement).dataset.id));
  expect(ids).toHaveLength(8);
  // the unit's own letters must be in the game
  expect(ids.filter((id) => ['ka', 'kha', 'ga', 'gha', 'nga'].includes(id!)).length).toBe(8);
  const done = new Set<string>();
  for (let i = 0; i < ids.length; i++) {
    if (done.has(ids[i]!)) continue;
    const j = ids.findIndex((x, k) => k > i && x === ids[i]);
    await page.locator('.mcard').nth(i).click();
    await page.locator('.mcard').nth(j).click();
    await page.waitForTimeout(900);
    done.add(ids[i]!);
  }
  await expect(page.locator('.celebrate')).toBeVisible();
});

test('picture match never hides a vowel sign along with the letter', async ({ page }) => {
  await boot(page);
  await go(page, '/game/u7'); // त थ द ध न — थाल and धान carry a vowel sign after the letter
  for (let round = 0; round < 6; round++) {
    const prompt = page.locator('.prompt');
    const id = await prompt.getAttribute('data-target');
    const blank = await prompt.locator('.blank').textContent().catch(() => null);
    if (blank && id && ['tha', 'dha'].includes(id)) expect(blank.startsWith('◌')).toBe(true);
    if (blank && id && ['ta', 'da', 'na'].includes(id)) expect(blank).toBe('?');
    await page.locator(`.choice[data-id="${id}"]`).click();
    await page.waitForTimeout(1300);
    if (await page.locator('.celebrate').count()) break;
  }
});

test('बाह्रखरी explorer composes syllables and the matra game can be completed', async ({ page }) => {
  await boot(page);
  await go(page, '/barakhari/kha');
  await page.locator('.bk-tile').nth(2).click(); // खि
  await expect(page.locator('.eq-r')).toHaveText('खि');
  await page.locator('.topbar .btn.plum').click();
  for (let i = 0; i < 8; i++) {
    const answer = await page.locator('.bk-prompt').getAttribute('data-target');
    await page.locator(`.choice[data-id="${answer}"]`).click();
    await page.waitForTimeout(1400);
  }
  await expect(page.locator('.celebrate')).toBeVisible();
  await expect.poll(async () => (await saved(page)).nodes?.['B:game']).toBe(3);
  const st = await saved(page);
  expect(st.stickers).toContain('barakhari');
  expect(st.barakhari).toContain('kha');
});

test("today's practice appears after 4 letters and can be completed", async ({ page }) => {
  await boot(page, veteran);
  await page.locator('.practice-btn').click();
  for (let i = 0; i < 6; i++) {
    const id = await page.locator('.prompt').getAttribute('data-target');
    await page.locator(`.choice[data-id="${id}"]`).click();
    await page.waitForTimeout(1300);
  }
  await expect(page.locator('.celebrate')).toBeVisible();
  await expect.poll(async () => (await saved(page)).practiceDays?.length).toBe(1);
});

test('players: add a sibling in the parent zone; each has separate progress', async ({ page }) => {
  await boot(page, veteran);
  await go(page, '/parents');
  const q = await page.locator('.gate p b').textContent();
  const W = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const [a, b] = q!.split('×').map((w) => W.indexOf(w.trim()));
  await page.locator('.gate-opts .btn', { hasText: new RegExp(`^${a * b}$`) }).click();
  await page.getByRole('button', { name: /Add player|खेलाडी थप्ने/ }).click();
  await expect(page.locator('.pz-player')).toHaveCount(2);
  await go(page, '/');
  await page.locator('.player-btn').click();
  await expect(page.locator('.player')).toHaveCount(2);
  await page.locator('.player').nth(1).click();
  await expect(page.locator('.menu-chip')).toHaveText(/[०0]\/[४4][९9]/); // new player starts at 0/49
  await page.locator('.player-btn').click();
  await page.locator('.player').nth(0).click();
  await expect(page.locator('.menu-chip')).toHaveText(/[६6]\/[४4][९9]/); // first player still has 6
});

test('exploring all 7 provinces earns the map sticker', async ({ page }) => {
  await boot(page);
  await go(page, '/nepal/map');
  for (let i = 0; i < 7; i++) {
    await page.locator('.prov').nth(i).click({ force: true });
    await page.waitForTimeout(150);
  }
  await expect(page.locator('.celebrate')).toBeVisible({ timeout: 6000 });
  await expect.poll(async () => (await saved(page)).stickers ?? []).toContain('mapper');
});

test('no horizontal page overflow on a 360×640 phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await boot(page, veteran);
  for (const r of ['/', '/journey', '/learn/ka', '/letters', '/game/u1', '/barakhari', '/barakhari-game', '/nepal', '/nepal/map', '/stickers', '/practice']) {
    await go(page, r);
    await page.waitForTimeout(300);
    const w = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    expect(w[0], r).toBeLessThanOrEqual(w[1]);
  }
});
