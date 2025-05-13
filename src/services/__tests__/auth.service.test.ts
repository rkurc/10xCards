import { describe, it, expect, vi, beforeEach } from "vitest";
import { login, register, logout, resetPassword, updatePassword, getCurrentUser } from "../auth.service";
import { createBrowserSupabaseClient } from "../../lib/supabase.client";

// Mock Supabase client implementation
const mockSupabaseAuth = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    getUser: vi.fn(),
  },
};

// Mock createBrowserSupabaseClient
vi.mock("../../lib/supabase.client", () => ({
  createBrowserSupabaseClient: vi.fn(() => ({
    ...mockSupabaseAuth,
  })),
}));

describe("Auth Service", () => {
  const mockUser = {
    id: "test-user-id",
    email: "test@example.com",
    user_metadata: {
      name: "Test User",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("should successfully login a user", async () => {
      mockSupabaseAuth.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await login("test@example.com", "password");

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.user_metadata.name,
      });
      expect(mockSupabaseAuth.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password",
      });
    });

    it("should handle login errors", async () => {
      mockSupabaseAuth.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid credentials" },
      });

      const result = await login("test@example.com", "wrongpassword");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid credentials");
    });
  });

  describe("register", () => {
    it("should successfully register a user", async () => {
      mockSupabaseAuth.auth.signUp.mockResolvedValue({
        data: {
          user: mockUser,
          session: null,
        },
        error: null,
      });

      const result = await register("test@example.com", "password", { name: "Test User" });

      expect(result.success).toBe(true);
      expect(result.requiresEmailConfirmation).toBe(true);
      // User is not returned in register result according to RegisterResult type
    });

    it("should handle registration errors", async () => {
      mockSupabaseAuth.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Email already taken" },
      });

      const result = await register("test@example.com", "password");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email already taken");
    });
  });

  describe("logout", () => {
    it("should successfully log out a user", async () => {
      mockSupabaseAuth.auth.signOut.mockResolvedValue({ error: null });

      await logout();
      expect(mockSupabaseAuth.auth.signOut).toHaveBeenCalled();
    });

    it("should handle logout errors silently", async () => {
      mockSupabaseAuth.auth.signOut.mockResolvedValue({
        error: { message: "Session not found" },
      });

      await logout();
      expect(mockSupabaseAuth.auth.signOut).toHaveBeenCalled();
    });
  });

  describe("resetPassword", () => {
    it("should successfully request password reset", async () => {
      mockSupabaseAuth.auth.resetPasswordForEmail.mockResolvedValue({
        error: null,
      });

      const result = await resetPassword("test@example.com");

      expect(result.success).toBe(true);
      expect(mockSupabaseAuth.auth.resetPasswordForEmail).toHaveBeenCalledWith("test@example.com", {
        redirectTo: expect.stringContaining("/reset-password"),
      });
    });

    it("should handle reset password errors", async () => {
      mockSupabaseAuth.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: "Email not found" },
      });

      const result = await resetPassword("test@example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email not found");
    });
  });

  describe("updatePassword", () => {
    it("should successfully update password", async () => {
      mockSupabaseAuth.auth.updateUser.mockResolvedValue({ error: null });

      const result = await updatePassword("newpassword");

      expect(result.success).toBe(true);
      expect(mockSupabaseAuth.auth.updateUser).toHaveBeenCalledWith({
        password: "newpassword",
      });
    });

    it("should handle update password errors", async () => {
      mockSupabaseAuth.auth.updateUser.mockResolvedValue({
        error: { message: "Invalid password" },
      });

      const result = await updatePassword("newpassword");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid password");
    });
  });

  describe("getCurrentUser", () => {
    it("should return current user if authenticated", async () => {
      mockSupabaseAuth.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const user = await getCurrentUser();

      expect(user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.user_metadata.name,
      });
    });

    it("should return null if not authenticated", async () => {
      mockSupabaseAuth.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });

    it("should return null on error", async () => {
      mockSupabaseAuth.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Session expired" },
      });

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });
  });
});
