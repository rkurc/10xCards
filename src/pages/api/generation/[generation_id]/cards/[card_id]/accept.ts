import type { APIRoute } from "astro";
import {
  generationCardParamsSchema,
  generationCardAcceptCommandSchema,
} from "../../../../../../schemas/generation.schema";
import { GenerationService } from "../../../../../../services/generation.service";

export const post: APIRoute = async ({ params, locals, request }) => {
  try {
    // Validate path parameters
    const pathResult = generationCardParamsSchema.safeParse(params);
    if (!pathResult.success) {
      return new Response(JSON.stringify({ error: "Invalid generation ID or card ID format" }), { status: 400 });
    }

    // Extract user ID from header
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const commandResult = generationCardAcceptCommandSchema.safeParse(body);
    if (!commandResult.success) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400 });
    }

    // Accept the card
    const generationService = new GenerationService(locals.supabase);
    const response = await generationService.acceptCard(
      userId,
      pathResult.data.generation_id,
      pathResult.data.card_id,
      commandResult.data
    );

    return new Response(JSON.stringify(response), { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Generation not found") {
        return new Response(JSON.stringify({ error: "Generation job not found" }), { status: 404 });
      }
      if (error.message === "Generated card not found") {
        return new Response(JSON.stringify({ error: "Generated card not found" }), { status: 404 });
      }
      if (error.message === "Card set not found") {
        return new Response(JSON.stringify({ error: "Card set not found" }), { status: 404 });
      }
      if (error.message === "Access denied") {
        return new Response(JSON.stringify({ error: "Access denied" }), { status: 403 });
      }
    }

    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
