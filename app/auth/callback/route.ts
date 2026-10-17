import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/supabase/config";

/**
 * OAuth / magic-link callback. Supabase redirects here with a `code`; we
 * exchange it for a session cookie, then send the user into the app.
 * The (app) layout decides onboarding vs. discover based on profile state.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/discover";

  if (code && hasSupabase) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
