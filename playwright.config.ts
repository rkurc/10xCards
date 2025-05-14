import { defineConfig, devices } from "@playwright/test";

/**
 * Konfiguracja dla testów Playwright E2E.
 * https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  // Use only Chromium for testing
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Mobile Chromium testing if needed
    // {
    //   name: 'mobile chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },

  // Dev server configuration
  webServer: {
    command: "npm run dev:e2e",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // Increase timeout to 120 seconds
    stderr: "pipe", // Pipe stderr for better debugging
    stdout: "pipe", // Pipe stdout for better debugging
  },
});
