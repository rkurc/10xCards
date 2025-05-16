import type { APIContext } from "astro";
import { uuidSchema } from "../../../../../../schemas/card-set";
import { CardSetService } from "../../../../../../services/card-set.service";

export const prerender = false;

/**
 * DELETE /api/card-sets/[id]/cards/[cardId]
 * Removes a card from a set
 */
export async function DELETE({ params, locals }: APIContext) {
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

    // Validate set ID parameter
    const setIdValidation = uuidSchema.safeParse({ id: params.id });
    if (!setIdValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid card set ID",
          details: setIdValidation.error.format(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate card ID parameter
    const cardIdValidation = uuidSchema.safeParse({ id: params.cardId });
    if (!cardIdValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid card ID",
          details: cardIdValidation.error.format(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Remove card from set
    const cardSetService = new CardSetService(locals.supabase);
    await cardSetService.removeCardFromSet(user.id, setIdValidation.data.id, cardIdValidation.data.id);

    return new Response(null, {
      status: 204,
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
      if (error.message === "Card not found") {
        return new Response(
          JSON.stringify({
            error: "Card not found",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      if (error.message === "Card is not in this set") {
        return new Response(
          JSON.stringify({
            error: "Card is not in this set",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    console.error("Error removing card from set:", error);
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
