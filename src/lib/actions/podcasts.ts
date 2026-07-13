"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { slugify } from "@/lib/content/parse";
import { idemKey } from "@/lib/idempotency";

type SB = Awaited<ReturnType<typeof createServerSupabase>>;

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
  if (!me || (me.role !== "steward" && me.role !== "admin")) redirect("/podcasts");
  return user.id;
}

async function uniqueSlug(sb: SB, base: string): Promise<string> {
  const root = base || "episode";
  const { data } = await sb
    .from("podcast_episodes")
    .select("slug")
    .like("slug", `${root}%`);
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

export async function createEpisode(formData: FormData) {
  const sb = await createServerSupabase();
  const authorId = await requireSteward(sb, "/podcasts/new");

  const title = String(formData.get("title") ?? "").trim();
  const audioUrl = String(formData.get("audio_url") ?? "").trim();
  const series = String(formData.get("series") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const byline = String(formData.get("byline") ?? "").trim();
  const status = String(formData.get("status") ?? "draft") === "published"
    ? "published"
    : "draft";

  if (!title || !audioUrl) redirect("/podcasts/new?error=required");

  const slug = await uniqueSlug(sb, slugify(title));
  const { error } = await sb.from("podcast_episodes").insert({
    author_id: authorId,
    title,
    slug,
    series: series || null,
    notes: notes || null,
    audio_url: audioUrl,
    byline: byline || null,
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
    idempotency_key: idemKey(formData),
    ...anchorFields(formData),
  });
  if (error) redirect("/podcasts/new?error=save");

  revalidatePath("/podcasts");
  redirect(`/podcasts/${slug}`);
}

export async function updateEpisode(formData: FormData) {
  const sb = await createServerSupabase();
  const id = String(formData.get("id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  await requireSteward(sb, `/podcasts/${slug}/edit`);

  const title = String(formData.get("title") ?? "").trim();
  const audioUrl = String(formData.get("audio_url") ?? "").trim();
  const series = String(formData.get("series") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const byline = String(formData.get("byline") ?? "").trim();
  const status = String(formData.get("status") ?? "draft") === "published"
    ? "published"
    : "draft";

  if (!id || !title || !audioUrl) redirect(`/podcasts/${slug}/edit?error=required`);

  const { data: cur } = await sb
    .from("podcast_episodes")
    .select("published_at")
    .eq("id", id)
    .maybeSingle();
  const publishedAt =
    status === "published"
      ? (cur?.published_at as string | null) ?? new Date().toISOString()
      : (cur?.published_at as string | null) ?? null;

  const { error } = await sb
    .from("podcast_episodes")
    .update({
      title,
      series: series || null,
      notes: notes || null,
      audio_url: audioUrl,
      byline: byline || null,
      status,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
      ...anchorFields(formData),
    })
    .eq("id", id);
  if (error) redirect(`/podcasts/${slug}/edit?error=save`);

  revalidatePath("/podcasts");
  redirect(`/podcasts/${slug}`);
}

export async function deleteEpisode(formData: FormData) {
  const sb = await createServerSupabase();
  const id = String(formData.get("id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  await requireSteward(sb, `/podcasts/${slug}`);
  await sb.from("podcast_episodes").delete().eq("id", id);
  revalidatePath("/podcasts");
  redirect("/podcasts");
}
