import { test, expect } from '@playwright/test';

test('homepage has title and links', async ({ page }) => {
  await page.goto('/');
  
  // Ensure the page has loaded by checking for title
  await expect(page).toHaveTitle(/10xCards/);
  
  // Add more assertions based on your actual homepage
  // For example:
  // await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
