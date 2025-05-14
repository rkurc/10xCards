import type { APIContext } from "astro";
import { generationIdSchema } from "../../../../schemas/generation";
import { GenerationService } from "../../../../services/generation.service";

export const prerender = false;

export async function GET({ params, locals }: APIContext) {
  try {
    console.log(`[DEBUG-STATUS-API] Status request for generation ID: ${params.generation_id}`);

    // Walidacja parametru generationId
    const validationResult = generationIdSchema.safeParse(params);
    if (!validationResult.success) {
      console.log(`[DEBUG-STATUS-API] Invalid generation ID format: ${JSON.stringify(params)}`);
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy format identyfikatora generacji",
          details: validationResult.error.format(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Pobieranie ID użytkownika z sesji
    const {
      data: { user },
    } = await locals.supabase.auth.getUser();
    if (!user) {
      console.log(`[DEBUG-STATUS-API] Authorization required, user not found`);
      return new Response(JSON.stringify({ error: "Wymagana autoryzacja" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[DEBUG-STATUS-API] Requesting status for user ID: ${user.id}, generation ID: ${params.generation_id}`);

    // Pobieranie statusu generacji
    const generationService = new GenerationService(locals.supabase);
    const status = await generationService.getGenerationStatus(user.id, params.generation_id);

    console.log(`[DEBUG-STATUS-API] Status response: ${JSON.stringify(status)}`);

    if (!status) {
      console.log(`[DEBUG-STATUS-API] Generation process not found`);
      return new Response(JSON.stringify({ error: "Nie znaleziono procesu generacji" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Zwracanie statusu generacji
    console.log(`[DEBUG-STATUS-API] Returning status: ${JSON.stringify(status)}`);
    return new Response(JSON.stringify(status), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error(`[DEBUG-STATUS-API] Error checking generation status:`, error);

    return new Response(JSON.stringify({ error: "Wystąpił błąd wewnętrzny" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
