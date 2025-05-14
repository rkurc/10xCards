import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Access environment variables using Astro's convention
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || "https://mock-supabase-url.com";
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || "mock-key-for-development";

// Add error handling for missing environment variables
if (!import.meta.env.PUBLIC_SUPABASE_URL || !import.meta.env.PUBLIC_SUPABASE_ANON_KEY) {
  console.warn("Supabase environment variables not found. Using mock values for development.");
}

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
