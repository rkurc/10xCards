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
          details: validationResult.error.format()
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Pobieranie ID użytkownika z sesji
    const { data: { user } } = await locals.supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Wymagana autoryzacja" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Pobieranie statusu generacji
    const generationService = new GenerationService(locals.supabase);
    const status = await generationService.getGenerationStatus(
      user.id, 
      params.generation_id
    );

    if (!status) {
      return new Response(
        JSON.stringify({ error: "Nie znaleziono procesu generacji" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Zwracanie statusu generacji
    return new Response(
      JSON.stringify(status),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Błąd podczas sprawdzania statusu generacji:", error);
    
    return new Response(
      JSON.stringify({ error: "Wystąpił błąd wewnętrzny" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
