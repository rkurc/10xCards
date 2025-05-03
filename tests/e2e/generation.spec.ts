import { test, expect } from "@playwright/test";
import { GeneratePage } from "./models/GeneratePage";
import { ReviewResultsPage } from "./models/ReviewResultsPage";
import { TEST_DATA } from "./fixtures/test-data";
import { LoginPage } from "./models/LoginPage";
import { DashboardPage } from "./models/DashboardPage";

const TEST_USER = {
  email: process.env.E2E_USERNAME || "piotr.supa@test.org",
  password: process.env.E2E_PASSWORD || "@T3stP4ssw0rd!@#",
};

test.describe("Flash Card Generation E2E Tests", () => {
  test.beforeEach(async ({ page, context }) => {
    // First navigate to login page
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Listen for the login response to capture auth token
    const loginResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/auth/login") && response.status() === 200
    );

    // Perform login
    await loginPage.login(TEST_USER.email, TEST_USER.password);

    // Wait for login response
    const loginResponse = await loginResponsePromise;
    const responseData = await loginResponse.json();

    // Wait for auth cookies to be set
    await page.waitForTimeout(1000);

    // Verify successful login
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should support the complete flash card generation workflow", async ({ page }) => {
    // Create page objects
    const generatePage = new GeneratePage(page);
    const reviewPage = new ReviewResultsPage(page);
    const dashboardPage = new DashboardPage(page);

    // Verify we're logged in
    test.step("Verify authentication state", async () => {
      await dashboardPage.goto();
      await expect(dashboardPage.userProfile).toBeVisible({ timeout: 10000 });
    });

    // Step 2: Navigate to generation page
    await generatePage.goto();

    // Verify page is loaded
    await expect(page).toHaveTitle(/Generate/);

    // US-001: Automated flash card generation from text input
    test.step("US-001: Generate flash cards from text", async () => {
      // Submit text for flash card generation
      const response = await generatePage.submitText(TEST_DATA.sampleText, 5);

      // Verify the API response contains expected data
      expect(response.status()).toBe(202); // Accepted
      const responseData = await response.json();
      expect(responseData).toHaveProperty("generation_id");
      expect(responseData).toHaveProperty("estimated_time_seconds");

      // Store the generation ID for later steps
      const generationId = responseData.generation_id;
      page.evaluate((id) => sessionStorage.setItem("current_generation_id", id), generationId);

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

      // Verify API calls to status endpoint
      const statusRequests = await page.waitForResponse(
        (response) => response.url().includes("/api/generation/") && response.url().includes("/status"),
        { timeout: 5000 }
      );
      expect(statusRequests.status()).toBe(200);

      // Take a snapshot of the statistics panel for visual verification
      await page.locator(".statistics-panel").screenshot({ path: "generation-stats.png" });
    });

    // US-008: Readability scoring for cards
    test.step("US-008: Verify readability scores", async () => {
      // Verify readability scores are shown on cards
      await reviewPage.verifyReadabilityScores();

      // Verify the results API was called
      const resultsRequest = await page.waitForResponse(
        (response) => response.url().includes("/api/generation/") && response.url().includes("/results"),
        { timeout: 5000 }
      );
      expect(resultsRequest.status()).toBe(200);
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

          // Verify the accept API is called with edit data
          const acceptRequest = page.waitForRequest(
            (request) => request.url().includes("/accept") && request.method() === "POST"
          );

          await reviewPage.acceptCard(card);
          const request = await acceptRequest;
          const postData = request.postDataJSON();
          expect(postData).toHaveProperty("front_content");
          expect(postData).toHaveProperty("back_content");
        } else if (response.accept) {
          // Just accept without editing
          await reviewPage.acceptCard(card);
        } else {
          // Reject the card
          const rejectRequest = page.waitForRequest(
            (request) => request.url().includes("/reject") && request.method() === "POST"
          );

          await reviewPage.rejectCard(card);
          await rejectRequest;
        }
      }

      // Monitor the finalize transaction API call
      const finalizePromise = page.waitForResponse(
        (response) => response.url().includes("/finalize") && response.method() === "POST"
      );

      // Finalize the generation by creating a set
      await reviewPage.finalizeGeneration(TEST_DATA.setDetails.name, TEST_DATA.setDetails.description);

      // Verify the transaction API was called successfully
      const finalizeResponse = await finalizePromise;
      expect(finalizeResponse.status()).toBe(200);
      const finalizeData = await finalizeResponse.json();
      expect(finalizeData).toHaveProperty("set_id");
      expect(finalizeData).toHaveProperty("card_count");
      expect(finalizeData.name).toBe(TEST_DATA.setDetails.name);

      // Verify completion message
      await expect(page.locator("text=Flashcards Created Successfully")).toBeVisible();

      // Verify we get redirected to the newly created set
      await expect(page.url()).toContain(`/sets/${finalizeData.set_id}`);
    });
  });

  // Additional test for authentication error cases
  test("should handle authentication errors correctly", async ({ page, context }) => {
    // Clear authentication
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());

    // Try to access generation page
    await page.goto("/generate");

    // Should be redirected to login
    await expect(page.url()).toContain("/login");

    // Try direct API access without auth
    const response = await page.request.post("/api/generation/process-text", {
      data: {
        text: "Test text without authentication",
        target_count: 3,
      },
    });

    // Verify authentication error
    expect(response.status()).toBe(401);
    const responseData = await response.json();
    expect(responseData.code).toBe("UNAUTHORIZED");
  });
});
