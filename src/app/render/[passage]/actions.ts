"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export async function createRendering(formData: FormData) {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const passageId = String(formData.get("passage_id") ?? "");
  const passageSlug = String(formData.get("passage_slug") ?? "");
  const movementSlug = String(formData.get("movement_slug") ?? "");
  const backTo = `/read/${movementSlug}/${passageSlug}`;

  if (!user) redirect(`/signin?next=/render/${passageSlug}`);

  const body = String(formData.get("body") ?? "").trim();
  const language = String(formData.get("language") ?? "").trim() || "English";
  const tradition = String(formData.get("tradition") ?? "").trim();
  const tenetSlugs = formData.getAll("tenets").map(String).filter(Boolean);

  if (!body || !passageId) {
    redirect(`/render/${passageSlug}?error=required`);
  }

  const { data: rendering, error } = await sb
    .from("renderings")
    .insert({
      passage_id: passageId,
      author_id: user.id,
      body,
      language,
      tradition: tradition || null,
      status: "submitted",
    })
    .select("id")
    .single();

  if (error || !rendering) {
    redirect(`/render/${passageSlug}?error=save`);
  }

  if (tenetSlugs.length > 0) {
    const { data: tenetRows } = await sb
      .from("tenets")
      .select("id,slug")
      .in("slug", tenetSlugs);
    const links = (tenetRows ?? []).map((t) => ({
      rendering_id: rendering!.id,
      tenet_id: t.id,
    }));
    if (links.length > 0) await sb.from("rendering_tenets").insert(links);
  }

  revalidatePath(backTo);
  redirect(backTo);
}
