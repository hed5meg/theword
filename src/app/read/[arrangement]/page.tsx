import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArrangementOutline, getArrangementMetaList } from "@/lib/data/arrangements";
import { ArrangementSelector } from "@/components/ArrangementSelector";
import { RememberArrangement } from "@/components/RememberArrangement";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ arrangement: string }>;
}): Promise<Metadata> {
  const { arrangement } = await params;
  const outline = await getArrangementOutline(arrangement);
  if (!outline) return {};
  return {
    title: `Read · ${outline.arrangement.title}`,
    description: outline.arrangement.description,
  };
}

export default async function ArrangementTOC({
  params,
}: {
  params: Promise<{ arrangement: string }>;
}) {
  const { arrangement } = await params;
  const [outline, arrangements] = await Promise.all([
    getArrangementOutline(arrangement),
    getArrangementMetaList(),
  ]);
  if (!outline) notFound();
  const { arrangement: meta, groups } = outline;

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
      <RememberArrangement slug={meta.slug} />

      <header className="text-center">
        <p className="eyebrow">The gathered book</p>
        <h1 className="mt-4 font-serif text-4xl tracking-tight text-ink sm:text-5xl">
          Read the Revelation
        </h1>
        {meta.description && (
          <p className="mx-auto mt-4 max-w-lg font-serif text-lg italic text-ink-soft">
            {meta.description}
          </p>
        )}
        <div className="mt-6 flex flex-col items-center gap-2 px-2 sm:flex-row sm:justify-center sm:gap-3">
          <ArrangementSelector arrangements={arrangements} current={meta.slug} />
          <Link
            href="/arrangements"
            className="ui shrink-0 text-sm text-gold transition-colors hover:text-ink"
          >
            All arrangements →
          </Link>
        </div>
      </header>

      <div className="mt-14 space-y-14">
        {groups.map((g, gi) => (
          <section key={g.title ?? `group-${gi}`}>
            {g.title && (
              <div className="mb-4">
                <h2 className="font-serif text-2xl text-ink">{g.title}</h2>
                {g.subtitle && (
                  <p className="mt-1.5 max-w-xl text-ink-soft">{g.subtitle}</p>
                )}
              </div>
            )}
            <ul className="divide-y divide-line/70 overflow-hidden rounded-2xl border border-line bg-card/50">
              {g.entries.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/read/${meta.slug}/${p.slug}`}
                    className="group flex items-baseline justify-between gap-4 px-5 py-4 transition-colors hover:bg-glow/50"
                  >
                    <span className="flex flex-col gap-0.5">
                      <span className="font-serif text-lg text-ink">{p.title}</span>
                      <span className="ui text-xs uppercase tracking-wider text-ink-faint">
                        {p.canonicalRef}
                      </span>
                    </span>
                    <span className="ui shrink-0 text-xs text-ink-faint">
                      {p.renderingCount}{" "}
                      {p.renderingCount === 1 ? "rendering" : "renderings"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
