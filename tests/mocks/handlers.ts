import { http, HttpResponse } from "msw";
import type { OpenRouterChatRequest } from "../../../src/types/openrouter.types";

// Define handlers for mock API endpoints
export const handlers = [
  // Authentication handlers
  http.post("/api/auth/login", () => {
    return HttpResponse.json({
      user: {
        id: "123",
        email: "test@example.com",
        name: "Test User",
      },
    });
  }),

  http.post("/api/auth/register", () => {
    return HttpResponse.json({
      user: {
        id: "123",
        email: "new@example.com",
        name: "New User",
      },
    });
  }),

  // Generation API handlers
  http.post("/api/generation/process-text", async ({ request }) => {
    const body = (await request.json()) as { text: string };

    return HttpResponse.json({
      id: "generated-123",
      cards: [
        {
          id: "card-1",
          front: "Pytanie 1?",
          back: "Odpowiedź 1",
        },
        {
          id: "card-2",
          front: "Pytanie 2?",
          back: "Odpowiedź 2",
        },
      ],
      stats: {
        generationTime: 1.2,
        textLength: body.text.length,
      },
    });
  }),
  
  // Card sets API handlers
  http.get("/api/card-sets", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 10;
    
    return HttpResponse.json({
      cardSets: [
        {
          id: "set-1",
          name: "Test Set 1",
          description: "Example set for testing",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          cardsCount: 10,
        }
      ],
      pagination: {
        page,
        limit,
        total: 1,
        totalPages: 1,
      }
    });
  }),

  // OpenRouter API handlers
  http.post("https://openrouter.ai/api/v1/chat/completions", async ({ request }) => {
    // Simulate auth error for missing or invalid API key
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return HttpResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
    }

    const body = (await request.json()) as OpenRouterChatRequest;

    // Rate limit error simulation
    if (body.messages?.[0]?.content?.includes("trigger_rate_limit")) {
      return HttpResponse.json({ error: { message: "Too many requests" } }, { status: 429 });
    }

    // Invalid model error simulation
    if (body.model?.includes("invalid")) {
      return HttpResponse.json({ error: { type: "invalid_model", param: body.model } }, { status: 400 });
    }

    // Context length error simulation
    if (body.messages?.[0]?.content?.length > 1000) {
      return HttpResponse.json({ error: { type: "context_length_exceeded" } }, { status: 400 });
    }

    // If response_format is set, return a JSON response
    if (body.response_format?.type === "json_schema") {
      return HttpResponse.json({
        id: "gen-123",
        object: "chat.completion",
        created: Date.now(),
        model: body.model,
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                cards: [
                  {
                    question: "Question 1",
                    answer: "Answer 1",
                    notes: "Note 1",
                  },
                  {
                    question: "Question 2",
                    answer: "Answer 2",
                  },
                ],
              }),
            },
            index: 0,
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 20,
          total_tokens: 70,
        },
      });
    }

    // Regular text response
    return HttpResponse.json({
      id: "gen-123",
      object: "chat.completion",
      created: Date.now(),
      model: body.model,
      choices: [
        {
          message: {
            role: "assistant",
            content: "Test response",
          },
          index: 0,
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 50,
        completion_tokens: 20,
        total_tokens: 70,
      },
    });
  }),

  http.post("https://openrouter.ai/api/v1/models", () => {
    return HttpResponse.json({
      data: [
        {
          id: "model1",
          name: "Test Model 1",
        },
        {
          id: "model2",
          name: "Test Model 2",
        },
      ],
    });
  }),
];
