import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. Reads public env vars.
 * In the demo these may be unset — the app runs entirely on the Zustand
 * store (lib/store.ts) seeded from lib/mock.ts. Wire real data by swapping
 * the store reads for queries against this client.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
}
