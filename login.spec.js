const { test, expect } = require('@playwright/test');

test.use({ storageState: 'auth.json' });

test('Vào Sapo không cần login', async ({ page }) => {
  await page.goto('https://tinhtra.mysapo.net/admin');

  await page.waitForLoadState('networkidle');

  await expect(page).toHaveURL(/admin/);
});