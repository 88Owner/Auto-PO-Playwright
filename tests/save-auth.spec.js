const { test, expect } = require('@playwright/test');

// Override để context bắt đầu "sạch", tránh tái dùng session cũ.
test.use({
  storageState: { cookies: [], origins: [] },
});

// Tạo/bổ sung file storageState để đổi tài khoản login.
// Chạy lần đầu (trên host, có browser UI) để bạn login thủ công,
// sau đó Playwright sẽ lưu lại auth.json (hoặc AUTH_STATE_FILE).
test('Save auth state (login thủ công)', async ({ page, context }) => {
  // Mặc định skip để không làm hỏng các lần chạy test thường.
  // Chỉ chạy khi bạn set: $env:AUTH_SAVE="1"
  if (process.env.AUTH_SAVE !== '1') {
    test.skip('Skip save-auth by default. Set AUTH_SAVE=1 to run.');
  }

  const outputPath = process.env.AUTH_STATE_FILE || 'auth.json';

  // Bắt đầu "sạch" để không dùng session cũ.
  // (config có storageState, nhưng test này override để login lại)
  // eslint-disable-next-line playwright/no-networkidle
  await page.context().clearCookies();

  await page.goto('https://tinhtra.mysapo.net/admin');

  // Chờ đến khi URL về trang admin (nghĩa là bạn đã login thành công).
  // Nếu bị redirect sang trang login thì bạn hãy login thủ công ngay trên màn hình.
  await page.waitForURL(/\/admin\/?/, { timeout: 300000 });

  await expect(page).toHaveURL(/admin/);

  await context.storageState({ path: outputPath });
});

