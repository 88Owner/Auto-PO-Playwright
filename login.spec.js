const { test, expect } = require('@playwright/test');

test.use({ storageState: process.env.AUTH_STATE_FILE || 'auth.json' });

test('Vào Sapo không cần login', async ({ page }) => {
  await page.goto('https://tinhtra.mysapo.net/admin');

  await page.waitForLoadState('networkidle');

  await expect(page).toHaveURL(/admin/);
});