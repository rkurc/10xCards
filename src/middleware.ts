import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabase.server';

// Ścieżki dostępne publicznie
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
  "/api/auth/logout",
];

export const onRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
    // Inicjalizujemy klienta Supabase dla każdego żądania
    const supabase = createSupabaseServerClient({
      cookies,
      headers: request.headers,
    });
    
    // Dodajemy klienta do locals dla późniejszego użycia
    locals.supabase = supabase;
    
    // Sprawdzamy, czy ścieżka jest publiczna
    const isPublicPath = PUBLIC_PATHS.some(path => 
      url.pathname === path || url.pathname.startsWith(`${path}/`)
    );
    
    // Dla ścieżek publicznych nie sprawdzamy autentykacji
    if (isPublicPath) {
      return next();
    }

    // Najpierw pobieramy sesję, co automatycznie odświeża token jeśli jest to konieczne
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    
    // Sprawdzamy czy wystąpił błąd sesji lub jej brak
    if (sessionError) {
      console.error("Session error:", sessionError);
      
      // Wyloguj użytkownika w przypadku błędu sesji
      await supabase.auth.signOut();
      
      // Przekierowanie na stronę logowania
      const returnUrl = encodeURIComponent(url.pathname + url.search);
      return redirect(`/login?redirect=${returnUrl}`);
    }
    
    // Jeśli mamy poprawną sesję, dodajemy użytkownika do locals
    if (session?.user) {
      locals.user = {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
      };
      return next();
    } else {
      // Brak sesji - przekierowanie na stronę logowania z URL powrotu
      const returnUrl = encodeURIComponent(url.pathname + url.search);
      return redirect(`/login?redirect=${returnUrl}`);
    }
  }
);
