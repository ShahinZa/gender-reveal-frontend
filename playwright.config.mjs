import { defineConfig } from '@playwright/test';
import fs from 'node:fs';
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export default defineConfig({
  testDir: './tests', timeout: 45000, expect: { timeout: 10000 }, workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:3000', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chrome', use: { browserName: 'chromium', launchOptions: fs.existsSync(chrome) ? { executablePath: chrome } : {} } },
    { name: 'webkit-mobile', use: { browserName: 'webkit', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: [
    { command: 'npm run test:server', cwd: '../baby-reveal-backend', url: 'http://127.0.0.1:5101', reuseExistingServer: !process.env.CI, timeout: 120000 },
    { command: 'npm run dev -- --host 127.0.0.1', url: 'http://127.0.0.1:3000', reuseExistingServer: false, env: { VITE_API_URL: 'http://127.0.0.1:5101' } },
  ],
});
