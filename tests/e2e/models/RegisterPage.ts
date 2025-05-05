import { Page, Locator, expect } from "@playwright/test";

export class RegisterPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly passwordConfirmInput: Locator;
  readonly termsCheckbox: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;
  readonly errorMessage: Locator;
  readonly passwordStrength: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('input[name="name"]');
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.passwordConfirmInput = page.locator('input[name="passwordConfirm"]');
    this.termsCheckbox = page.locator('input[name="termsAccepted"]');
    this.submitButton = page.getByRole("button", { name: /Zarejestruj się/i });
    this.loginLink = page.getByText("Zaloguj się").first();
    this.errorMessage = page.getByTestId("error-message");
    this.passwordStrength = page.locator(".progress-bar");
  }

  async goto() {
    await this.page.goto("/register");
  }

  async register(name: string, email: string, password: string) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.passwordConfirmInput.fill(password);
    await this.termsCheckbox.check();
    await this.submitButton.click();
  }

  async goToLogin() {
    await this.loginLink.click();
  }

  async expectEmailConfirmationScreen() {
    await expect(this.page.getByText("Sprawdź swoją skrzynkę email")).toBeVisible();
  }

  async expectToBeRedirected() {
    await expect(this.page).toHaveURL(/\/(dashboard|registration-success)/);
  }
}
