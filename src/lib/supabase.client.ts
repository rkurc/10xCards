import { createBrowserClient } from "@supabase/ssr";

export const createBrowserSupabaseClient = () => {
  if (!import.meta.env.PUBLIC_SUPABASE_URL || !import.meta.env.PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      "Missing required environment variables: PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY must be defined"
    );
  }
  return createBrowserClient(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY);
};
