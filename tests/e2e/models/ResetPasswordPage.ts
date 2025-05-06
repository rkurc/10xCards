import { type Page, type Locator, expect } from "@playwright/test";

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
    // No direct test ID for success message, so use text content
    this.successMessage = page.getByText("Twoje hasło zostało zmienione pomyślnie");
    this.loginLink = page.locator('a[href="/login"]');
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
    // When testing mock, we may not have actual redirection
    // So this checks for success message first
    await expect(this.successMessage).toBeVisible();
    if (await this.loginLink.isVisible()) {
      await this.loginLink.click();
    }
  }

  async expectSuccessAndRedirect() {
    await expect(this.successMessage).toBeVisible();
    // The app automatically redirects to login after success
    await expect(this.page).toHaveURL(/\/login/, { timeout: 5000 });
  }
}
