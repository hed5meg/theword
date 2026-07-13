import { XMLParser } from "fast-xml-parser";

// Fetch and parse a podcast RSS feed. The feed is the source of truth for a
// subscribed show; we cache the fetch for an hour so new episodes appear without
// hammering the host. Parsing is defensive — feeds vary wildly.

export interface FeedEpisode {
  guid: string;
  title: string;
  description: string;
  pubDate?: string;
  audioUrl?: string;
  audioType?: string;
  duration?: string;
  link?: string;
  image?: string;
}

export interface Feed {
  title: string;
  description: string;
  image?: string;
  link?: string;
  episodes: FeedEpisode[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
});

/** Read a possibly-attributed XML node down to its text. */
function text(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o["#text"] === "string" || typeof o["#text"] === "number") {
      return String(o["#text"]);
    }
  }
  return "";
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&rsquo;|&apos;/g, "’")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

/** Normalize an itunes:duration ("3672" or "1:02:03") to "1:02:03". */
export function formatDuration(raw?: string): string {
  if (!raw) return "";
  if (raw.includes(":")) return raw;
  const total = Number(raw);
  if (!Number.isFinite(total) || total <= 0) return "";
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function imageOf(node: Record<string, unknown>): string | undefined {
  const it = node["itunes:image"] as Record<string, unknown> | undefined;
  const href = it?.["@_href"];
  if (typeof href === "string" && href) return href;
  const img = node["image"] as Record<string, unknown> | undefined;
  const url = img && text(img["url"]);
  return url || undefined;
}

/** Fetch + parse a feed. Returns null on any network/parse failure. */
export async function fetchFeed(url: string): Promise<Feed | null> {
  let xml: string;
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "theword.love podcast reader" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    xml = await res.text();
  } catch {
    return null;
  }

  let doc: Record<string, unknown>;
  try {
    doc = parser.parse(xml) as Record<string, unknown>;
  } catch {
    return null;
  }

  const rss = doc["rss"] as Record<string, unknown> | undefined;
  const channel = (rss?.["channel"] ?? doc["channel"]) as
    | Record<string, unknown>
    | undefined;
  if (!channel) return null;

  const items = asArray(channel["item"] as unknown);
  const episodes: FeedEpisode[] = items.map((raw) => {
    const item = raw as Record<string, unknown>;
    const enclosure = asArray(item["enclosure"])[0] as
      | Record<string, unknown>
      | undefined;
    const desc =
      text(item["content:encoded"]) ||
      text(item["itunes:summary"]) ||
      text(item["description"]);
    return {
      guid: text(item["guid"]) || text(item["link"]) || text(item["title"]),
      title: text(item["title"]),
      description: stripHtml(desc),
      pubDate: text(item["pubDate"]) || undefined,
      audioUrl:
        (enclosure?.["@_url"] as string | undefined) ||
        undefined,
      audioType: (enclosure?.["@_type"] as string | undefined) || undefined,
      duration: text(item["itunes:duration"]) || undefined,
      link: text(item["link"]) || undefined,
      image: imageOf(item),
    };
  });

  // Newest first (feeds are usually already ordered, but be sure).
  episodes.sort((a, b) => {
    const ta = a.pubDate ? Date.parse(a.pubDate) : 0;
    const tb = b.pubDate ? Date.parse(b.pubDate) : 0;
    return tb - ta;
  });

  return {
    title: stripHtml(text(channel["title"])) || "Untitled show",
    description: stripHtml(
      text(channel["itunes:summary"]) || text(channel["description"]),
    ),
    image: imageOf(channel),
    link: text(channel["link"]) || undefined,
    episodes,
  };
}
