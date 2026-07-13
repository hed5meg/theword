import path from "node:path";
import { readFileSync } from "node:fs";

// Verse text for the scripture hover. LDS-unique books come from a bundled open
// dataset (content/lds-scriptures.json); Bible verses come live from a free,
// public-domain KJV API. Both are cached; failures degrade to null (link only).

let ldsCache: Record<string, string> | null = null;
function lds(): Record<string, string> {
  if (ldsCache) return ldsCache;
  try {
    const p = path.join(process.cwd(), "content", "lds-scriptures.json");
    ldsCache = JSON.parse(readFileSync(p, "utf8")) as Record<string, string>;
  } catch {
    ldsCache = {};
  }
  return ldsCache;
}

export interface VerseQuery {
  source: "bible" | "lds";
  lookupKey: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
}

const MAX_VERSES = 12; // keep hovers gentle

export async function getVerseText(q: VerseQuery): Promise<string | null> {
  if (!q.verseStart) return null; // chapter-only refs: link, no preview
  const end = Math.min(q.verseEnd ?? q.verseStart, q.verseStart + MAX_VERSES - 1);

  if (q.source === "lds") {
    const data = lds();
    const parts: string[] = [];
    for (let v = q.verseStart; v <= end; v++) {
      const t = data[`${q.lookupKey} ${q.chapter}:${v}`];
      if (t) parts.push(t);
    }
    const text = parts.join(" ").trim();
    return text || null;
  }

  // Bible: public-domain KJV via bible-api.com.
  const ref = `${q.lookupKey} ${q.chapter}:${q.verseStart}${
    end > q.verseStart ? `-${end}` : ""
  }`;
  try {
    const res = await fetch(
      `https://bible-api.com/${encodeURIComponent(ref)}?translation=kjv`,
      { next: { revalidate: 60 * 60 * 24 * 30 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { text?: string };
    const text = (data.text ?? "").replace(/\s+/g, " ").trim();
    return text || null;
  } catch {
    return null;
  }
}
