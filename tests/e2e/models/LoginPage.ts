import { type Page, type Locator, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-button");
    this.forgotPasswordLink = page.getByTestId("login-forgot-password-link");
    this.registerLink = page.getByTestId("login-register-link");
    this.errorMessage = page.getByTestId("error-message");
    this.successMessage = page.getByTestId("success-message");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async goToForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async goToRegister() {
    await this.registerLink.click();
  }

  async expectErrorMessage() {
    await expect(this.errorMessage).toBeVisible();
    return this.errorMessage.textContent();
  }

  async expectSuccessMessage() {
    await expect(this.successMessage).toBeVisible();
    return this.successMessage.textContent();
  }

  async expectToBeRedirectedToDashboard() {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }
}
