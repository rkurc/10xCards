import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AstroCookies } from "astro";
import type { CookieOptions } from "@supabase/ssr";
import type { APIContext } from "astro";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types";
import { POST as loginHandler } from "../auth/login";
import { POST as registerHandler } from "../auth/register";
import { POST as resetPasswordHandler } from "../auth/reset-password";
import type { AuthSuccessResponse } from "../../../utils/auth/responses";

// Mock error type that matches Supabase error structure
interface AuthError {
  message: string;
  status?: number;
}

interface AuthResponse<T> {
  data: T;
  error: AuthError | null;
}

// Type-safe mock Supabase auth implementation
const mockSupabaseAuth = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
  },
};

// Mock cookie handling functions
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  if (!cookieHeader) return [];
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

// Create type-safe mock cookies object
const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  has: vi.fn(),
  merge: vi.fn(),
  headers: vi.fn(),
  "#private": undefined,
} as unknown as AstroCookies;

interface RequestBody {
  email?: string;
  password?: string;
  userData?: {
    name?: string;
  };
}

// Create mock request function
function mockRequest(body: RequestBody): Request {
  return {
    json: () => Promise.resolve(body),
    headers: new Headers({
      "content-type": "application/json",
      cookie: "",
      accept: "application/json",
    }),
    url: "http://localhost:3000/api/auth/login",
    cache: "default",
    credentials: "same-origin",
    destination: "" as RequestDestination,
    integrity: "",
    method: "POST",
    mode: "cors",
    redirect: "follow",
    referrer: "",
    referrerPolicy: "no-referrer",
    body: JSON.stringify(body),
    bodyUsed: false,
    clone: () => mockRequest(body),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob([])),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(""),
  } as Request;
}

// Helper function to convert case of sameSite
function convertSameSite(sameSite?: boolean | "lax" | "strict" | "none"): "lax" | "strict" | "none" | undefined {
  if (typeof sameSite === "string") {
    return sameSite.toLowerCase() as "lax" | "strict" | "none";
  }
  return undefined;
}

// Create a minimal mock User that satisfies the Supabase User interface
const mockUser: User = {
  id: "test-user-id",
  email: "test@example.com",
  app_metadata: {},
  user_metadata: {
    name: "Test User",
  },
  aud: "authenticated",
  created_at: new Date().toISOString(),
  role: "authenticated",
  updated_at: new Date().toISOString(),
};

// Mock Supabase cookies implementation with proper types
const mockCookieHandling = {
  cookies: {
    get: (name: string) => mockCookies.get(name)?.value || "",
    set: (name: string, value: string, options?: CookieOptions) =>
      mockCookies.set(name, value, {
        ...options,
        sameSite: convertSameSite(options?.sameSite),
      }),
    remove: (name: string, options?: CookieOptions) =>
      mockCookies.delete(name, {
        ...options,
        sameSite: convertSameSite(options?.sameSite),
      }),
    getAll: () => {
      const cookieHeader = mockRequest({}).headers.get("cookie") || "";
      return parseCookieHeader(cookieHeader);
    },
    setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) => {
      cookiesToSet.forEach(({ name, value, options }) =>
        mockCookies.set(name, value, {
          ...options,
          sameSite: convertSameSite(options?.sameSite),
        })
      );
    },
  },
};

// Mock context object with properly typed Supabase client
const createMockContext = (request: Request): APIContext => ({
  request,
  cookies: mockCookies,
  site: new URL("http://localhost:3000"),
  generator: "test",
  props: {},
  url: new URL(request.url),
  redirect: vi.fn(),
  params: {},
  locals: {
    supabase: {
      auth: mockSupabaseAuth.auth,
      ...mockCookieHandling,
    } as unknown as SupabaseClient<Database>,
  },
});

// Mock createSupabaseServerClient
vi.mock("../../../lib/supabase.server", () => ({
  createSupabaseServerClient: vi.fn(() => ({
    ...mockSupabaseAuth,
    ...mockCookieHandling,
  })),
  cookieOptions: {
    path: "/",
    secure: false,
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60,
  },
}));

describe("Auth API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default successful responses
    mockSupabaseAuth.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null,
    } as AuthResponse<{ user: User | null; session: null }>);

    mockSupabaseAuth.auth.signUp.mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null,
    } as AuthResponse<{ user: User | null; session: null }>);

    mockSupabaseAuth.auth.resetPasswordForEmail.mockResolvedValue({
      error: null,
    });
  });

  describe("/api/auth/login", () => {
    it("should successfully login a user", async () => {
      const request = mockRequest({
        email: "test@example.com",
        password: "password123",
      });
      const response = await loginHandler(createMockContext(request));

      expect(response.status).toBe(200);
      const data: AuthSuccessResponse = await response.json();
      expect(data).toEqual({
        success: true,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.user_metadata.name,
        },
      });
    });

    it("should handle login errors", async () => {
      mockSupabaseAuth.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials" },
      } as AuthResponse<{ user: User | null; session: null }>);

      const request = mockRequest({
        email: "test@example.com",
        password: "wrongpassword",
      });
      const response = await loginHandler(createMockContext(request));

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({
        success: false,
        error: "Invalid login credentials",
      });
    });
  });

  describe("/api/auth/register", () => {
    it("should successfully register a user", async () => {
      const request = mockRequest({
        email: "test@example.com",
        password: "password123",
        userData: { name: "Test User" },
      });
      const response = await registerHandler(createMockContext(request));

      expect(response.status).toBe(200);
      const data: AuthSuccessResponse = await response.json();
      expect(data).toEqual({
        success: true,
        requiresEmailConfirmation: true,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.user_metadata.name,
        },
      });
    });

    it("should handle registration with existing email", async () => {
      mockSupabaseAuth.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "User already registered" },
      } as AuthResponse<{ user: User | null; session: null }>);

      const request = mockRequest({
        email: "existing@example.com",
        password: "password123",
      });
      const response = await registerHandler(createMockContext(request));

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({
        success: false,
        error: "User already registered",
      });
    });
  });

  describe("/api/auth/reset-password", () => {
    it("should successfully request password reset", async () => {
      const request = mockRequest({
        email: "test@example.com",
      });
      const response = await resetPasswordHandler(createMockContext(request));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        success: true,
      });
    });

    it("should handle reset password for non-existent email", async () => {
      mockSupabaseAuth.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: "Email not found" },
      });

      const request = mockRequest({
        email: "nonexistent@example.com",
      });
      const response = await resetPasswordHandler(createMockContext(request));

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({
        success: false,
        error: "Email not found",
      });
    });
  });
});
