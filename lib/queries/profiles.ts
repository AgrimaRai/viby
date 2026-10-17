import { createClient } from "@/lib/supabase/server";
import type { Profile, Lifestyle } from "@/lib/types";

/** Shape of a `profiles` row (the columns we read). */
export type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  photos: string[] | null;
  interests: string[] | null;
  vibe_tags: string[] | null;
  lifestyle: Lifestyle | null;
  city: string | null;
};

/** Map a DB row to the app's `Profile` shape so components stay unchanged. */
export function mapProfileRow(r: ProfileRow): Profile {
  return {
    id: r.id,
    username: r.username ?? r.id.slice(0, 8),
    displayName: r.display_name ?? "Member",
    age: 24,
    bio: r.bio ?? "",
    avatar: r.avatar_url ?? r.photos?.[0] ?? "",
    photos: r.photos ?? [],
    interests: r.interests ?? [],
    vibeTags: r.vibe_tags ?? [],
    lifestyle: r.lifestyle ?? {},
    city: r.city ?? "",
    distanceKm: 0,
    communities: [],
  };
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url, photos, interests, vibe_tags, lifestyle, city")
    .eq("id", id)
    .maybeSingle();
  return data ? mapProfileRow(data as ProfileRow) : null;
}

export async function getMyProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return getProfileById(user.id);
}
