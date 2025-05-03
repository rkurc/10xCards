import { Page, Locator, expect } from "@playwright/test";

/**
 * Page Object Model for the Review Results page
 * Handles interactions with the generated flash cards review UI
 */
export class ReviewResultsPage {
  readonly page: Page;
  readonly cards: Locator;
  readonly acceptAllButton: Locator;
  readonly finalizeButton: Locator;
  readonly setNameInput: Locator;
  readonly setDescriptionInput: Locator;
  readonly createSetButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cards = page.locator(".card").filter({ hasText: "Front" });
    this.acceptAllButton = page.getByRole("button", { name: "Accept All" });
    this.finalizeButton = page.getByRole("button", { name: /Finalize/ });
    this.setNameInput = page.locator("#set-name");
    this.setDescriptionInput = page.locator("#set-description");
    this.createSetButton = page.getByRole("button", { name: "Create Set" });
  }

  /**
   * Get all card elements
   */
  async getAllCards() {
    return await this.cards.all();
  }

  /**
   * Get a specific card by index
   * @param index Zero-based index of the card
   */
  getCardByIndex(index: number) {
    return this.cards.nth(index);
  }

  /**
   * Flip a card to see its back content
   * @param cardLocator The card locator
   */
  async flipCard(cardLocator: Locator) {
    await cardLocator.click();
    // Wait for the flip animation to complete
    await this.page.waitForTimeout(300);
  }

  /**
   * Edit a specific card
   * @param cardLocator The card locator
   * @param frontContent New front content
   * @param backContent New back content
   */
  async editCard(cardLocator: Locator, frontContent: string, backContent: string) {
    const editButton = cardLocator.getByRole("button", { name: "Edit" });
    await editButton.click();

    // Find the textarea elements within this card
    const frontTextarea = cardLocator.locator("textarea").first();
    const backTextarea = cardLocator.locator("textarea").last();

    // Fill in the new content
    await frontTextarea.fill(frontContent);
    await backTextarea.fill(backContent);

    // Save the changes
    const saveButton = cardLocator.getByRole("button", { name: "Save" });
    await saveButton.click();
  }

  /**
   * Accept a specific card
   * @param cardLocator The card locator
   */
  async acceptCard(cardLocator: Locator) {
    const acceptButton = cardLocator.getByRole("button", { name: "Accept" });
    await acceptButton.click();
  }

  /**
   * Reject a specific card
   * @param cardLocator The card locator
   */
  async rejectCard(cardLocator: Locator) {
    const rejectButton = cardLocator.getByRole("button", { name: "Reject" });
    await rejectButton.click();
  }

  /**
   * Accept all cards with one click
   */
  async acceptAllCards() {
    await this.acceptAllButton.click();
  }

  /**
   * Finalize the generation and create a set
   * @param setName The name for the new set
   * @param setDescription Optional description for the set
   */
  async finalizeGeneration(setName: string, setDescription: string = "") {
    await this.finalizeButton.click();

    // Wait for the dialog to appear
    await this.setNameInput.waitFor();

    // Fill in the set details
    await this.setNameInput.fill(setName);
    await this.setDescriptionInput.fill(setDescription);

    // Create the set
    await this.createSetButton.click();
  }

  /**
   * Verify that readability scores are displayed for cards
   */
  async verifyReadabilityScores() {
    // Check for readability score badges on cards
    const cards = await this.getAllCards();

    // Ensure we have at least one card
    expect(cards.length).toBeGreaterThan(0);

    // Check the first card has a readability score badge
    const firstCardBadge = cards[0].locator(".badge");
    await expect(firstCardBadge).toBeVisible();

    // Get the text content which should be a percentage
    const scoreText = await firstCardBadge.textContent();

    // Should contain a number followed by %
    expect(scoreText).toMatch(/\d+%/);
  }
}
