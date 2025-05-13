import { type Page, type Locator, expect } from "@playwright/test";

export class ForgotPasswordPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId("reset-email-input");
    this.submitButton = page.getByTestId("reset-submit-button");
    this.loginLink = page.getByTestId("back-to-login-link");
    this.successMessage = page.getByRole("alert").filter({ hasText: /Link do resetowania hasła/ });
    this.errorMessage = page.getByRole("alert").filter({ hasText: /błąd/ });
  }

  async goto() {
    await this.page.goto("/forgot-password");
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
