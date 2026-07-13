import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { listEpisodes } from "@/lib/data/podcasts";
import { getShowSummaries } from "@/lib/data/podcast-feeds";
import { getProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Podcasts",
  description: "Conversations and readings on Revelation and love.",
};

function fmt(iso?: string): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  try {
    return new Intl.DateTimeFormat("en", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(t));
  } catch {
    return "";
  }
}

export default async function PodcastsPage() {
  const [shows, episodes, profile] = await Promise.all([
    getShowSummaries(),
    listEpisodes(),
    getProfile(),
  ]);
  const isSteward = profile?.role === "steward" || profile?.role === "admin";

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <p className="eyebrow">Podcasts</p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink">Podcasts</h1>
          <p className="mt-2 text-ink-soft">
            Conversations and readings — the book, spoken and heard.
          </p>
        </div>
        {isSteward && (
          <div className="ui flex shrink-0 flex-col items-end gap-1 text-sm">
            <Link href="/podcasts/subscribe" className="text-gold hover:text-ink">
              + Add a show
            </Link>
            <Link href="/podcasts/new" className="text-ink-faint hover:text-ink">
              + Single episode
            </Link>
          </div>
        )}
      </header>

      {/* Subscribed shows (from RSS) */}
      {shows.length > 0 && (
        <section className="mt-10 space-y-4">
          {shows.map((s) => (
            <Link
              key={s.slug}
              href={`/podcasts/show/${s.slug}`}
              className="flex gap-4 rounded-2xl border border-line bg-card/50 p-5 transition-colors hover:bg-glow/40"
            >
              {s.image && (
                <Image
                  src={s.image}
                  alt=""
                  width={80}
                  height={80}
                  unoptimized
                  className="size-16 shrink-0 rounded-xl border border-line object-cover sm:size-20"
                />
              )}
              <div className="min-w-0">
                <h2 className="font-serif text-xl text-ink">{s.title}</h2>
                {s.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-ink-soft">
                    {s.description}
                  </p>
                )}
                <p className="ui mt-1.5 text-xs text-ink-faint">
                  {s.episodeCount} {s.episodeCount === 1 ? "episode" : "episodes"}
                  {s.latestTitle ? ` · latest: ${s.latestTitle}` : ""}
                </p>
              </div>
            </Link>
          ))}
        </section>
      )}

      {/* Single / guest episodes (manually added) */}
      {episodes.length > 0 && (
        <section className="mt-10">
          {shows.length > 0 && <h2 className="eyebrow">More episodes</h2>}
          <ul className="mt-3 divide-y divide-line/70 overflow-hidden rounded-2xl border border-line bg-card/50">
            {episodes.map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/podcasts/${e.slug}`}
                  className="block px-5 py-5 transition-colors hover:bg-glow/50"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-serif text-xl text-ink">♫ {e.title}</h3>
                    {e.status === "draft" && (
                      <span className="ui shrink-0 rounded-full border border-line px-2 py-0.5 text-xs text-ink-faint">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="ui mt-1.5 text-xs text-ink-faint">
                    {e.series ? `${e.series} · ` : ""}
                    {e.byline ?? e.authorName}
                    {e.publishedAt ? ` · ${fmt(e.publishedAt)}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {shows.length === 0 && episodes.length === 0 && (
        <p className="mt-10 rounded-2xl border border-dashed border-line bg-card/40 p-6 text-ink-soft">
          {isSteward
            ? "No shows yet. Add one by its RSS feed and every episode appears here."
            : "No episodes yet."}
        </p>
      )}
    </div>
  );
}
