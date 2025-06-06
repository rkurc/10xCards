import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth, createApiError, createApiResponse } from "../api-auth";
import { ErrorCode } from "../db-error-handler";
import type { User } from "../../types/auth.types";

// Create a mock APIContext type that matches what we need for testing
interface MockAPIContext {
  locals: {
    user?: User;
    [key: string]: unknown;
  };
  request: Request;
  [key: string]: unknown;
}

describe("API Authentication Utilities", () => {
  // Mock APIContext
  let mockContext: MockAPIContext;

  beforeEach(() => {
    // Reset mock context before each test
    mockContext = {
      locals: {
        user: undefined, // User is undefined by default (not authenticated)
        supabase: {},   // Mock Supabase client
      },
      request: new Request("https://example.com/api/test"),
    };
  });

  describe("requireAuth", () => {
    it("should return null when user is authenticated", () => {
      // Setup authenticated context with the user property
      mockContext.locals.user = { id: "test-user-id", email: "test@example.com", name: "Test User" };

      const result = requireAuth(mockContext as any);
      expect(result).toBeNull();
    });

    it("should return an unauthorized response when user is not authenticated", () => {
      // User is undefined which means not authenticated
      const result = requireAuth(mockContext as any);

      expect(result).toBeInstanceOf(Response);
      expect(result?.status).toBe(401);

      // Verify response body
      return result?.json().then((body) => {
        expect(body).toMatchObject({
          code: "UNAUTHORIZED",
          message: expect.stringContaining("Authentication required"),
          status: 401,
        });
      });
    });
  });

  describe("createApiError", () => {
    it("should create a formatted error response from a string", () => {
      const response = createApiError("Test error message", 400);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(400);

      return response.json().then((body) => {
        expect(body).toMatchObject({
          code: "API_ERROR",
          message: "Test error message",
          status: 400,
        });
      });
    });

    it("should create a formatted error response from an Error object", () => {
      const error = new Error("Test error");
      const response = createApiError(error, 500);

      expect(response.status).toBe(500);

      return response.json().then((body) => {
        expect(body).toMatchObject({
          code: "API_ERROR",
          message: "Test error",
          status: 500,
          details: expect.any(String), // Stack trace
        });
      });
    });

    it("should use error properties from a structured error object", () => {
      const error = {
        code: ErrorCode.NOT_FOUND,
        message: "Resource not found",
        status: 404,
        details: { id: "missing-id" },
      };

      const response = createApiError(error);

      expect(response.status).toBe(404);

      return response.json().then((body) => {
        expect(body).toEqual(error);
      });
    });
  });

  describe("createApiResponse", () => {
    it("should create a formatted success response", () => {
      const data = { id: "123", name: "Test" };
      const response = createApiResponse(data, 200);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");

      return response.json().then((body) => {
        expect(body).toEqual(data);
      });
    });

    it("should use custom status code when provided", () => {
      const data = { id: "123" };
      const response = createApiResponse(data, 201); // Created

      expect(response.status).toBe(201);

      return response.json().then((body) => {
        expect(body).toEqual(data);
      });
    });
  });
});
