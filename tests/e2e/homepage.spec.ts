import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("has title and links", async ({ page }) => {
    await page.goto("/");

    // Check page title
    await expect(page).toHaveTitle(/10xCards/);

    // Check for main navigation elements
    await expect(page.getByRole("link", { name: "Logowanie" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Rejestracja" })).toBeVisible();

    // Check for primary call-to-action - using first() to handle multiple matching elements
    await expect(page.getByRole("button", { name: /Zarejestruj się za darmo/i }).first()).toBeVisible();
  });
});
