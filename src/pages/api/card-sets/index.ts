import type { APIContext } from "astro";
import { paginationSchema, cardSetCommandSchema } from "../../../schemas/card-set";
import { CardSetService } from "../../../services/card-set.service";

export const prerender = false;

/**
 * GET /api/card-sets
 * Returns a paginated list of user's card sets
 */
export async function GET({ request, locals }: APIContext) {
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

    // Get card sets
    const cardSetService = new CardSetService(locals.supabase);
    const result = await cardSetService.listCardSets(user.id, validation.data.page, validation.data.limit);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching card sets:", error);
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

/**
 * POST /api/card-sets
 * Creates a new card set
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
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate request body
    const validation = cardSetCommandSchema.safeParse(requestBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid card set data",
          details: validation.error.format(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create card set
    const cardSetService = new CardSetService(locals.supabase);
    const result = await cardSetService.createCardSet(user.id, validation.data);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating card set:", error);
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
