import { Page, Locator, expect } from '@playwright/test';

export class ForgotPasswordPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('forgot-password-email-input');
    this.submitButton = page.getByTestId('forgot-password-submit-button');
    this.loginLink = page.getByTestId('forgot-password-login-link');
    this.successMessage = page.getByTestId('forgot-password-success-message');
  }

  async goto() {
    await this.page.goto('/forgot-password');
  }

  async requestPasswordReset(email: string) {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }

  async goToLogin() {
    await this.loginLink.click();
  }

  async expectSuccessMessage() {
    await expect(this.successMessage).toBeVisible();
  }
}