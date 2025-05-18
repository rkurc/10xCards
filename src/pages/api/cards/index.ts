import type { APIContext } from "astro";
import { cardCreateSchema } from "../../../schemas/card";
import { CardService } from "../../../services/card.service";

export const prerender = false;

/**
 * POST /api/cards
 * Creates a new card
 */
export async function POST({ request, locals }: APIContext) {
  try {
    // Get user from session
    const {
      data: { user },
    } = await locals.supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate request body
    const validation = cardCreateSchema.safeParse(requestBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid card data",
          details: validation.error.format(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create card
    const cardService = new CardService(locals.supabase);
    const result = await cardService.createCard(user.id, validation.data);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating card:", error);
    return new Response(
      JSON.stringify({
        error: "An error occurred while processing your request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
