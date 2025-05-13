import type { APIContext } from "astro";
import { generationIdSchema, finalizeGenerationSchema } from "../../../../schemas/generation";
import { GenerationService } from "../../../../services/generation.service";

export const prerender = false;

export async function POST({ params, request, locals }: APIContext) {
  try {
    // Validate generation ID
    const paramValidation = generationIdSchema.safeParse(params);
    if (!paramValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy format identyfikatora generacji",
          details: paramValidation.error.format(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user from session
    const {
      data: { user },
    } = await locals.supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Wymagana autoryzacja" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return new Response(JSON.stringify({ error: "Nieprawidłowy format JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const bodyValidation = finalizeGenerationSchema.safeParse(requestBody);
    if (!bodyValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane wejściowe",
          details: bodyValidation.error.format(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create generation service with timestamp handling
    const generationService = new GenerationService(locals.supabase);
    try {
      // Pass the generation ID as is - the service should handle both formats
      const result = await generationService.finalizeGeneration(user.id, params.generation_id, bodyValidation.data);

      return new Response(JSON.stringify(result), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (serviceError: any) {
      // Obsługa różnych typów błędów serwisowych
      if (serviceError.code === "NOT_FOUND") {
        return new Response(JSON.stringify({ error: serviceError.message || "Nie znaleziono procesu generacji" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      } else if (serviceError.code === "ACCESS_DENIED") {
        return new Response(JSON.stringify({ error: "Brak dostępu do tego zasobu" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      } else if (serviceError.code === "INVALID_CARDS") {
        return new Response(
          JSON.stringify({ error: "Jedna lub więcej wybranych fiszek nie należy do tego procesu generacji" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      } else {
        throw serviceError; // Przekazanie do głównego catch
      }
    }
  } catch (error) {
    console.error("Błąd podczas finalizacji procesu generowania:", error);

    return new Response(JSON.stringify({ error: "Wystąpił błąd wewnętrzny" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
