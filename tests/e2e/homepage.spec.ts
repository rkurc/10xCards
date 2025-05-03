import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('has title and links', async ({ page }) => {
    // Go to homepage and wait for it to load
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check the title
    await expect(page).toHaveTitle(/10xCards/);
    
    // Check for main navigation elements
    await expect(page.getByRole('link', { name: /Sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Sign up/i })).toBeVisible();
  });
});
