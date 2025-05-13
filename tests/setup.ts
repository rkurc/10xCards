import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { expect, vi } from "vitest";
import { server } from "./mocks/server";

// Ensure test environment values match .env.development values
process.env.PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
process.env.PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

// Mock Vite's import.meta.env
// @ts-expect-error - mocking import.meta
globalThis.import = {
  meta: {
    env: {
      DEV: true,
      PROD: false,
      MODE: 'development',
      SSR: true,
      PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL,
      PUBLIC_SUPABASE_ANON_KEY: process.env.PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};

// Create mock storage for Supabase
const createMockStorage = () => {
  let data = new Map();
  return {
    getItem: (key: string) => data.get(key) || null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
    clear: () => data.clear(),
  };
};

// Mock localStorage and sessionStorage
Object.defineProperty(window, 'localStorage', { value: createMockStorage() });
Object.defineProperty(window, 'sessionStorage', { value: createMockStorage() });

// Extend vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Setup mock service worker
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  // Clear storage between tests
  window.localStorage.clear();
  window.sessionStorage.clear();
});
afterAll(() => server.close());
