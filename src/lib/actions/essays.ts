"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { slugify } from "@/lib/content/parse";
import { idemKey } from "@/lib/idempotency";

type SB = Awaited<ReturnType<typeof createServerSupabase>>;

/** Redirect non-stewards away; return the steward's user id. */
async function requireSteward(sb: SB, back: string): Promise<string> {
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
  return user.id;
}

/** A globally-unique slug in `table`, suffixed if needed. */
async function uniqueSlug(sb: SB, table: string, base: string): Promise<string> {
  const root = base || "piece";
  const { data } = await sb.from(table).select("slug").like("slug", `${root}%`);
  const used = new Set((data ?? []).map((r: { slug: string }) => r.slug));
  let slug = root;
  let n = 2;
  while (used.has(slug)) slug = `${root}-${n++}`;
  return slug;
}

function anchorFields(formData: FormData) {
  const one = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v || null;
  };
  return {
    passage_id: one("passage_id"),
    arrangement_id: one("arrangement_id"),
    tenet_id: one("tenet_id"),
  };
}

export async function createEssay(formData: FormData) {
  const sb = await createServerSupabase();
  const authorId = await requireSteward(sb, "/essays/new");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const dek = String(formData.get("dek") ?? "").trim();
  const byline = String(formData.get("byline") ?? "").trim();
  const status = String(formData.get("status") ?? "draft") === "published"
    ? "published"
    : "draft";

  if (!title || !body) redirect("/essays/new?error=required");

  const slug = await uniqueSlug(sb, "essays", slugify(title));
  const { error } = await sb.from("essays").insert({
    author_id: authorId,
    title,
    slug,
    dek: dek || null,
    body,
    byline: byline || null,
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
    idempotency_key: idemKey(formData),
    ...anchorFields(formData),
  });
  if (error) redirect("/essays/new?error=save");

  revalidatePath("/essays");
  redirect(`/essays/${slug}`);
}

export async function updateEssay(formData: FormData) {
  const sb = await createServerSupabase();
  const id = String(formData.get("id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  await requireSteward(sb, `/essays/${slug}/edit`);

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const dek = String(formData.get("dek") ?? "").trim();
  const byline = String(formData.get("byline") ?? "").trim();
  const status = String(formData.get("status") ?? "draft") === "published"
    ? "published"
    : "draft";

  if (!id || !title || !body) redirect(`/essays/${slug}/edit?error=required`);

  // Set published_at the first time it goes live; keep it thereafter.
  const { data: cur } = await sb
    .from("essays")
    .select("published_at")
    .eq("id", id)
    .maybeSingle();
  const publishedAt =
    status === "published"
      ? (cur?.published_at as string | null) ?? new Date().toISOString()
      : (cur?.published_at as string | null) ?? null;

  const { error } = await sb
    .from("essays")
    .update({
      title,
      dek: dek || null,
      body,
      byline: byline || null,
      status,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
      ...anchorFields(formData),
    })
    .eq("id", id);
  if (error) redirect(`/essays/${slug}/edit?error=save`);

  revalidatePath("/essays");
  redirect(`/essays/${slug}`);
}

export async function deleteEssay(formData: FormData) {
  const sb = await createServerSupabase();
  const id = String(formData.get("id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  await requireSteward(sb, `/essays/${slug}`);
  await sb.from("essays").delete().eq("id", id);
  revalidatePath("/essays");
  redirect("/essays");
}
