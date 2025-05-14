import type { APIContext } from "astro";
import { cardPathParamsSchema, acceptCardSchema } from "../../../../../../schemas/generation";
import { GenerationService } from "../../../../../../services/generation.service";

export const prerender = false;

export async function POST({ params, request, locals }: APIContext) {
  try {
    // Walidacja parametrów ścieżki
    const paramValidation = cardPathParamsSchema.safeParse(params);
    if (!paramValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy format identyfikatorów",
          details: paramValidation.error.format(),
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

    // Parsowanie i walidacja body
    let requestBody = {};
    try {
      if (request.headers.get("content-length") !== "0") {
        requestBody = await request.json();
      }
    } catch (error) {
      return new Response(JSON.stringify({ error: "Nieprawidłowy format JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const bodyValidation = acceptCardSchema.safeParse(requestBody);
    if (!bodyValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane wejściowe",
          details: bodyValidation.error.format(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Akceptacja fiszki
    const generationService = new GenerationService(locals.supabase);
    try {
      const result = await generationService.acceptCard(
        user.id,
        params.generation_id,
        params.card_id,
        bodyValidation.data
      );

      // Zwracanie informacji o stworzonej fiszce
      return new Response(JSON.stringify(result), { status: 201, headers: { "Content-Type": "application/json" } });
    } catch (serviceError: any) {
      if (serviceError.message?.includes("not found") || serviceError.code === "NOT_FOUND") {
        return new Response(
          JSON.stringify({ error: serviceError.message || "Nie znaleziono procesu generacji, fiszki lub zestawu" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      } else if (serviceError.message?.includes("denied") || serviceError.code === "ACCESS_DENIED") {
        return new Response(JSON.stringify({ error: "Brak dostępu do tego zasobu" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        throw serviceError;
      }
    }
  } catch (error) {
    console.error("Błąd podczas akceptacji fiszki:", error);

    return new Response(JSON.stringify({ error: "Wystąpił błąd wewnętrzny" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
