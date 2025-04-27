import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Check content type
    const contentType = request.headers.get('content-type') || '';
    let body;
    
    // Parse based on content type
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded') || 
              contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      body = { text: await request.text() };
    }
    
    // Echo back the request details for debugging
    return new Response(
      JSON.stringify({
        success: true,
        requestDetails: {
          method: request.method,
          url: request.url,
          headers: Object.fromEntries(request.headers.entries()),
          body: body
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Echo endpoint error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};
