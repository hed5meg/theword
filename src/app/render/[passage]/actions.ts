"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { idemKey, isDuplicate } from "@/lib/idempotency";

export async function createRendering(formData: FormData) {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const passageId = String(formData.get("passage_id") ?? "");
  const passageSlug = String(formData.get("passage_slug") ?? "");
  // Return to the passage within the arrangement the reader came from.
  const backArr = String(formData.get("back_arr") ?? "the-love-ordered-arrangement");
  const backEntry = String(formData.get("back_entry") ?? passageSlug);
  const backTo = `/read/${backArr}/${backEntry}`;

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
      idempotency_key: idemKey(formData),
    })
    .select("id")
    .maybeSingle();

  if (error) {
    // A repeated submission (double-click / retry) — the first one already
    // created the branch. Send the author to the passage, not a second copy.
    if (isDuplicate(error)) redirect(backTo);
    redirect(`/render/${passageSlug}?error=save`);
  }
  if (!rendering) {
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
