import type { APIContext } from "astro";
import { generationIdSchema, acceptAllSchema } from "../../../../schemas/generation";
import { GenerationService } from "../../../../services/generation.service";

export const prerender = false;

export async function POST({ params, request, locals }: APIContext) {
  try {
    // Walidacja parametru generationId
    const paramValidation = generationIdSchema.safeParse(params);
    if (!paramValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy format identyfikatora generacji",
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

    // Parsowanie i walidacja body
    let requestBody = {};
    try {
      if (request.headers.get("content-length") !== "0") {
        requestBody = await request.json();
      }
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowy format JSON" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const bodyValidation = acceptAllSchema.safeParse(requestBody);
    if (!bodyValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane wejściowe",
          details: bodyValidation.error.format()
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Akceptacja wszystkich fiszek
    const generationService = new GenerationService(locals.supabase);
    try {
      const result = await generationService.acceptAllCards(
        user.id,
        params.generation_id,
        bodyValidation.data
      );

      // Zwracanie informacji o zaakceptowanych fiszkach
      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (serviceError: any) {
      // Obsługa różnych typów błędów serwisowych
      if (serviceError.code === "NOT_FOUND" || serviceError.message?.includes("not found")) {
        return new Response(
          JSON.stringify({ error: serviceError.message || "Nie znaleziono procesu generacji lub zestawu" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      } else if (serviceError.code === "ACCESS_DENIED" || serviceError.message?.includes("denied")) {
        return new Response(
          JSON.stringify({ error: "Brak dostępu do tego zasobu" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      } else {
        throw serviceError; // Przekazanie do głównego catch
      }
    }
  } catch (error) {
    console.error("Błąd podczas akceptacji wszystkich fiszek:", error);
    
    return new Response(
      JSON.stringify({ error: "Wystąpił błąd wewnętrzny" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
