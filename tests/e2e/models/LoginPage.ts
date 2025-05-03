import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder('twoj@email.com');
    this.passwordInput = page.getByPlaceholder('••••••••');
    this.loginButton = page.getByRole('button', { name: 'Zaloguj się' });
    this.errorMessage = page.locator('.sonner-toast[data-type="error"]');
  }

  async goto() {
    await this.page.goto('/login');
    await expect(this.emailInput).toBeVisible();
  }

  async login(email: string, password: string) {
    // Wait for the form to be interactive
    await expect(this.emailInput).toBeEnabled();
    await expect(this.passwordInput).toBeEnabled();
    await expect(this.loginButton).toBeEnabled();

    // Fill in credentials
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    // Click login and wait for navigation or response
    await Promise.all([
      this.page.waitForResponse(
        response => response.url().includes('/api/auth/login')
      ),
      this.loginButton.click()
    ]);
  }
}
