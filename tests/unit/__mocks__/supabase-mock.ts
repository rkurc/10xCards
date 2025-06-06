import { vi } from "vitest";

// Mock Supabase client implementation
export const mockSupabaseAuth = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    getUser: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: {
        subscription: {
          unsubscribe: vi.fn()
        }
      }
    })),
  },
};

// Create a function that returns the Vitest mock with proper typing
export function createSupabaseMock() {
  return vi.fn(() => mockSupabaseAuth);
}
