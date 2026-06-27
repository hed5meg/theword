"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export async function addReflection(formData: FormData) {
  const targetType = String(formData.get("target_type") ?? "");
  const targetId = String(formData.get("target_id") ?? "");
  const parentId = String(formData.get("parent_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const path = String(formData.get("path") ?? "/");

  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(path)}`);

  if (!body) {
    revalidatePath(path);
    return;
  }

  await sb.from("reflections").insert({
    author_id: user.id,
    target_type: targetType,
    target_id: targetId,
    parent_id: parentId || null,
    body,
  });

  revalidatePath(path);
}
