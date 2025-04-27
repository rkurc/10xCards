import { createBrowserClient, createServerClient } from '@supabase/ssr';

export const createBrowserSupabaseClient = () => {
  return createBrowserClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  );
};
