import type { APIContext } from "astro";
import { CardSetService } from "../../../../../services/card-set.service";
import { paginationSchema, uuidSchema } from "../../../../../schemas/card-set";

export const prerender = false;

/**
 * GET /api/card-sets/[id]/available-cards
 * Returns a paginated list of cards that are not in the specified card set
 */
export async function GET({ params, request, locals }: APIContext) {
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

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get("page") || "1",
      limit: url.searchParams.get("limit") || "10",
    };

    const validation = paginationSchema.safeParse(queryParams);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid pagination parameters",
          details: validation.error.format(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get available cards
    const cardSetService = new CardSetService(locals.supabase);
    const result = await cardSetService.getAvailableCards(
      user.id,
      pathValidation.data.id,
      validation.data.page,
      validation.data.limit
    );

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
    }

    console.error("Error fetching available cards:", error);
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
