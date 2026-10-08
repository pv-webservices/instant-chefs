import { defineConfig, devices } from '@playwright/test';

const PORT = 4323;

// Browser tests run against the built site (`npm run build` first).
// They use the locally installed Google Chrome, so no browser download is needed.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: 'chrome',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: `npx astro preview --port ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
  },
});
