import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Get all cookies for debugging (sanitized)
    const cookieHeader = request.headers.get('Cookie') || '';
    const cookieNames = cookieHeader.split(';')
      .map(cookie => cookie.trim().split('=')[0])
      .filter(Boolean);
    
    // Check for Supabase auth cookies (don't show values for security)
    const hasSbAuthCookie = cookieNames.some(name => 
      name.startsWith('sb-') && (name.includes('auth') || name.includes('access') || name.includes('refresh'))
    );
    
    return new Response(JSON.stringify({
      cookieCount: cookieNames.length,
      cookieNames: cookieNames,
      hasSbAuthCookies: hasSbAuthCookie,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
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
