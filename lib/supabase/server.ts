import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Supabase client for RSC / route handlers / server actions.
 * Manages the auth session via Next cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // called from a Server Component — safe to ignore when middleware refreshes sessions
          }
        },
      },
    },
  );
}
