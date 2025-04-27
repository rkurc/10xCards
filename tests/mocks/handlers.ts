import { http, HttpResponse } from 'msw';

// Define handlers for mock API endpoints
export const handlers = [
  // Authentication handlers
  http.post('/api/auth/login', () => {
    return HttpResponse.json({ 
      user: { 
        id: '123', 
        email: 'test@example.com',
        name: 'Test User'
      }
    });
  }),
  
  http.post('/api/auth/register', () => {
    return HttpResponse.json({
      user: { 
        id: '123', 
        email: 'new@example.com',
        name: 'New User'
      }
    });
  }),

  // Generation API handlers
  http.post('/api/generation/process-text', async ({ request }) => {
    const body = await request.json();
    
    return HttpResponse.json({
      id: 'generated-123',
      cards: [
        { 
          id: 'card-1', 
          front: 'Pytanie 1?', 
          back: 'Odpowiedź 1' 
        },
        { 
          id: 'card-2', 
          front: 'Pytanie 2?', 
          back: 'Odpowiedź 2' 
        }
      ],
      stats: {
        generationTime: 1.2,
        textLength: body.text.length
      }
    });
  }),
];
