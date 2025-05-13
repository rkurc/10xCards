import { type Page, type Locator, expect } from "@playwright/test";

export class ResetPasswordPage {
  readonly page: Page;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly loginLink: Locator;
  readonly passwordStrength: Locator;

  constructor(page: Page) {
    this.page = page;
    this.passwordInput = page.getByTestId("new-password-input");
    this.confirmPasswordInput = page.getByTestId("confirm-password-input");
    this.submitButton = page.getByTestId("submit-button");
    this.successMessage = page.getByRole("alert").filter({ hasText: /Hasło zostało zmienione/ });
    this.errorMessage = page.getByRole("alert").filter({ hasText: /błąd/i });
    this.loginLink = page.getByTestId("login-link");
    this.passwordStrength = page.getByTestId("password-strength");
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
