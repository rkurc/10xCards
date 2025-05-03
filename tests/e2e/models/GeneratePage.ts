import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Generate page
 * Handles interactions with the flash card generation UI
 */
export class GeneratePage {
  readonly page: Page;
  readonly textInput: Locator;
  readonly targetCountInput: Locator;
  readonly generateButton: Locator;
  readonly progressBar: Locator;
  readonly statusMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.textInput = page.locator('textarea#text');
    this.targetCountInput = page.locator('input#target-count');
    this.generateButton = page.getByRole('button', { name: /Generate Cards/i });
    this.progressBar = page.locator('.progress');
    this.statusMessage = page.locator('h3:has-text("Generating")').first();
  }

  /**
   * Navigate to the generate page
   */
  async goto() {
    await this.page.goto('/generate');
  }

  /**
   * Submit text for flash card generation
   * @param text The text to generate flash cards from
   * @param targetCount The target number of cards to generate
   */
  async submitText(text: string, targetCount = 10) {
    await this.textInput.fill(text);
    await this.targetCountInput.clear();
    await this.targetCountInput.fill(targetCount.toString());
    await this.generateButton.click();
  }

  /**
   * Wait for the generation process to complete
   * @param timeout Maximum time to wait in milliseconds
   */
  async waitForGenerationComplete(timeout = 30000) {
    // Wait for the "Generation complete!" message
    await this.page.locator('h3:has-text("Generation complete")').waitFor({ timeout });
  }

  /**
   * Verify that generation statistics are displayed
   */
  async verifyStatisticsDisplayed() {
    // Check for statistics elements
    const statsPanel = this.page.locator('.bg-muted');
    await expect(statsPanel).toBeVisible();
    
    // Verify statistics categories
    await expect(statsPanel.locator('text=Text Length')).toBeVisible();
    await expect(statsPanel.locator('text=Generated')).toBeVisible();
    await expect(statsPanel.locator('text=Generation Time')).toBeVisible();
  }
}