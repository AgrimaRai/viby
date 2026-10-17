/**
 * Single source of truth for "is Supabase wired up?".
 *
 * The app runs in two modes:
 *  - **Demo mode** (no env vars): the Zustand store + lib/mock.ts power everything,
 *    so the app is fully clickable with zero backend setup.
 *  - **Connected mode** (env vars present): real Supabase auth + Postgres + Realtime.
 *
 * Every Supabase touchpoint checks this flag first so neither mode breaks the other.
 */
export const hasSupabase =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
