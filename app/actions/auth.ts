"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/supabase/config";

export type OnboardingInput = {
  displayName: string;
  bio: string;
  interests: string[];
  vibeTags: string[];
  city: string;
  photos: string[];
};

/**
 * Persist the onboarding profile for the signed-in user and flip `onboarded`.
 * No-op in demo mode (the client falls back to the Zustand store).
 */
export async function saveOnboarding(input: OnboardingInput) {
  if (!hasSupabase) return { ok: true as const };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const username =
    (user.email?.split("@")[0] ?? `viby_${user.id.slice(0, 6)}`).toLowerCase();

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    username,
    display_name: input.displayName,
    bio: input.bio,
    interests: input.interests,
    vibe_tags: input.vibeTags,
    city: input.city,
    photos: input.photos,
    onboarded: true,
  });

  return error ? { ok: false as const, error: error.message } : { ok: true as const };
}

/** Sign out (when connected) and return to the landing page. */
export async function signOut() {
  if (hasSupabase) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
