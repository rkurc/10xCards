import type { APIContext } from "astro";
import { cardPathParamsSchema } from "../../../../../../schemas/generation";
import { GenerationService } from "../../../../../../services/generation.service";

export const prerender = false;

export async function POST({ params, locals }: APIContext) {
  try {
    // Walidacja parametrów ścieżki
    const paramValidation = cardPathParamsSchema.safeParse(params);
    if (!paramValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy format identyfikatorów",
          details: paramValidation.error.format()
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

    // Odrzucanie fiszki
    const generationService = new GenerationService(locals.supabase);
    try {
      await generationService.rejectCard(
        user.id,
        params.generation_id,
        params.card_id
      );

      // Zwracanie pustej odpowiedzi (204 No Content)
      return new Response(null, { status: 204 });
    } catch (serviceError: any) {
      if (serviceError.message?.includes("not found") || serviceError.code === "NOT_FOUND") {
        return new Response(
          JSON.stringify({ error: serviceError.message || "Nie znaleziono procesu generacji lub fiszki" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      } else if (serviceError.message?.includes("denied") || serviceError.code === "ACCESS_DENIED") {
        return new Response(
          JSON.stringify({ error: "Brak dostępu do tego zasobu" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      } else {
        throw serviceError;
      }
    }
  } catch (error) {
    console.error("Błąd podczas odrzucania fiszki:", error);
    
    return new Response(
      JSON.stringify({ error: "Wystąpił błąd wewnętrzny" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
