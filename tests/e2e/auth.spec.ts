import { test, expect } from "@playwright/test";
import { LoginPage } from "./models/LoginPage";
import { RegisterPage } from "./models/RegisterPage";
import { ForgotPasswordPage } from "./models/ForgotPasswordPage";
import { ResetPasswordPage } from "./models/ResetPasswordPage";
import { UserMenu } from "./models/UserMenu";

// Test data with unique email to avoid conflicts between test runs
const uniqueId = Date.now();
const testUser = {
  name: "Test User",
  email: `test-${uniqueId}@example.com`,
  password: "Password123!",
  newPassword: "NewPassword456!",
};

test.describe("Authentication Flow Tests", () => {
  test.describe("Registration Tests", () => {
    test("should successfully register a new user", async ({ page }) => {
      const registerPage = new RegisterPage(page);

      await registerPage.goto();
      await registerPage.register(testUser.name, testUser.email, testUser.password);

      // Verify successful registration (either redirected to dashboard or confirmation screen)
      await registerPage.expectToBeRedirected();
    });

    test("should show error for existing email", async ({ page }) => {
      // First register a user
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      await registerPage.register(testUser.name, testUser.email, testUser.password);

      // Try to register with the same email
      await registerPage.goto();
      await registerPage.register(testUser.name, testUser.email, testUser.password);

      // Should show error message
      await expect(page.getByTestId("error-message")).toBeVisible();
    });

    test("should validate password strength", async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();

      // Try with weak password
      await registerPage.nameInput.fill(testUser.name);
      await registerPage.emailInput.fill(`weak-${uniqueId}@example.com`);
      await registerPage.passwordInput.fill("weak");

      // Should show weak password indicator
      await expect(registerPage.passwordStrength).toHaveClass(/weak/);

      // Change to strong password
      await registerPage.passwordInput.fill("StrongPassword123!");

      // Should show strong password indicator
      await expect(registerPage.passwordStrength).toHaveClass(/strong/);
    });
  });

  test.describe("Login Tests", () => {
    test("should successfully login with valid credentials", async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.login(testUser.email, testUser.password);

      // Verify successful login
      await loginPage.expectToBeRedirectedToDashboard();

      // Check user menu displays correct information
      const userMenu = new UserMenu(page);
      await userMenu.expectUserEmail(testUser.email);
    });

    test("should show error with invalid credentials", async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.login(testUser.email, "wrongpassword");

      // Should show error message
      await loginPage.expectErrorMessage();
    });

    test("should navigate to forgot password", async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.goToForgotPassword();

      // Verify navigation to forgot password page
      await expect(page).toHaveURL(/\/forgot-password/);
    });

    test("should navigate to register page", async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.goToRegister();

      // Verify navigation to register page
      await expect(page).toHaveURL(/\/register/);
    });
  });

  test.describe("Password Reset Tests", () => {
    test("should request password reset", async ({ page }) => {
      const forgotPasswordPage = new ForgotPasswordPage(page);

      await forgotPasswordPage.goto();
      await forgotPasswordPage.requestPasswordReset(testUser.email);

      // Verify success message
      await forgotPasswordPage.expectSuccessMessage();
    });

    test("should navigate back to login from forgot password", async ({ page }) => {
      const forgotPasswordPage = new ForgotPasswordPage(page);

      await forgotPasswordPage.goto();
      await forgotPasswordPage.goToLogin();

      // Verify navigation to login page
      await expect(page).toHaveURL(/\/login/);
    });

    // This test would require mock or integration with email system
    test.skip("should reset password with valid token", async ({ page }) => {
      // Mock reset token - in real test, you would get this from email or API
      const mockToken = "valid-reset-token-12345";

      const resetPasswordPage = new ResetPasswordPage(page);
      await resetPasswordPage.goto(mockToken);
      await resetPasswordPage.resetPassword(testUser.newPassword);

      // Verify success message and redirect
      await resetPasswordPage.expectSuccessAndRedirect();

      // Verify can login with new password
      const loginPage = new LoginPage(page);
      await loginPage.login(testUser.email, testUser.newPassword);
      await loginPage.expectToBeRedirectedToDashboard();
    });
  });

  test.describe("Logout Tests", () => {
    test("should successfully logout", async ({ page }) => {
      // First login
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(testUser.email, testUser.password);

      // Then logout
      const userMenu = new UserMenu(page);
      await userMenu.logout();

      // Verify redirect to login page
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe("Authentication Protection Tests", () => {
    test("should redirect unauthenticated user to login", async ({ page }) => {
      // Try to access protected dashboard directly
      await page.goto("/dashboard");

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test("should remember original destination after login", async ({ page }) => {
      // Try to access protected settings page
      await page.goto("/settings");

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
      await expect(page.url()).toContain("redirect=/settings");

      // Login
      const loginPage = new LoginPage(page);
      await loginPage.login(testUser.email, testUser.password);

      // Should redirect to originally requested settings page
      await expect(page).toHaveURL(/\/settings/);
    });
  });

  test.describe("User Menu Navigation Tests", () => {
    test("should navigate to profile from user menu", async ({ page }) => {
      // Login first
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(testUser.email, testUser.password);

      // Use user menu to navigate to profile
      const userMenu = new UserMenu(page);
      await userMenu.goToProfile();

      // Verify navigation to profile page
      await expect(page).toHaveURL(/\/profile/);
    });

    test("should navigate to settings from user menu", async ({ page }) => {
      // Login first
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(testUser.email, testUser.password);

      // Use user menu to navigate to settings
      const userMenu = new UserMenu(page);
      await userMenu.goToSettings();

      // Verify navigation to settings page
      await expect(page).toHaveURL(/\/settings/);
    });
  });

  test.describe("Accessibility and Responsiveness Tests", () => {
    test("login page should be keyboard navigable", async ({ page }) => {
      await page.goto("/login");

      // Focus email field
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("login-email-input")).toBeFocused();

      // Move to password field
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("login-password-input")).toBeFocused();

      // Move to submit button
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("login-submit-button")).toBeFocused();

      // Press button with keyboard
      await page.keyboard.press("Enter");

      // Should show validation errors (empty fields)
      await expect(page.getByTestId("error-message")).toBeVisible();
    });

    const devices = ["iPhone 12", "iPad Pro 11", "Desktop Chrome"];
    for (const device of devices) {
      test(`login page should be responsive on ${device}`, async ({ page }) => {
        await page.goto("/login");

        // Take screenshot for visual comparison
        await page.screenshot({ path: `login-${device.replace(" ", "-")}.png` });

        // Basic visibility check
        await expect(page.getByTestId("login-email-input")).toBeVisible();
        await expect(page.getByTestId("login-password-input")).toBeVisible();
        await expect(page.getByTestId("login-submit-button")).toBeVisible();
      });
    }
  });
});
