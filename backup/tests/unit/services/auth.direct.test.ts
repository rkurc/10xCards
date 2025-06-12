// Re-export the tests from the src directory
// This ensures that when this test file is run, it will execute the tests from src
import "../../../src/services/__tests__/auth.direct.test";

// Mock window object when needed
const originalWindow = global.window;
beforeEach(() => {
  // Restore the window object before each test
  global.window = originalWindow;
});

describe("Direct Auth Service", () => {
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

    it("should handle server-side execution", async () => {
      // Mock window as undefined to simulate server-side execution
      global.window = undefined as any;

      const result = await login("test@example.com", "password");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Authentication service unavailable in server environment");
      expect(mockSupabaseAuth.auth.signInWithPassword).not.toHaveBeenCalled();
    });
  });

  describe("register", () => {
    it("should successfully register a user with session", async () => {
      mockSupabaseAuth.auth.signUp.mockResolvedValue({
        data: {
          user: mockUser,
          session: { token: "mock-token" }, // Session exists
        },
        error: null,
      });

      const result = await register("test@example.com", "password", { name: "Test User" });

      expect(result.success).toBe(true);
      expect(result.requiresEmailConfirmation).toBeUndefined();
      expect(result.user).toBeDefined();
    });

    it("should handle registration with email confirmation required", async () => {
      mockSupabaseAuth.auth.signUp.mockResolvedValue({
        data: {
          user: mockUser,
          session: null, // No session indicates email confirmation needed
        },
        error: null,
      });

      const result = await register("test@example.com", "password", { name: "Test User" });

      expect(result.success).toBe(true);
      expect(result.requiresEmailConfirmation).toBe(true);
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

    it("should handle server-side execution", async () => {
      global.window = undefined as any;

      const result = await register("test@example.com", "password");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Registration service unavailable in server environment");
      expect(mockSupabaseAuth.auth.signUp).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("should successfully log out a user", async () => {
      mockSupabaseAuth.auth.signOut.mockResolvedValue({ error: null });

      const result = await logout();

      expect(result.success).toBe(true);
      expect(mockSupabaseAuth.auth.signOut).toHaveBeenCalled();
    });

    it("should handle logout errors", async () => {
      mockSupabaseAuth.auth.signOut.mockResolvedValue({
        error: { message: "Session not found" },
      });

      const result = await logout();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Session not found");
      expect(mockSupabaseAuth.auth.signOut).toHaveBeenCalled();
    });

    it("should handle server-side execution", async () => {
      global.window = undefined as any;

      const result = await logout();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Logout service unavailable in server environment");
      expect(mockSupabaseAuth.auth.signOut).not.toHaveBeenCalled();
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

    it("should return null on server-side", async () => {
      global.window = undefined as any;

      const user = await getCurrentUser();

      expect(user).toBeNull();
      expect(mockSupabaseAuth.auth.getUser).not.toHaveBeenCalled();
    });
  });

  describe("resetPassword", () => {
    it("should successfully request password reset", async () => {
      // Mock window.location for redirectTo URL
      Object.defineProperty(window, "location", {
        value: { origin: "http://localhost:3000" },
        writable: true,
      });

      mockSupabaseAuth.auth.resetPasswordForEmail.mockResolvedValue({
        error: null,
      });

      const result = await resetPassword("test@example.com");

      expect(result.success).toBe(true);
      expect(mockSupabaseAuth.auth.resetPasswordForEmail).toHaveBeenCalledWith("test@example.com", {
        redirectTo: "http://localhost:3000/reset-password",
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

    it("should handle server-side execution", async () => {
      global.window = undefined as any;

      const result = await resetPassword("test@example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Password reset service unavailable in server environment");
      expect(mockSupabaseAuth.auth.resetPasswordForEmail).not.toHaveBeenCalled();
    });
  });

  describe("updatePassword", () => {
    it("should successfully update password", async () => {
      mockSupabaseAuth.auth.updateUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

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

    it("should handle server-side execution", async () => {
      global.window = undefined as any;

      const result = await updatePassword("newpassword");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Password update service unavailable in server environment");
      expect(mockSupabaseAuth.auth.updateUser).not.toHaveBeenCalled();
    });
  });

  describe("updateProfile", () => {
    it("should successfully update profile", async () => {
      mockSupabaseAuth.auth.updateUser.mockResolvedValue({
        data: { user: { ...mockUser, user_metadata: { name: "Updated Name" } } },
        error: null,
      });

      const result = await updateProfile({ name: "Updated Name" });

      expect(result.success).toBe(true);
      expect(result.user?.name).toBe("Updated Name");
      expect(mockSupabaseAuth.auth.updateUser).toHaveBeenCalledWith({
        data: { name: "Updated Name" },
      });
    });

    it("should handle update profile errors", async () => {
      mockSupabaseAuth.auth.updateUser.mockResolvedValue({
        error: { message: "Update failed" },
      });

      const result = await updateProfile({ name: "Updated Name" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Update failed");
    });

    it("should handle server-side execution", async () => {
      global.window = undefined as any;

      const result = await updateProfile({ name: "Updated Name" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Profile update service unavailable in server environment");
      expect(mockSupabaseAuth.auth.updateUser).not.toHaveBeenCalled();
    });
  });

  describe("isEmailVerified", () => {
    it("should return true when email is verified", async () => {
      mockSupabaseAuth.auth.getUser.mockResolvedValue({
        data: {
          user: {
            ...mockUser,
            email_confirmed_at: new Date().toISOString(),
          },
        },
        error: null,
      });

      const verified = await isEmailVerified();
      expect(verified).toBe(true);
    });

    it("should return false when email is not verified", async () => {
      mockSupabaseAuth.auth.getUser.mockResolvedValue({
        data: {
          user: {
            ...mockUser,
            email_confirmed_at: null,
          },
        },
        error: null,
      });

      const verified = await isEmailVerified();
      expect(verified).toBe(false);
    });

    it("should return false when there is no user", async () => {
      mockSupabaseAuth.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const verified = await isEmailVerified();
      expect(verified).toBe(false);
    });

    it("should return false on server-side", async () => {
      global.window = undefined as any;

      const verified = await isEmailVerified();

      expect(verified).toBe(false);
      expect(mockSupabaseAuth.auth.getUser).not.toHaveBeenCalled();
    });
  });
});
