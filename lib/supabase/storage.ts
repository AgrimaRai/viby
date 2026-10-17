import { createClient } from "./client";

const BUCKET = "photos";

/**
 * Upload an image to Supabase Storage under an optimized per-user path and
 * return its public URL. Used by onboarding, profile editing, and the feed
 * composer. Only call this in connected mode (guard with `hasSupabase`).
 */
export async function uploadImage(file: File, folder = "uploads"): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${user?.id ?? "anon"}/${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Delete a previously uploaded image by its public URL (cleanup). */
export async function removeImageByUrl(url: string): Promise<void> {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = url.slice(idx + marker.length);
  await createClient().storage.from(BUCKET).remove([path]);
}
