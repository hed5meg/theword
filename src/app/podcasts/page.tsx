import Link from "next/link";
import type { Metadata } from "next";
import { listEpisodes } from "@/lib/data/podcasts";
import { getProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Podcasts",
  description: "Conversations and readings on Revelation and love.",
};

function fmt(iso?: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default async function PodcastsPage() {
  const [episodes, profile] = await Promise.all([listEpisodes(), getProfile()]);
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
          <Link href="/podcasts/new" className="ui shrink-0 text-sm text-gold hover:text-ink">
            + New episode
          </Link>
        )}
      </header>

      <section className="mt-10">
        {episodes.length > 0 ? (
          <ul className="divide-y divide-line/70 overflow-hidden rounded-2xl border border-line bg-card/50">
            {episodes.map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/podcasts/${e.slug}`}
                  className="block px-5 py-5 transition-colors hover:bg-glow/50"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="font-serif text-xl text-ink">♫ {e.title}</h2>
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
                    {e.anchor.passageTitle ? ` · on ${e.anchor.passageTitle}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-line bg-card/40 p-6 text-ink-soft">
            No episodes yet.
          </p>
        )}
      </section>
    </div>
  );
}
