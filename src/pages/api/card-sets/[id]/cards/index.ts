import type { APIContext } from "astro";
import { addCardsToSetSchema, uuidSchema } from "../../../../schemas/card-set";
import { CardSetService } from "../../../../services/card-set.service";

export const prerender = false;

/**
 * POST /api/card-sets/[id]/cards
 * Adds cards to a card set
 */
export async function POST({ params, request, locals }: APIContext) {
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

    // Validate path parameter
    const pathValidation = uuidSchema.safeParse(params);
    if (!pathValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid card set ID",
          details: pathValidation.error.format(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
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
    const validation = addCardsToSetSchema.safeParse(requestBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid card IDs",
          details: validation.error.format(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Add cards to set
    const cardSetService = new CardSetService(locals.supabase);
    const result = await cardSetService.addCardsToSet(user.id, pathValidation.data.id, validation.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Card set not found") {
        return new Response(
          JSON.stringify({
            error: "Card set not found",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      if (error.message === "One or more cards not found") {
        return new Response(
          JSON.stringify({
            error: "One or more cards not found or they don't belong to you",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    console.error("Error adding cards to set:", error);
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
