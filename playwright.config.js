const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  timeout: 60000,
  testDir: './tests',

  use: {
    headless: false,              // Hiện browser
    storageState: 'auth.json',    // Dùng session đã login
    viewport: { width: 1366, height: 768 },
    ignoreHTTPSErrors: true
  },

  reporter: 'html'
});