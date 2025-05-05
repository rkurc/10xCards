import { Page, Locator, expect } from "@playwright/test";

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
    this.userMenuButton = page.getByTestId("user-menu-button");
    this.userAvatar = page.getByTestId("user-avatar");
    this.userMenuDropdown = page.getByTestId("user-menu-dropdown");
    this.userEmail = page.getByTestId("user-menu-email");
    this.profileLink = page.getByTestId("user-menu-profile-link");
    this.settingsLink = page.getByTestId("user-menu-settings-link");
    this.logoutButton = page.getByTestId("user-menu-logout-button");
  }

  async open() {
    await this.userMenuButton.click();
    await expect(this.userMenuDropdown).toBeVisible();
  }

  async logout() {
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
    await this.open();
    await expect(this.userEmail).toContainText(email);
  }
}
