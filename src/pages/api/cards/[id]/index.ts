import type { APIContext } from "astro";
import { cardUpdateSchema, uuidSchema } from "../../../../schemas/card";
import { CardService } from "../../../../services/card.service";

export const prerender = false;

/**
 * GET /api/cards/[id]
 * Returns a specific card
 */
export async function GET({ params, locals }: APIContext) {
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
          error: "Invalid card ID",
          details: pathValidation.error.format(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get card
    const cardService = new CardService(locals.supabase);
    const result = await cardService.getCard(user.id, pathValidation.data.id);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Card not found") {
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

    console.error("Error fetching card:", error);
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
 * PUT /api/cards/[id]
 * Updates a specific card
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
          error: "Invalid card ID",
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
    const validation = cardUpdateSchema.safeParse(requestBody);
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

    // Update card
    const cardService = new CardService(locals.supabase);
    const result = await cardService.updateCard(user.id, pathValidation.data.id, validation.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Card not found") {
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

    console.error("Error updating card:", error);
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
 * DELETE /api/cards/[id]
 * Soft-deletes a specific card
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
          error: "Invalid card ID",
          details: pathValidation.error.format(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Delete card (soft-delete)
    const cardService = new CardService(locals.supabase);
    await cardService.deleteCard(user.id, pathValidation.data.id);

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Card not found") {
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

    console.error("Error deleting card:", error);
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
