import type { APIRoute } from "astro";
import { generationResultParamsSchema } from "../../../../schemas/generation.schema";
import { GenerationService } from "../../../../services/generation.service";

export const get: APIRoute = async ({ params, locals, request }) => {
  try {
    // Validate path parameters
    const result = generationResultParamsSchema.safeParse(params);
    if (!result.success) {
      return new Response(JSON.stringify({ error: "Invalid generation ID format" }), { status: 400 });
    }

    // Extract user ID from header (simplified auth for now)
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401 });
    }

    // Get generation results
    const generationService = new GenerationService(locals.supabase);
    const response = await generationService.getGenerationResults(userId, result.data.generation_id);

    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Generation not found") {
        return new Response(JSON.stringify({ error: "Generation job not found" }), { status: 404 });
      }
      if (error.message === "Access denied") {
        return new Response(JSON.stringify({ error: "Access denied" }), { status: 403 });
      }
    }

    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
