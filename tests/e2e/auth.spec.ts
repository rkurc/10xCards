import { test, expect } from "@playwright/test";
import { LoginPage } from "./models/LoginPage";
import { RegisterPage } from "./models/RegisterPage";
import { ForgotPasswordPage } from "./models/ForgotPasswordPage";
import { ResetPasswordPage } from "./models/ResetPasswordPage";
import { UserMenu } from "./models/UserMenu";

// Test data
const testUser = {
  name: "Test User",
  email: `test-${Date.now()}@example.com`,
  password: "Password123!",
};

test.describe("Authentication Flows", () => {
  test("User registration flow", async ({ page }) => {
    const registerPage = new RegisterPage(page);

    await registerPage.goto();
    await registerPage.register(testUser.name, testUser.email, testUser.password);

    // Check for either email confirmation or direct dashboard redirect
    if (page.url().includes("registration-success")) {
      await registerPage.expectEmailConfirmationScreen();
    } else {
      await registerPage.expectToBeRedirected();
    }
  });

  test("User login flow", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);

    // Should redirect to dashboard after successful login
    await loginPage.expectToBeRedirectedToDashboard();

    // Check user menu shows the correct user email
    const userMenu = new UserMenu(page);
    await userMenu.expectUserEmail(testUser.email);
  });

  test("Forgot password flow", async ({ page }) => {
    const forgotPasswordPage = new ForgotPasswordPage(page);

    await forgotPasswordPage.goto();
    await forgotPasswordPage.requestPasswordReset(testUser.email);

    // Should show success message
    await forgotPasswordPage.expectSuccessMessage();
  });

  test("Logout flow", async ({ page }) => {
    // First login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.expectToBeRedirectedToDashboard();

    // Then logout
    const userMenu = new UserMenu(page);
    await userMenu.logout();

    // Should redirect back to login page
    await expect(page).toHaveURL(/\/login/);
  });

  // This test would require additional setup to get a real reset token
  test.skip("Reset password flow", async ({ page }) => {
    const resetPasswordPage = new ResetPasswordPage(page);

    // In a real test, you would need to get a valid token
    // This could be done by checking emails in a test account or mocking the backend
    const resetToken = "mock-reset-token";

    await resetPasswordPage.goto(resetToken);
    await resetPasswordPage.resetPassword("NewPassword123!");

    // Should show success message and redirect to login
    await resetPasswordPage.expectSuccessAndRedirect();
  });
});
