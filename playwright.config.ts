import { defineConfig, devices } from '@playwright/test';

/**
 * Konfiguracja dla testów Playwright E2E.
 * https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    // Podstawowa konfiguracja dla wszystkich testów
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  // Konfiguracja dla różnych projektów (przeglądarek)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  // Lokalny serwer deweloperski z poprawionym poleceniem
  webServer: {
    command: 'npm run dev -- --host',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60000, // Increase timeout to 60 seconds
    stderr: 'pipe', // Pipe stderr for better debugging
    stdout: 'pipe', // Pipe stdout for better debugging
  },
});
