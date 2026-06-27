"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

/** Any signed-in member may flag an item for a steward's gentle attention. */
export async function createFlag(formData: FormData) {
  const targetType = String(formData.get("target_type") ?? "");
  const targetId = String(formData.get("target_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const path = String(formData.get("path") ?? "/");

  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(path)}`);

  await sb.from("flags").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason: reason || null,
  });

  revalidatePath(path);
}

export async function resolveFlag(formData: FormData) {
  const id = String(formData.get("flag_id") ?? "");
  const sb = await createServerSupabase();
  await sb.from("flags").update({ status: "resolved" }).eq("id", id);
  revalidatePath("/steward");
}

export async function setReflectionHidden(formData: FormData) {
  const id = String(formData.get("reflection_id") ?? "");
  const hidden = String(formData.get("hidden") ?? "") === "true";
  const sb = await createServerSupabase();
  await sb.from("reflections").update({ hidden }).eq("id", id);
  revalidatePath("/steward");
}

export async function setRenderingStatus(formData: FormData) {
  const id = String(formData.get("rendering_id") ?? "");
  const status = String(formData.get("status") ?? "submitted");
  const sb = await createServerSupabase();
  await sb.from("renderings").update({ status }).eq("id", id);
  revalidatePath("/steward");
}
