const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  timeout: 60000,
  testDir: './tests',

  use: {
    // Mặc định chạy headless để không hiện browser (production/CI).
    // Khi cần login thủ công dùng: `--headed`.
    headless: process.env.HEADLESS === '0' ? false : true,
    // Cho phép đổi tài khoản bằng cách set AUTH_STATE_FILE (VD: auth2.json)
    storageState: process.env.AUTH_STATE_FILE || 'auth.json',
    viewport: { width: 1366, height: 768 },
    ignoreHTTPSErrors: true
  },

  reporter: 'html'
});