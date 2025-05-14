import type { APIContext } from "astro";
import { generationIdSchema } from "../../../../schemas/generation";
import { GenerationService } from "../../../../services/generation.service";

export const prerender = false;

export async function GET({ params, locals }: APIContext) {
  try {
    // Walidacja parametru generationId
    const validationResult = generationIdSchema.safeParse(params);
    if (!validationResult.success) {
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
      return new Response(JSON.stringify({ error: "Wymagana autoryzacja" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Pobieranie wyników generacji
    const generationService = new GenerationService(locals.supabase);
    try {
      const results = await generationService.getGenerationResults(user.id, params.generation_id);

      // Zwracanie wyników generacji
      return new Response(JSON.stringify(results), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (serviceError: any) {
      // Obsługa różnych typów błędów serwisowych
      if (serviceError.code === "NOT_FOUND") {
        return new Response(JSON.stringify({ error: "Nie znaleziono procesu generacji" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      } else if (serviceError.code === "ACCESS_DENIED") {
        return new Response(JSON.stringify({ error: "Brak dostępu do tego zasobu" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        throw serviceError; // Przekazanie do głównego catch
      }
    }
  } catch (error) {
    console.error("Błąd podczas pobierania wyników generacji:", error);

    return new Response(JSON.stringify({ error: "Wystąpił błąd wewnętrzny" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
