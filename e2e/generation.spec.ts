import { test, expect } from "@playwright/test";
import { GeneratePage } from "../models/GeneratePage";
import { ReviewResultsPage } from "../models/ReviewResultsPage";
import { TEST_DATA } from "../fixtures/test-data";
import { LoginPage } from "../models/LoginPage";

test.describe("Flash Card Generation E2E Tests", () => {
  // Use a single test case to verify the entire flow for all user stories
  test("should support the complete flash card generation workflow", async ({ page, context }) => {
    // Create page objects
    const loginPage = new LoginPage(page);
    const generatePage = new GeneratePage(page);
    const reviewPage = new ReviewResultsPage(page);

    // Step 1: Log in (assumes auth is required)
    await loginPage.goto();
    await loginPage.login("test@example.com", "password123");

    // Step 2: Navigate to generation page
    await generatePage.goto();

    // Verify page is loaded
    await expect(page).toHaveTitle(/Generate/);

    // US-001: Automated flash card generation from text input
    test.step("US-001: Generate flash cards from text", async () => {
      // Submit text for flash card generation
      await generatePage.submitText(TEST_DATA.sampleText, 5);

      // Verify generation process started
      await expect(generatePage.progressBar).toBeVisible();
      await expect(generatePage.statusMessage).toBeVisible();

      // Wait for generation to complete
      await generatePage.waitForGenerationComplete();
    });

    // US-007: Generation statistics display
    test.step("US-007: Verify generation statistics", async () => {
      // Verify statistics are displayed
      await generatePage.verifyStatisticsDisplayed();

      // Take a snapshot of the statistics panel for visual verification
      await page.locator(".bg-muted").screenshot({ path: "generation-stats.png" });
    });

    // US-008: Readability scoring for cards
    test.step("US-008: Verify readability scores", async () => {
      // Verify readability scores are shown on cards
      await reviewPage.verifyReadabilityScores();
    });

    // US-006: Accepting, modifying, or rejecting AI-generated cards
    test.step("US-006: Manage generated cards", async () => {
      // Get all cards
      const cards = await reviewPage.getAllCards();

      // We need at least 4 cards for our test
      expect(cards.length).toBeGreaterThanOrEqual(4);

      // Process cards according to our test data
      for (let i = 0; i < Math.min(cards.length, TEST_DATA.cardResponses.length); i++) {
        const card = reviewPage.getCardByIndex(i);
        const response = TEST_DATA.cardResponses[i];

        // Edit the card if specified
        if (response.edit) {
          await reviewPage.editCard(card, response.frontContent as string, response.backContent as string);
        }

        // Accept or reject the card
        if (response.accept) {
          await reviewPage.acceptCard(card);
        } else {
          await reviewPage.rejectCard(card);
        }
      }

      // Finalize the generation by creating a set
      await reviewPage.finalizeGeneration(TEST_DATA.setDetails.name, TEST_DATA.setDetails.description);

      // Verify completion message
      await expect(page.locator("text=Flashcards Created Successfully")).toBeVisible();
    });
  });
});
