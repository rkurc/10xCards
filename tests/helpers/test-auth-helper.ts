import { type Page } from "@playwright/test";

/**
 * Authentication helper for E2E tests
 * Provides utilities for creating test users and authenticating in tests
 */
export class TestAuthHelper {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Set special test mode header to ensure consistent behavior in tests
   */
  async setupTestMode() {
    // Add a header that will be sent with all requests from this page
    await this.page.setExtraHTTPHeaders({
      "x-test-environment": "true",
    });
  }

  /**
   * Create a test user directly via API
   * This bypasses UI registration flow for faster test setup
   */
  async createTestUser(
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; exists?: boolean }> {
    try {
      // Set up test mode
      await this.setupTestMode();

      // Use our dedicated test API endpoint
      const response = await this.page.request.post("/api/testing/auth", {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-test-environment": "true",
        },
        data: {
          action: "create_test_user",
          userData: { name, email, password },
        },
      });

      // Parse response
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error creating test user:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Login a test user directly via API
   * This bypasses UI login flow for faster test setup
   */
  async loginTestUser(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Set up test mode
      await this.setupTestMode();

      // Make direct API call to login endpoint
      const response = await this.page.request.post("/api/auth/login", {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-test-environment": "true",
        },
        data: {
          email,
          password,
        },
      });

      // Parse response
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error logging in test user:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Simulate a login error scenario for testing error display
   */
  async simulateLoginError(): Promise<{ success: boolean; error: string }> {
    try {
      // Set up test mode
      await this.setupTestMode();

      // Use our dedicated test API endpoint
      const response = await this.page.request.post("/api/testing/auth", {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-test-environment": "true",
        },
        data: {
          action: "simulate_login_error",
        },
      });

      // Parse response
      const result = await response.json();

      // This should always return an error
      if (result.success) {
        return { success: false, error: "Expected error but got success response" };
      }

      return result;
    } catch (error) {
      console.error("Error simulating login error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Waits for network idle with timeout, useful for waiting for responses
   */
  async waitForNetworkIdle(timeout = 5000) {
    try {
      await this.page.waitForLoadState("networkidle", { timeout });
    } catch (error) {
      console.warn("Network did not reach idle state within timeout:", error.message);
    }
  }
}
