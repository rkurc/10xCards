import { Page, Locator, expect } from "@playwright/test";

export class ResetPasswordPage {
  readonly page: Page;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.passwordInput = page.getByTestId("reset-password-input");
    this.confirmPasswordInput = page.getByTestId("reset-password-confirm-input");
    this.submitButton = page.getByTestId("reset-password-submit-button");
    this.successMessage = page.getByTestId("reset-password-success-message");
    this.loginLink = page.getByTestId("reset-password-to-login");
  }

  async goto(token: string) {
    await this.page.goto(`/reset-password/${token}`);
  }

  async resetPassword(newPassword: string) {
    await this.passwordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(newPassword);
    await this.submitButton.click();
  }

  async goToLoginAfterReset() {
    await expect(this.successMessage).toBeVisible();
    await this.loginLink.click();
  }

  async expectSuccessAndRedirect() {
    await expect(this.successMessage).toBeVisible();
    await expect(this.page).toHaveURL(/\/login/);
  }
}
