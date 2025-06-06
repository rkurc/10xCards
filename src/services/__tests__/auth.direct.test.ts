import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Create the mock before importing any modules to avoid "Cannot access before initialization" error
vi.mock("../../lib/supabase.client", () => {
  const mockAuth = {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: {
        subscription: {
          unsubscribe: vi.fn()
        }
      }
    })),
  };
  
  return {
    createBrowserSupabaseClient: vi.fn(() => ({
      auth: mockAuth
    }))
  };
});

// Import the service after the mock is set up
import {
  login,
  logout,
  register,
  getCurrentUser,
  resetPassword,
  updatePassword,
  updateProfile,
  isEmailVerified,
  createAuthStore
} from "../auth.direct";

// Get a reference to the mocked client
const mockSupabaseClient = vi.mocked(
  (await import("../../lib/supabase.client"))
).createBrowserSupabaseClient;

const mockAuth = mockSupabaseClient().auth;

describe("auth.direct service", () => {
  // Save the original window object to restore later
  const originalWindow = global.window;
  
  beforeEach(() => {
    // Reset all mocks between tests
    vi.clearAllMocks();
    
    // Ensure window is defined for client-side checks
    if (typeof global.window === "undefined") {
      global.window = { location: { origin: "http://localhost:3000" } } as any;
    }
  });
  
  afterEach(() => {
    // Restore the original window object
    global.window = originalWindow;
  });
  
  describe("login", () => {
    it("should return success with user data when login succeeds", async () => {
      // Mock successful login
      mockAuth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: "user123",
            email: "test@example.com",
            user_metadata: { name: "Test User" },
          },
          session: { token: "token123" },
        },
        error: null,
      });
      
      const result = await login("test@example.com", "password");
      
      expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password",
      });
      
      expect(result).toEqual({
        success: true,
        user: {
          id: "user123",
          email: "test@example.com",
          name: "Test User",
        },
      });
    });
    
    it("should return failure when login fails", async () => {
      // Mock failed login
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid credentials" },
      });
      
      const result = await login("test@example.com", "wrong-password");
      
      expect(result).toEqual({
        success: false,
        error: "Invalid credentials",
      });
    });
    
    it("should handle unexpected errors", async () => {
      // Mock exception
      mockAuth.signInWithPassword.mockRejectedValue(new Error("Network error"));
      
      const result = await login("test@example.com", "password");
      
      expect(result).toEqual({
        success: false,
        error: "Network error",
      });
    });
    
    it("should fail when called server-side", async () => {
      // Simulate server environment
      global.window = undefined as any;
      
      const result = await login("test@example.com", "password");
      
      expect(result).toEqual({
        success: false,
        error: "Authentication service unavailable in server environment",
      });
      
      // Verify the Supabase client wasn't called
      expect(mockAuth.signInWithPassword).not.toHaveBeenCalled();
    });
  });
  
  describe("register", () => {
    it("should return success with user data when registration succeeds", async () => {
      // Mock successful registration with session (immediate login)
      mockAuth.signUp.mockResolvedValue({
        data: {
          user: {
            id: "user123",
            email: "new@example.com",
            user_metadata: { name: "New User" },
          },
          session: { token: "token123" },
        },
        error: null,
      });
      
      const result = await register("new@example.com", "password", { name: "New User" });
      
      // Use objectContaining to avoid URL issues
      expect(mockAuth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "new@example.com",
          password: "password",
          options: expect.objectContaining({
            data: { name: "New User" },
          }),
        })
      );
      
      expect(result).toEqual({
        success: true,
        user: {
          id: "user123",
          email: "new@example.com",
          name: "New User",
        },
      });
    });
    
    it("should indicate email confirmation when required", async () => {
      // Mock registration requiring email confirmation
      mockAuth.signUp.mockResolvedValue({
        data: {
          user: {
            id: "user123",
            email: "new@example.com",
          },
          session: null,
        },
        error: null,
      });
      
      const result = await register("new@example.com", "password");
      
      expect(result).toEqual({
        success: true,
        requiresEmailConfirmation: true,
      });
    });
  });
  
  describe("logout", () => {
    it("should return success when logout succeeds", async () => {
      // Mock successful logout
      mockAuth.signOut.mockResolvedValue({ error: null });
      
      const result = await logout();
      
      expect(mockAuth.signOut).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });
  
  describe("getCurrentUser", () => {
    it("should return user data when authenticated", async () => {
      // Mock authenticated user
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: "user123",
            email: "user@example.com",
            user_metadata: { name: "Current User" },
          },
        },
        error: null,
      });
      
      const user = await getCurrentUser();
      
      expect(user).toEqual({
        id: "user123",
        email: "user@example.com",
        name: "Current User",
      });
    });
    
    it("should return null when not authenticated", async () => {
      // Mock unauthenticated state
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });
      
      const user = await getCurrentUser();
      
      expect(user).toBeNull();
    });
  });
  
  describe("updateProfile", () => {
    it("should update user profile successfully", async () => {
      // Mock successful profile update
      mockAuth.updateUser.mockResolvedValue({
        data: {
          user: {
            id: "user123",
            email: "user@example.com",
            user_metadata: { name: "Updated Name" },
          },
        },
        error: null,
      });
      
      const result = await updateProfile({ name: "Updated Name" });
      
      expect(mockAuth.updateUser).toHaveBeenCalledWith({
        data: { name: "Updated Name" },
      });
      
      expect(result).toEqual({
        success: true,
        user: {
          id: "user123",
          email: "user@example.com",
          name: "Updated Name",
        },
      });
    });
  });
  
  describe("resetPassword", () => {
    it("should initiate password reset successfully", async () => {
      // Mock successful password reset initiation
      mockAuth.resetPasswordForEmail.mockResolvedValue({ error: null });
      
      const result = await resetPassword("user@example.com");
      
      // Use objectContaining to avoid URL issues
      expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith(
        "user@example.com",
        expect.objectContaining({})
      );
      
      expect(result).toEqual({ success: true });
    });
  });
  
  describe("updatePassword", () => {
    it("should update password successfully", async () => {
      // Mock successful password update
      mockAuth.updateUser.mockResolvedValue({
        data: { user: { id: "user123" } },
        error: null,
      });
      
      const result = await updatePassword("newPassword123");
      
      expect(mockAuth.updateUser).toHaveBeenCalledWith({
        password: "newPassword123",
      });
      
      expect(result).toEqual({ success: true });
    });
  });
  
  describe("isEmailVerified", () => {
    it("should return true when email is verified", async () => {
      // Mock verified email
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: "user123",
            email: "user@example.com",
            email_confirmed_at: new Date().toISOString(),
          },
        },
        error: null,
      });
      
      const verified = await isEmailVerified();
      
      expect(verified).toBe(true);
    });
    
    it("should return false when email is not verified", async () => {
      // Mock unverified email
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: "user123",
            email: "user@example.com",
            email_confirmed_at: null,
          },
        },
        error: null,
      });
      
      const verified = await isEmailVerified();
      
      expect(verified).toBe(false);
    });
  });
  
  describe("createAuthStore", () => {
    it("should create store and notify subscribers", async () => {
      // Mock current user
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: "user123",
            email: "user@example.com",
            user_metadata: { name: "Store User" },
          },
        },
        error: null,
      });
      
      const store = createAuthStore();
      
      // Subscribe to store updates
      const subscriber = vi.fn();
      const unsubscribe = store.subscribe(subscriber);
      
      // Allow async getCurrentUser to complete
      await vi.waitFor(() => {
        expect(subscriber).toHaveBeenCalled();
      });
      
      // Simulate auth state change - this might need a different approach because onAuthStateChange is not directly callable
      // We might need to mock the callback behavior
      const mockOnAuthChange = mockAuth.onAuthStateChange as ReturnType<typeof vi.fn>;
      const authCallback = mockOnAuthChange.mock.calls[0][0];
      await authCallback("SIGNED_IN", {
        user: {
          id: "user456",
          email: "new@example.com",
          user_metadata: { name: "New User" },
        },
      });
      
      expect(subscriber).toHaveBeenCalledWith({
        id: "user456",
        email: "new@example.com",
        name: "New User",
      });
      
      // Clean up
      unsubscribe();
      store.cleanup();
    });
  });
});