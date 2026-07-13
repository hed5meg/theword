"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { slugify } from "@/lib/content/parse";
import { fetchFeed } from "@/lib/rss";

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

export async function subscribeFeed(formData: FormData) {
  const sb = await createServerSupabase();
  const addedBy = await requireSteward(sb, "/podcasts/subscribe");

  const feedUrl = String(formData.get("feed_url") ?? "").trim();
  if (!feedUrl) redirect("/podcasts/subscribe?error=required");

  // Validate the feed by actually reading it, and take its title for the slug.
  const feed = await fetchFeed(feedUrl);
  if (!feed) redirect("/podcasts/subscribe?error=unreadable");

  // Already subscribed? Send them to the existing show.
  const { data: existing } = await sb
    .from("podcast_feeds")
    .select("slug")
    .eq("feed_url", feedUrl)
    .maybeSingle();
  if (existing?.slug) redirect(`/podcasts/show/${existing.slug}`);

  const base = slugify(feed.title) || "show";
  const { data: taken } = await sb
    .from("podcast_feeds")
    .select("slug")
    .like("slug", `${base}%`);
  const used = new Set((taken ?? []).map((r: { slug: string }) => r.slug));
  let slug = base;
  let n = 2;
  while (used.has(slug)) slug = `${base}-${n++}`;

  const { error } = await sb
    .from("podcast_feeds")
    .insert({ added_by: addedBy, feed_url: feedUrl, slug });
  if (error) redirect("/podcasts/subscribe?error=save");

  revalidatePath("/podcasts");
  redirect(`/podcasts/show/${slug}`);
}

export async function unsubscribeFeed(formData: FormData) {
  const sb = await createServerSupabase();
  await requireSteward(sb, "/podcasts");
  const id = String(formData.get("id") ?? "");
  if (id) await sb.from("podcast_feeds").delete().eq("id", id);
  revalidatePath("/podcasts");
  redirect("/podcasts");
}
