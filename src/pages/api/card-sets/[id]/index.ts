import type { APIContext } from "astro";
import { cardSetCommandSchema, paginationSchema, uuidSchema } from "../../../../schemas/card-set";
import { CardSetService } from "../../../../services/card-set.service";

export const prerender = false;

/**
 * GET /api/card-sets/[id]
 * Returns a specific card set with its cards
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

    // Get card set with cards
    const cardSetService = new CardSetService(locals.supabase);
    const result = await cardSetService.getCardSet(
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
    if (error instanceof Error && error.message === "Card set not found") {
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

    console.error("Error fetching card set:", error);
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
 * PUT /api/card-sets/[id]
 * Updates a specific card set
 */
export async function PUT({ params, request, locals }: APIContext) {
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

    // Update card set
    const cardSetService = new CardSetService(locals.supabase);
    const result = await cardSetService.updateCardSet(user.id, pathValidation.data.id, validation.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Card set not found") {
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

    console.error("Error updating card set:", error);
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
 * DELETE /api/card-sets/[id]
 * Soft-deletes a specific card set
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

    // Delete card set
    const cardSetService = new CardSetService(locals.supabase);
    await cardSetService.deleteCardSet(user.id, pathValidation.data.id);

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Card set not found") {
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

    console.error("Error deleting card set:", error);
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
