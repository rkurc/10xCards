import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { env } from '../config/environment';

// Export the typed SupabaseClient for use throughout the application
export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Creates a Supabase client with optional auth token
 * @param authToken Optional JWT token for authenticated requests
 * @returns Typed Supabase client
 */
export function createSupabaseClient(authToken?: string): TypedSupabaseClient {
  const options = authToken 
    ? { 
        global: { 
          headers: { Authorization: `Bearer ${authToken}` } 
        },
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      }
    : {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      };
  
  return createClient<Database>(env.supabase.url, env.supabase.anonKey, options);
}

/**
 * Creates a Supabase admin client with service role privileges
 * Only for server-side operations that require elevated privileges
 * @returns Typed Supabase client with admin privileges
 */
export function createSupabaseAdminClient(): TypedSupabaseClient {
  if (!env.supabase.serviceKey) {
    throw new Error('SUPABASE_SERVICE_KEY is required for admin operations');
  }
  
  return createClient<Database>(
    env.supabase.url, 
    env.supabase.serviceKey, 
    { 
      auth: { 
        persistSession: false,
        autoRefreshToken: false,
      } 
    }
  );
}

/**
 * Singleton instance of the Supabase client for client-side use
 * This should only be used in browser contexts
 */
export const supabaseClient = createSupabaseClient();