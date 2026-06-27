"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

function toList(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function updateProfile(formData: FormData) {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/signin?next=/account");

  const displayName = String(formData.get("display_name") ?? "").trim();
  const handle = String(formData.get("handle") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const bio = String(formData.get("bio") ?? "").trim();

  if (!displayName || !handle) {
    redirect("/account?error=required");
  }

  const { error } = await sb
    .from("profiles")
    .update({
      display_name: displayName,
      handle,
      bio: bio || null,
      traditions: toList(formData.get("traditions")),
      languages: toList(formData.get("languages")),
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/account?error=${error.code === "23505" ? "handle" : "save"}`);
  }

  revalidatePath("/", "layout");
  redirect(`/members/${handle}`);
}
