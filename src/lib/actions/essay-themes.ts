"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

type SB = Awaited<ReturnType<typeof createServerSupabase>>;

async function requireSteward(sb: SB, back: string): Promise<void> {
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(back)}`);
  const { data: me } = await sb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!me || (me.role !== "steward" && me.role !== "admin")) redirect("/essays");
}

/** Rename a theme, edit its description, and set its position. Slug stays stable. */
export async function updateTheme(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const path = `/essays/theme/${slug}`;
  const sb = await createServerSupabase();
  await requireSteward(sb, path);

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const position = Math.trunc(Number(formData.get("position") ?? 0)) || 0;
  if (!slug || !title) {
    revalidatePath(path);
    return;
  }

  await sb
    .from("essay_themes")
    .update({
      title,
      description: description || null,
      position,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug);

  revalidatePath(path);
  revalidatePath("/essays");
}
