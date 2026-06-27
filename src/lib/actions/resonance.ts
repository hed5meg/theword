"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Toggle the signed-in member's resonance for a target. Additive in spirit —
 * a single positive signal that can be given or quietly withdrawn, never a
 * downvote.
 */
export async function toggleResonance(formData: FormData) {
  const targetType = String(formData.get("target_type") ?? "");
  const targetId = String(formData.get("target_id") ?? "");
  const path = String(formData.get("path") ?? "/");

  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(path)}`);

  const { data: existing } = await sb
    .from("resonances")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing) {
    await sb.from("resonances").delete().eq("id", existing.id);
  } else {
    await sb
      .from("resonances")
      .insert({ user_id: user.id, target_type: targetType, target_id: targetId });
  }

  revalidatePath(path);
}
