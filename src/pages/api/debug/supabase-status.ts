import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase.server';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase client
    const supabase = createSupabaseServerClient({ 
      cookies, 
      headers: request.headers 
    });
    
    // Try to query something simple to test connection
    const { data, error } = await supabase.from('_test_connection')
      .select('*')
      .limit(1)
      .catch(() => ({ data: null, error: { message: "Connection successful but table not found (expected)" } }));
    
    // Check public vars
    const configStatus = {
      supabaseUrl: import.meta.env.PUBLIC_SUPABASE_URL || 'not set',
      anonKeySet: !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    };
    
    return new Response(JSON.stringify({
      success: !error || error.message.includes("not found"),
      config: configStatus,
      connection: {
        timestamp: new Date().toISOString(),
        error: error?.message || null
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
