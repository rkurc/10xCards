import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly userProfile: Locator;
  readonly generateCard: Locator;
  readonly setsCard: Locator;
  readonly learnCard: Locator;
  readonly welcomeMessage: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Main navigation and cards
    this.generateCard = page.getByRole('link', { name: 'Generuj fiszki' });
    this.setsCard = page.getByRole('link', { name: 'Moje zestawy' });
    this.learnCard = page.getByRole('link', { name: 'Rozpocznij naukę' });
    
    // User profile elements
    this.userProfile = page.locator('[data-testid="user-profile"]');
    this.welcomeMessage = page.getByText(/Witaj/);
    this.userMenu = page.getByLabel('Menu użytkownika');
    this.logoutButton = page.getByRole('button', { name: 'Wyloguj' });
  }

  async goto() {
    await this.page.goto('/dashboard', { waitUntil: 'networkidle' });
    await expect(this.userProfile).toBeVisible({ timeout: 10000 });
  }

  async waitForPageLoad() {
    await expect(this.userProfile).toBeVisible({ timeout: 10000 });
    await expect(this.generateCard).toBeVisible({ timeout: 10000 });
    await expect(this.setsCard).toBeVisible({ timeout: 10000 });
    await expect(this.learnCard).toBeVisible({ timeout: 10000 });
  }

  async navigateToGenerate() {
    await this.generateCard.click();
    await this.page.waitForURL(/.*generate/);
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToSets() {
    await this.setsCard.click();
    await this.page.waitForURL(/.*sets/);
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToLearn() {
    await this.learnCard.click();
    await this.page.waitForURL(/.*learn/);
    await this.page.waitForLoadState('networkidle');
  }

  async logout() {
    if (this.userMenu)
      await this.userMenu.click();
    await this.logoutButton.click();
    await this.page.waitForURL('/');
  }
}
