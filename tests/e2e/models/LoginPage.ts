import { Page, Locator, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly form: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder("twoj@email.com");
    this.passwordInput = page.locator("#password");
    this.loginButton = page.getByRole("button", { name: "Zaloguj się" });
    // Updated error selector to match our implementation with data-testid
    this.errorMessage = page.locator('.text-red-500, .bg-red-50, div[class*="text-red"], [data-testid="error-message"]');
    this.form = page.locator("form");
  }

  async goto() {
    await this.page.goto("/login");
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

    // Submit the form properly to ensure POST request
    // First try to use the form's submit method
    try {
      await this.page.evaluate(() => {
        const form = document.querySelector("form");
        if (form) {
          const submitEvent = new Event("submit", { cancelable: true });
          form.dispatchEvent(submitEvent);
          if (!submitEvent.defaultPrevented) {
            form.submit();
          }
        }
      });
    } catch (e) {
      // If direct form submission fails, fall back to clicking the button
      await this.loginButton.click();
    }
  }
}
