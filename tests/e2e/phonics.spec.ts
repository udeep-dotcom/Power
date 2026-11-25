// v0.4 phonics & pronunciation: every new screen renders, every game can be finished by a
// "perfect child", and the mic practice really records and plays back (Chromium's fake mic).
import { expect, test, type Page } from '@playwright/test';
import { boot, go, saved } from './helpers';

// the fake microphone flags live in playwright.config.ts
test.use({ permissions: ['microphone'] });

/** Play a PickGame (pairs / hunt / friends) perfectly: answer each round once it is on screen. */
async function playPick(page: Page, rounds: number) {
  for (let k = 0; k < rounds; k++) {
    await expect(page.locator('.round-dots span.on')).toHaveCount(k, { timeout: 8000 });
    const id = await page.locator('.pick-prompt').getAttribute('data-target');
    await page.locator(`.choice[data-id="${id}"]`).click();
  }
  await expect(page.locator('.celebrate')).toBeVisible({ timeout: 8000 });
}

test('phonics screens render without errors and the home has the two new tiles', async ({ page }) => {
  const errors = await boot(page);
  await expect(page.locator('.home-tile')).toHaveCount(8);
  for (const r of ['/sounds', '/sounds/mouth', '/sounds/mouth/dda', '/abc', '/abc/a', '/abc/x', '/abc/hunt', '/sounds/blend/ne', '/sounds/blend/en',
    '/sounds/pairs/ne', '/sounds/pairs/en', '/sounds/friends', '/sounds/friends/game']) {
    await go(page, r);
    await expect(page.locator('.screen').first()).toBeVisible();
    await page.waitForTimeout(250);
  }
  expect(errors).toEqual([]);
});

test('mouth map: tapping letters shows where the sound is made; one per row earns the sticker', async ({ page }) => {
  await boot(page);
  await go(page, '/sounds/mouth/ka');
  const cell = (ch: string) => page.locator('.vt-cell', { hasText: new RegExp(`^${ch}$`) });
  await cell('भ').click();
  await expect(page.locator('.mouth-letter')).toHaveText('भ');
  await expect(page.locator('.feel')).toHaveCount(2); // भ: air + buzz
  await expect(page.locator('.vt-row.active .vt-cell.sel')).toHaveText('भ');
  await expect.poll(async () => (await saved(page)).soundsHeard ?? []).toContain('ne:bha');
  for (const ch of ['क', 'च', 'ट', 'त']) await cell(ch).click();
  await expect.poll(async () => (await saved(page)).stickers ?? []).toContain('mouthmap');
});

test('lesson shows how the letter is made and links to the mouth map', async ({ page }) => {
  await boot(page);
  await go(page, '/learn/kha');
  await expect(page.locator('.phon-chips .pc')).toHaveCount(2); // throat + air
  await page.locator('.phon-chips').click();
  await expect(page.locator('.mouth-letter')).toHaveText('ख');
});

test('ABC: letter pages step through a–z; hearing s a t p i n earns the sticker', async ({ page }) => {
  await boot(page);
  await go(page, '/abc');
  await expect(page.locator('.abc-tile')).toHaveCount(26);
  await page.locator('.abc-tile').first().click();
  await expect(page.locator('.abc-big')).toHaveText('s');
  await expect(page.locator('.friend-chip .fc-ne')).toHaveText('स');
  for (const ch of ['a', 't', 'p', 'i', 'n']) {
    await page.locator('.abc-nav .big-arrow').last().click();
    await expect(page.locator('.abc-big')).toHaveText(ch);
  }
  await expect.poll(async () => (await saved(page)).stickers ?? []).toContain('abc');
  // x is heard at the END of fox — the highlighted letter is the last one
  await go(page, '/abc/x');
  await expect(page.locator('.en-word b')).toHaveText('x');
  await expect(page.locator('.en-word')).toHaveText('fox');
});

for (const lang of ['en', 'ne'] as const) {
  test(`blend (${lang}): run the sounds together, pick the picture, finish`, async ({ page }) => {
    await boot(page);
    await go(page, `/sounds/blend/${lang}`);
    for (let k = 0; k < 5; k++) {
      await expect(page.locator('.round-dots span.on')).toHaveCount(k, { timeout: 8000 });
      const word = await page.locator('.blend-card').getAttribute('data-word');
      await page.locator('.blend-demo').click();
      await page.locator(`.choice[data-id="${word}"]`).click({ timeout: 15000 });
    }
    await expect(page.locator('.celebrate')).toBeVisible({ timeout: 8000 });
    const st = await saved(page);
    expect(st.nodes?.[`SB:${lang}`]).toBe(3);
    expect(st.stickers).toContain('blend');
  });
}

test('blend: dragging along the arrow lights every sound in order', async ({ page }) => {
  await boot(page, undefined, 6);
  await go(page, '/sounds/blend/en');
  const track = page.locator('.blend-track');
  const box = (await track.boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + 2, y);
  await page.mouse.down();
  for (let x = box.x + 2; x <= box.x + box.width; x += 12) await page.mouse.move(x, y);
  await page.mouse.up();
  await expect(page.locator('.blend-part.lit')).toHaveCount(3); // CVC, age 6 = every sound
  await expect(page.locator('.blend-parts.joined')).toBeVisible();
});

test('age 3 blends bigger chunks (onset + rime) before single sounds', async ({ page }) => {
  await boot(page, undefined, 3);
  await go(page, '/sounds/blend/en');
  await expect(page.locator('.blend-part')).toHaveCount(2);
});

test('minimal pairs (Nepali): हावा / जिब्रो differences, finish with the ears sticker', async ({ page }) => {
  await boot(page);
  await go(page, '/sounds/pairs/ne');
  await expect(page.locator('.choice')).toHaveCount(2);
  await playPick(page, 6);
  await expect.poll(async () => (await saved(page)).stickers ?? []).toContain('ears');
  expect((await saved(page)).nodes?.['SP:ne']).toBe(3);
});

test('minimal pairs (English) and sound hunt can be completed', async ({ page }) => {
  await boot(page);
  await go(page, '/sounds/pairs/en');
  await playPick(page, 6);
  await go(page, '/abc/hunt');
  await playPick(page, 6);
  const st = await saved(page);
  expect(st.nodes?.['SP:en']).toBe(3);
  expect(st.nodes?.['SH:en']).toBe(3);
});

test('sound friends: the table and the game', async ({ page }) => {
  await boot(page);
  await go(page, '/sounds/friends');
  await expect(page.locator('.friend-pair').first()).toBeVisible();
  await expect(page.locator('.only-card')).toHaveCount(3);
  await page.locator('.words-play').click();
  await playPick(page, 6);
  await expect.poll(async () => (await saved(page)).stickers ?? []).toContain('friends');
});

test('mic practice records the child and plays it back next to the model', async ({ page }) => {
  const errors = await boot(page);
  await go(page, '/abc/s');
  const echo = page.locator('.echo').last();
  await echo.locator('.echo-mic').click();
  await expect(echo).toHaveClass(/phase-record/, { timeout: 10000 });
  await expect(echo).toHaveClass(/phase-(play|idle)/, { timeout: 8000 });
  await expect(echo.locator('.echo-replay')).toBeVisible({ timeout: 15000 }); // "my voice" button
  expect(errors).toEqual([]);
});

test('parents can switch the microphone off: no mic buttons anywhere', async ({ page }) => {
  await boot(page, { v: 2, mic: false, profiles: [{ id: 'p1', avatar: '🐯', name: '', age: 5 }], active: 'p1' });
  for (const r of ['/abc/s', '/learn/ka', '/sounds/mouth/ka']) {
    await go(page, r);
    await expect(page.locator('.screen').first()).toBeVisible();
    await expect(page.locator('.echo-mic')).toHaveCount(0);
  }
});
