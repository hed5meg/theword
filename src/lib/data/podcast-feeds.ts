import { createAnonClient } from "@/lib/supabase/admin";
import { fetchFeed, type Feed } from "@/lib/rss";

// Subscribed shows (podcast_feeds) are public. Episode content is pulled live
// from each feed (cached in fetchFeed). Graceful when the table is absent.

export interface FeedRow {
  id: string;
  feedUrl: string;
  title: string | null;
  slug: string;
}

export interface ShowSummary {
  slug: string;
  title: string;
  description: string;
  image?: string;
  episodeCount: number;
  latestTitle?: string;
  latestDate?: string;
}

export interface ShowDetail {
  id: string;
  slug: string;
  title: string;
  feedUrl: string;
  feed: Feed;
}

async function feedRows(): Promise<FeedRow[]> {
  const sb = createAnonClient();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from("podcast_feeds")
      .select("id,feed_url,title,slug")
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return (data as { id: string; feed_url: string; title: string | null; slug: string }[]).map(
      (r) => ({ id: r.id, feedUrl: r.feed_url, title: r.title, slug: r.slug }),
    );
  } catch {
    return [];
  }
}

/** Compact summaries of every subscribed show, for the podcasts index. */
export async function getShowSummaries(): Promise<ShowSummary[]> {
  const rows = await feedRows();
  const shows = await Promise.all(
    rows.map(async (r) => {
      const feed = await fetchFeed(r.feedUrl);
      if (!feed) {
        return {
          slug: r.slug,
          title: r.title ?? "A show",
          description: "This feed couldn’t be loaded right now.",
          episodeCount: 0,
        } satisfies ShowSummary;
      }
      const latest = feed.episodes[0];
      return {
        slug: r.slug,
        title: r.title || feed.title,
        description: feed.description,
        image: feed.image,
        episodeCount: feed.episodes.length,
        latestTitle: latest?.title,
        latestDate: latest?.pubDate,
      } satisfies ShowSummary;
    }),
  );
  return shows;
}

/** One show by slug, with its full (live) episode list. */
export async function getShow(slug: string): Promise<ShowDetail | null> {
  const rows = await feedRows();
  const row = rows.find((r) => r.slug === slug);
  if (!row) return null;
  const feed = await fetchFeed(row.feedUrl);
  if (!feed) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title || feed.title,
    feedUrl: row.feedUrl,
    feed,
  };
}

/** Do any subscribed shows exist? (Cheap check for the index, no feed fetch.) */
export async function hasShows(): Promise<boolean> {
  const rows = await feedRows();
  return rows.length > 0;
}
