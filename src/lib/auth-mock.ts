/**
 * Mock authentication service for local development and testing
 * This bypasses actual Supabase auth calls to help debug UI issues
 */

interface MockUser {
  id: string;
  email: string;
  name?: string;
}

const MOCK_USERS = [
  {
    email: "test@example.com",
    password: "password123",
    user: {
      id: "mock-user-1",
      email: "test@example.com",
      name: "Test User"
    }
  },
  {
    email: "admin@example.com",
    password: "admin123",
    user: {
      id: "mock-user-2",
      email: "admin@example.com",
      name: "Admin User"
    }
  }
];

export const mockAuth = {
  /**
   * Mock login that always succeeds with test credentials
   */
  login: async (email: string, password: string): Promise<{ success: boolean; user?: MockUser; error?: string }> => {
    console.log("🔒 MOCK AUTH: Login attempt", { email });
    
    // Simulate network delay for more realistic testing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Find matching user
    const matchedUser = MOCK_USERS.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    
    if (matchedUser) {
      console.log("🔒 MOCK AUTH: Login successful", { user: matchedUser.user });
      return { 
        success: true, 
        user: matchedUser.user 
      };
    }
    
    // Always succeed with the default test user if not found
    if (email === "test@example.com" && password === "password123") {
      return { 
        success: true, 
        user: {
          id: "mock-user-default",
          email: "test@example.com",
          name: "Test Default"
        } 
      };
    }
    
    console.log("🔒 MOCK AUTH: Login failed - invalid credentials");
    return {
      success: false,
      error: "Invalid email or password."
    };
  }
};
