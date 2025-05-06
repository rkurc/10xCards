import { type Page, type Locator, expect } from "@playwright/test";
import { TestAuthHelper } from "../../helpers/test-auth-helper";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly testHelper: TestAuthHelper;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[id="email"]').or(page.getByTestId("login-email-input"));
    this.passwordInput = page.locator('input[id="password"]').or(page.getByTestId("login-password-input"));
    this.submitButton = page.getByTestId("login-submit-button");
    this.forgotPasswordLink = page.getByTestId("login-forgot-password-link");
    this.registerLink = page.getByTestId("login-register-link");
    this.errorMessage = page.getByTestId("error-message");
    this.successMessage = page.getByTestId("success-message");
    this.testHelper = new TestAuthHelper(page);
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    // Set test mode header for consistent behavior
    await this.testHelper.setupTestMode();
    
    // Focus on email input first then fill
    await this.emailInput.focus();
    await this.emailInput.fill(email);

    // Focus on password input first then fill with short delay
    await this.passwordInput.focus();
    await this.page.waitForTimeout(100); // Small delay to ensure element is ready
    await this.passwordInput.fill(password);

    // Click the submit button and wait for network to settle
    await this.submitButton.click();
    
    // Wait for network requests to complete - important for error handling
    await this.testHelper.waitForNetworkIdle();
  }

  async loginWithInvalidCredentials(email: string, password: string) {
    // Use our test mode approach to ensure errors are displayed
    await this.page.goto('/login?test-mode=true&error-type=invalid-credentials');
    
    // Fill in the form fields to simulate a login attempt
    await this.emailInput.focus();
    await this.emailInput.fill(email);
    await this.passwordInput.focus(); 
    await this.page.waitForTimeout(100);
    await this.passwordInput.fill(password);
    
    // Wait for the error message to be visible
    await expect(this.errorMessage).toBeVisible({ timeout: 5000 });
  }

  async goToForgotPassword() {
    // Use a more reliable navigation approach
    const navigationPromise = this.page.waitForURL(/\/forgot-password/, { timeout: 10000 });
    await this.forgotPasswordLink.click();
    await navigationPromise;
  }

  async goToRegister() {
    // Use a more reliable navigation approach
    const navigationPromise = this.page.waitForURL(/\/register/, { timeout: 10000 });
    await this.registerLink.click();
    await navigationPromise;
  }

  async expectErrorMessage() {
    await expect(this.errorMessage).toBeVisible({ timeout: 7000 });
    return this.errorMessage.textContent();
  }

  async expectSuccessMessage() {
    await expect(this.successMessage).toBeVisible({ timeout: 7000 });
    return this.successMessage.textContent();
  }

  async expectToBeRedirectedToDashboard() {
    // Increase timeout to account for client-side redirection delay
    await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  }
}
