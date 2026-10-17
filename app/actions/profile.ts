"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/supabase/config";

export type ProfileEdit = {
  displayName: string;
  bio: string;
  interests: string[];
  vibeTags: string[];
  city: string;
  photos: string[];
};

/** Persist profile edits for the signed-in user. No-op in demo mode. */
export async function saveProfile(input: ProfileEdit) {
  if (!hasSupabase) return { ok: true as const };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: input.displayName,
      bio: input.bio,
      interests: input.interests,
      vibe_tags: input.vibeTags,
      city: input.city,
      photos: input.photos,
      avatar_url: input.photos[0] ?? null,
    })
    .eq("id", user.id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/profile");
  revalidatePath(`/u/${user.id}`);
  return { ok: true as const };
}
