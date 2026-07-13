import type { PodcastEpisode, EpisodeCard, PieceAnchor } from "@/lib/types";
import { createServerSupabase } from "@/lib/supabase/server";
import { resonanceCounts } from "@/lib/data/from-supabase";

// Podcast episodes are curated like essays: RLS returns published rows to all,
// drafts to stewards. Session client so stewards see drafts. Graceful on a
// missing table.

type AnchorRefs = {
  passages: { slug: string; title: string } | null;
  arrangements: { slug: string; title: string } | null;
  tenets: { slug: string; title: string } | null;
};

const SELECT =
  "id,title,slug,series,notes,audio_url,byline,status,published_at,author:profiles(handle,display_name),passages(slug,title),arrangements(slug,title),tenets(slug,title)";

function anchorOf(r: AnchorRefs): PieceAnchor {
  return {
    passageSlug: r.passages?.slug,
    passageTitle: r.passages?.title,
    arrangementSlug: r.arrangements?.slug,
    arrangementTitle: r.arrangements?.title,
    tenetSlug: r.tenets?.slug,
    tenetTitle: r.tenets?.title,
  };
}

type Row = AnchorRefs & {
  id: string;
  title: string;
  slug: string;
  series: string | null;
  notes: string | null;
  audio_url: string;
  byline: string | null;
  status: PodcastEpisode["status"];
  published_at: string | null;
  author: { handle: string; display_name: string } | null;
};

/** Published episodes (plus the viewing steward's drafts), newest first. */
export async function listEpisodes(): Promise<EpisodeCard[]> {
  try {
    const sb = await createServerSupabase();
    const { data, error } = await sb
      .from("podcast_episodes")
      .select(SELECT)
      .order("published_at", { ascending: false, nullsFirst: true })
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return (data as unknown as Row[]).map((r) => ({
      title: r.title,
      slug: r.slug,
      series: r.series ?? undefined,
      byline: r.byline ?? undefined,
      authorName: r.author?.display_name,
      status: r.status,
      publishedAt: r.published_at ?? undefined,
      anchor: anchorOf(r),
    }));
  } catch {
    return [];
  }
}

/** One episode by slug (draft visible only to stewards, via RLS). */
export async function getEpisode(slug: string): Promise<PodcastEpisode | null> {
  try {
    const sb = await createServerSupabase();
    const { data, error } = await sb
      .from("podcast_episodes")
      .select(SELECT)
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    const r = data as unknown as Row;
    const counts = await resonanceCounts(sb, "episode", [r.id]);
    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      series: r.series ?? undefined,
      notes: r.notes ?? undefined,
      audioUrl: r.audio_url,
      byline: r.byline ?? undefined,
      authorName: r.author?.display_name,
      authorHandle: r.author?.handle,
      status: r.status,
      publishedAt: r.published_at ?? undefined,
      resonanceCount: counts.get(r.id) ?? 0,
      anchor: anchorOf(r),
    };
  } catch {
    return null;
  }
}

export interface EpisodeEdit {
  id: string;
  title: string;
  slug: string;
  series: string;
  notes: string;
  audioUrl: string;
  byline: string;
  status: PodcastEpisode["status"];
  passageId: string;
  arrangementId: string;
  tenetId: string;
}

/** Raw episode row for editing (stewards only, via RLS). */
export async function getEpisodeForEdit(
  slug: string,
): Promise<EpisodeEdit | null> {
  try {
    const sb = await createServerSupabase();
    const { data } = await sb
      .from("podcast_episodes")
      .select(
        "id,title,slug,series,notes,audio_url,byline,status,passage_id,arrangement_id,tenet_id",
      )
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return null;
    const r = data as unknown as {
      id: string;
      title: string;
      slug: string;
      series: string | null;
      notes: string | null;
      audio_url: string;
      byline: string | null;
      status: PodcastEpisode["status"];
      passage_id: string | null;
      arrangement_id: string | null;
      tenet_id: string | null;
    };
    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      series: r.series ?? "",
      notes: r.notes ?? "",
      audioUrl: r.audio_url,
      byline: r.byline ?? "",
      status: r.status,
      passageId: r.passage_id ?? "",
      arrangementId: r.arrangement_id ?? "",
      tenetId: r.tenet_id ?? "",
    };
  } catch {
    return null;
  }
}
