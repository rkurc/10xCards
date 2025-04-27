import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly welcomeMessage: Locator;
  readonly generateCard: Locator;
  readonly setsCard: Locator;
  readonly learnCard: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeMessage = page.getByText(/Witaj/);
    this.generateCard = page.getByText('Generuj fiszki').first();
    this.setsCard = page.getByText('Moje zestawy').first();
    this.learnCard = page.getByText('Rozpocznij naukę').first();
    this.userMenu = page.getByLabel('Menu użytkownika');
    this.logoutButton = page.getByRole('button', { name: 'Wyloguj' });
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async navigateToGenerate() {
    await this.page.getByRole('link', { name: 'Rozpocznij generowanie' }).click();
  }

  async navigateToSets() {
    await this.page.getByRole('link', { name: 'Przeglądaj zestawy' }).click();
  }

  async navigateToLearn() {
    await this.page.getByRole('link', { name: 'Zacznij sesję' }).click();
  }

  async logout() {
    if (this.userMenu)
      await this.userMenu.click();
    await this.logoutButton.click();
  }
}
