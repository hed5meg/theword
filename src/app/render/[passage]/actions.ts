"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { idemKey, isDuplicate } from "@/lib/idempotency";
import { slugify } from "@/lib/content/parse";

type SB = Awaited<ReturnType<typeof createServerSupabase>>;

/**
 * Resolve a named branch for this author, creating it if new. Matching is by
 * name (case-insensitive) so the same name reused across passages gathers into
 * one branch. Returns null when no name was given (an unnamed rendering).
 */
async function resolveBranchId(
  sb: SB,
  userId: string,
  rawName: string,
): Promise<string | null> {
  const name = rawName.trim();
  if (!name) return null;

  const { data: mine } = await sb
    .from("branches")
    .select("id,name,slug")
    .eq("author_id", userId);
  const existing = (mine ?? []).find(
    (b) => b.name.toLowerCase() === name.toLowerCase(),
  );
  if (existing) return existing.id;

  const base = slugify(name) || "branch";
  const used = new Set((mine ?? []).map((b) => b.slug));
  let slug = base;
  let n = 2;
  while (used.has(slug)) slug = `${base}-${n++}`;

  const { data: created } = await sb
    .from("branches")
    .insert({ author_id: userId, name, slug })
    .select("id")
    .maybeSingle();
  return created?.id ?? null;
}

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
  const branchName = String(formData.get("branch_name") ?? "");

  if (!body || !passageId) {
    redirect(`/render/${passageSlug}?error=required`);
  }

  const branchId = await resolveBranchId(sb, user.id, branchName);

  const { data: rendering, error } = await sb
    .from("renderings")
    .insert({
      passage_id: passageId,
      author_id: user.id,
      branch_id: branchId,
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
