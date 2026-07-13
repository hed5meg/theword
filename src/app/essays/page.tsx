import Link from "next/link";
import type { Metadata } from "next";
import { listEssays } from "@/lib/data/essays";
import { getProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Essays",
  description: "Reflections on Revelation, love, and the work of gathering.",
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

export default async function EssaysPage() {
  const [essays, profile] = await Promise.all([listEssays(), getProfile()]);
  const isSteward = profile?.role === "steward" || profile?.role === "admin";

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <p className="eyebrow">Essays</p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink">Essays</h1>
          <p className="mt-2 text-ink-soft">
            Reflections on the book, on love, and on the work of gathering.
          </p>
        </div>
        {isSteward && (
          <Link href="/essays/new" className="ui shrink-0 text-sm text-gold hover:text-ink">
            + New essay
          </Link>
        )}
      </header>

      <section className="mt-10">
        {essays.length > 0 ? (
          <ul className="divide-y divide-line/70 overflow-hidden rounded-2xl border border-line bg-card/50">
            {essays.map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/essays/${e.slug}`}
                  className="block px-5 py-5 transition-colors hover:bg-glow/50"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="font-serif text-xl text-ink">{e.title}</h2>
                    {e.status === "draft" && (
                      <span className="ui shrink-0 rounded-full border border-line px-2 py-0.5 text-xs text-ink-faint">
                        Draft
                      </span>
                    )}
                  </div>
                  {e.dek && <p className="mt-1 text-ink-soft">{e.dek}</p>}
                  <p className="ui mt-1.5 text-xs text-ink-faint">
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
            No essays yet.
          </p>
        )}
      </section>
    </div>
  );
}
