"use server";

import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/supabase/config";

export type ReportInput = {
  targetType: "profile" | "post" | "message" | "group" | "comment";
  targetId: string;
  reason: string;
  note?: string;
};

/** File a report. Persists in connected mode; no-op in demo (store handles UI). */
export async function reportContent(input: ReportInput) {
  if (!hasSupabase) return { ok: true as const };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason,
    note: input.note ?? null,
  });
  return error ? { ok: false as const, error: error.message } : { ok: true as const };
}

export async function blockUser(blockedId: string) {
  if (!hasSupabase) return { ok: true as const };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase
    .from("blocks")
    .upsert({ blocker_id: user.id, blocked_id: blockedId });
  return error ? { ok: false as const, error: error.message } : { ok: true as const };
}

export async function unblockUser(blockedId: string) {
  if (!hasSupabase) return { ok: true as const };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", blockedId);
  return { ok: true as const };
}
