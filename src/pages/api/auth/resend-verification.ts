import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../lib/supabase.server";

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const email = url.searchParams.get("email");

  if (!email) {
    return redirect("/login?error=Email is required for verification resend");
  }

  const supabase = createSupabaseServerClient({ cookies, headers: new Headers() });

  try {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${url.origin}/auth-callback`,
      },
    });

    if (error) {
      console.error("Error resending verification email:", error);
      return redirect(
        `/registration-success?email=${encodeURIComponent(email)}&error=${encodeURIComponent(error.message)}`
      );
    }

    return redirect(`/registration-success?email=${encodeURIComponent(email)}&message=Verification email resent`);
  } catch (error) {
    console.error("Unexpected error resending verification email:", error);
    return redirect(`/registration-success?email=${encodeURIComponent(email)}&error=Wystąpił nieoczekiwany błąd`);
  }
};
