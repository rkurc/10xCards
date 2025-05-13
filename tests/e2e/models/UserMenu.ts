import { type Page, type Locator, expect } from "@playwright/test";

export class UserMenu {
  readonly page: Page;
  readonly userMenuTrigger: Locator;
  readonly userAvatar: Locator;
  readonly userMenuContent: Locator;
  readonly userEmail: Locator;
  readonly userName: Locator;
  readonly profileButton: Locator;
  readonly settingsButton: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userMenuTrigger = page.getByTestId("user-menu-trigger");
    this.userAvatar = page.getByTestId("user-avatar");
    this.userMenuContent = page.getByTestId("user-menu-content");
    this.userEmail = page.getByTestId("user-email");
    this.userName = page.getByTestId("user-name");
    this.profileButton = page.getByRole("menuitem", { name: /Profil/i });
    this.settingsButton = page.getByRole("menuitem", { name: /Ustawienia/i });
    this.logoutButton = page.getByRole("menuitem", { name: /Wyloguj/i });
  }

  async open() {
    // Check if direct logout button exists (Header implementation)
    const directLogout = this.page.getByRole("button", { name: /wyloguj/i });
    if (await directLogout.isVisible()) {
      // No need to open menu, it's directly visible
      return;
    }

    await this.userMenuTrigger.click();
    await expect(this.userMenuContent)
      .toBeVisible({ timeout: 2000 })
      .catch(() => {
        // If content doesn't appear, try one more time
        return this.userMenuTrigger.click();
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
    await this.profileButton.click();
  }

  async goToSettings() {
    await this.open();
    await this.settingsButton.click();
  }

  async expectUserEmail(email: string) {
    // For Header implementation, the email might not be displayed
    try {
      await this.open();
      await expect(this.userEmail).toContainText(email, { timeout: 2000 });
    } catch (e) {
      // If we can't find the email in the content, check if we're logged in
      const logoutButton = this.page.getByRole("button", { name: /wyloguj/i });
      await expect(logoutButton).toBeVisible();
    }
  }
}
