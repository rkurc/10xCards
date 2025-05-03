import type { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder("twoj@email.com");
    this.passwordInput = page.getByPlaceholder("••••••••");
    this.loginButton = page.getByRole("button", { name: "Zaloguj się" });
    // Toast messages don't use role="alert", so we need to use a different selector
    this.errorMessage = page.locator('.sonner-toast[data-type="error"]');
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
