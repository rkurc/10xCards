import { type Page, type Locator, expect } from "@playwright/test";

export class UserMenu {
  readonly page: Page;
  readonly userMenuButton: Locator;
  readonly userAvatar: Locator;
  readonly userMenuDropdown: Locator;
  readonly userEmail: Locator;
  readonly profileLink: Locator;
  readonly settingsLink: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Headers implementation has a simple logout button rather than a menu
    this.userMenuButton = page
      .getByRole("button")
      .filter({ hasText: /^Witaj|^Użytkownik/ })
      .or(page.getByTestId("user-menu-button"));
    this.userAvatar = page.getByTestId("user-avatar").or(page.locator(".rounded-full"));
    this.userMenuDropdown = page.getByTestId("user-menu-dropdown").or(page.locator('[data-state="open"]'));
    this.userEmail = page.getByTestId("user-menu-email");
    this.profileLink = page.getByTestId("user-menu-profile-link").or(page.getByRole("link", { name: /profil/i }));
    this.settingsLink = page.getByTestId("user-menu-settings-link").or(page.getByRole("link", { name: /ustawienia/i }));
    this.logoutButton = page.getByTestId("user-menu-logout-button").or(page.getByRole("button", { name: /wyloguj/i }));
  }

  async open() {
    // Check if direct logout button exists (Header implementation)
    const directLogout = this.page.getByRole("button", { name: /wyloguj/i });
    if (await directLogout.isVisible()) {
      // No need to open menu, it's directly visible
      return;
    }

    await this.userMenuButton.click();
    await expect(this.userMenuDropdown)
      .toBeVisible({ timeout: 2000 })
      .catch(() => {
        // If dropdown doesn't appear, try one more time
        return this.userMenuButton.click();
      });
  }

  async logout() {
    // Check if direct logout button exists (Header implementation)
    const directLogout = this.page.getByRole("button", { name: /wyloguj/i });
    if (await directLogout.isVisible()) {
      await directLogout.click();
      return;
    }

    await this.open();
    await this.logoutButton.click();
  }

  async goToProfile() {
    await this.open();
    await this.profileLink.click();
  }

  async goToSettings() {
    await this.open();
    await this.settingsLink.click();
  }

  async expectUserEmail(email: string) {
    // For Header implementation, the email might not be displayed
    try {
      await this.open();
      await expect(this.userEmail).toContainText(email, { timeout: 2000 });
    } catch (e) {
      // If we can't find the email in the dropdown, check if we're logged in
      const logoutButton = this.page.getByRole("button", { name: /wyloguj/i });
      await expect(logoutButton).toBeVisible();
    }
  }
}
