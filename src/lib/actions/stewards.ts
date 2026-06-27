"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

/** Admin-only: grant or revoke a member's role (enforced in the DB function). */
export async function setMemberRole(formData: FormData) {
  const handle = String(formData.get("handle") ?? "")
    .trim()
    .replace(/^@/, "");
  const role = String(formData.get("role") ?? "member");

  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/signin?next=/steward");

  const { error } = await sb.rpc("set_member_role", {
    target_handle: handle,
    new_role: role,
  });

  revalidatePath("/steward");
  if (error) redirect("/steward?role=error");
  redirect("/steward?role=ok");
}
