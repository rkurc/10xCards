import { createBrowserClient, createServerClient } from "@supabase/ssr";

export const createBrowserSupabaseClient = () => {
  // Add debugging for environment variables

  console.log(
    "[DEBUG] supabase.client: PUBLIC_SUPABASE_URL defined:",
    typeof import.meta.env.PUBLIC_SUPABASE_URL !== "undefined"
  );
  console.log(
    "[DEBUG] supabase.client: PUBLIC_SUPABASE_ANON_KEY defined:",
    typeof import.meta.env.PUBLIC_SUPABASE_ANON_KEY !== "undefined"
  );

  try {
    const client = createBrowserClient(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY);

    return client;
  } catch (error) {
    console.error("[DEBUG] supabase.client: Error creating browser client:", error);
    throw error;
  }
};
