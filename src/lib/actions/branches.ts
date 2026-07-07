"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Rename a branch (and edit its description). The slug is kept stable so existing
 * links never break — the name is the human label, the slug a permanent id. Only
 * the branch's author may do this (RLS enforces it too).
 */
export async function renameBranch(formData: FormData) {
  const path = String(formData.get("path") ?? "/");
  const slug = String(formData.get("branch_slug") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(path)}`);
  if (!slug || !name) {
    revalidatePath(path);
    return;
  }

  await sb
    .from("branches")
    .update({
      name,
      description: description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("author_id", user.id)
    .eq("slug", slug);

  revalidatePath(path);
}
