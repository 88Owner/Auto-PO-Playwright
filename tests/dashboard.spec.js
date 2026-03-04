const { test, expect } = require('@playwright/test');

test('Vào dashboard Sapo', async ({ page }) => {
  await page.goto('https://tinhtra.mysapo.net/admin');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/admin/);
});