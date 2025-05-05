import { test, expect } from "@playwright/test";
import { LoginPage } from "./models/LoginPage";
import { DashboardPage } from "./models/DashboardPage";

test.describe("Autentykacja", () => {
  const TEST_USER = {
    email: process.env.E2E_USERNAME || "piotr.supa@test.org",
    password: process.env.E2E_PASSWORD || "@T3stP4ssw0rd!@#",
  };

  test("Poprawne logowanie przekierowuje do dashboard", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Navigate to login
    await loginPage.goto();

    // Enable auto-redirect interception
    await page.route("**/*", async (route) => {
      const url = route.request().url();
      console.log("Intercepted request to:", url);
      await route.continue();
    });

    // Perform login with correct credentials
    await loginPage.login(TEST_USER.email, TEST_USER.password);

    // Wait a moment to allow any redirects to happen
    await page.waitForTimeout(3000);

    console.log("Current URL after login:", page.url());

    // Check if we're on the dashboard or still on login page
    if (page.url().includes("/dashboard")) {
      console.log("Successfully redirected to dashboard");
      await dashboardPage.waitForPageLoad();
      await expect(dashboardPage.welcomeMessage).toBeVisible({ timeout: 10000 });
    } else {
      // If we're still on login page, check for any API error response
      const errorText = (await page.locator(".bg-red-50, .text-red-500, [data-testid='error-message']").textContent()) || "";
      console.log("Error message on page:", errorText);

      // Take a screenshot for debugging
      await page.screenshot({ path: "test-results/login-failure.png" });

      // Verify we should be on dashboard (this will fail, but with a helpful message)
      await expect(page.url()).toContain("dashboard", { message: "Failed to redirect to dashboard after login" });
    }
  });

  test("Błędne dane logowania pokazują komunikat błędu", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Navigate to login page
    await loginPage.goto();

    // Perform login with invalid credentials
    await loginPage.login("invalid@example.com", "wrongpassword");

    // Wait a bit for any error messages to appear
    await page.waitForTimeout(2000);

    // Take screenshot for debugging
    await page.screenshot({ path: "test-results/login-error.png" });

    // Check for any visible error message with a more flexible approach
    // Updated to include our data-testid attribute from the implementation
    const errorElements = await page.locator('div[class*="text-red"], div[class*="bg-red"], [data-testid="error-message"]').all();

    if (errorElements.length === 0) {
      console.log("HTML of page after failed login:", await page.content());
    }

    // Assert that some kind of error is visible
    expect(errorElements.length, "Expected at least one error element to be visible").toBeGreaterThan(0);

    // Verify we stay on login page
    await expect(page).toHaveURL(/.*login/);
  });
});
