const { test, expect } = require('@playwright/test');

test('Vào dashboard Sapo', async ({ page }) => {
  await page.goto('https://tinhtra.mysapo.net/admin', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/admin/, { timeout: 30_000 });
});