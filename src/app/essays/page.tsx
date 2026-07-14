import Link from "next/link";
import type { Metadata } from "next";
import type { EssayCard } from "@/lib/types";
import { listEssays } from "@/lib/data/essays";
import { listThemes } from "@/lib/data/essay-themes";
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

function EssayRow({ e }: { e: EssayCard }) {
  return (
    <li>
      <Link
        href={`/essays/${e.slug}`}
        className="block px-5 py-5 transition-colors hover:bg-glow/50"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-serif text-xl text-ink">{e.title}</h3>
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
        </p>
      </Link>
    </li>
  );
}

export default async function EssaysPage() {
  const [essays, themes, profile] = await Promise.all([
    listEssays(),
    listThemes(),
    getProfile(),
  ]);
  const isSteward = profile?.role === "steward" || profile?.role === "admin";

  // Group essays under themes (ordered by the theme list), ungrouped last.
  const byTheme = new Map<string, EssayCard[]>();
  const ungrouped: EssayCard[] = [];
  for (const e of essays) {
    if (e.themeSlug) {
      const list = byTheme.get(e.themeSlug) ?? [];
      list.push(e);
      byTheme.set(e.themeSlug, list);
    } else {
      ungrouped.push(e);
    }
  }
  const orderEssays = (list: EssayCard[]) =>
    [...list].sort(
      (a, b) =>
        (a.themeOrder ?? 0) - (b.themeOrder ?? 0) ||
        (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
    );
  const groups = themes
    .map((t) => ({ theme: t, essays: orderEssays(byTheme.get(t.slug) ?? []) }))
    .filter((g) => g.essays.length > 0);

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

      {groups.length === 0 && ungrouped.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-line bg-card/40 p-6 text-ink-soft">
          No essays yet.
        </p>
      ) : (
        <div className="mt-10 space-y-10">
          {groups.map((g) => (
            <section key={g.theme.slug}>
              <Link
                href={`/essays/theme/${g.theme.slug}`}
                className="ui group inline-flex items-baseline gap-2"
              >
                <h2 className="font-serif text-2xl text-gold transition-colors group-hover:text-ink">
                  {g.theme.title}
                </h2>
                <span className="text-xs text-ink-faint">{g.essays.length} →</span>
              </Link>
              {g.theme.description && (
                <p className="mt-1 text-sm text-ink-soft">{g.theme.description}</p>
              )}
              <ul className="mt-3 divide-y divide-line/70 overflow-hidden rounded-2xl border border-line bg-card/50">
                {g.essays.map((e) => (
                  <EssayRow key={e.slug} e={e} />
                ))}
              </ul>
            </section>
          ))}

          {ungrouped.length > 0 && (
            <section>
              {groups.length > 0 && (
                <h2 className="eyebrow">More essays</h2>
              )}
              <ul className="mt-3 divide-y divide-line/70 overflow-hidden rounded-2xl border border-line bg-card/50">
                {orderEssays(ungrouped).map((e) => (
                  <EssayRow key={e.slug} e={e} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
