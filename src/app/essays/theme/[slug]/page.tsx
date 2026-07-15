import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getThemeMeta } from "@/lib/data/essay-themes";
import { pageMeta } from "@/lib/metadata";
import { listEssays } from "@/lib/data/essays";
import { getProfile } from "@/lib/auth";
import { updateTheme } from "@/lib/actions/essay-themes";
import { IdempotencyField } from "@/components/IdempotencyField";
import { SubmitButton } from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [theme, all] = await Promise.all([getThemeMeta(slug), listEssays()]);
  if (!theme) return {};
  const inTheme = all
    .filter((e) => e.themeSlug === slug)
    .sort((a, b) => (a.themeOrder ?? 0) - (b.themeOrder ?? 0));
  const firstDek = inTheme.find((e) => e.dek)?.dek;
  return pageMeta({
    title: theme.title,
    description:
      theme.description ||
      firstDek ||
      `A collection of essays gathered under “${theme.title}.”`,
    pathname: `/essays/theme/${slug}`,
    staticImage: false,
  });
}

export default async function ThemePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [theme, all, profile] = await Promise.all([
    getThemeMeta(slug),
    listEssays(),
    getProfile(),
  ]);
  if (!theme) notFound();
  const isSteward = profile?.role === "steward" || profile?.role === "admin";

  const essays = all
    .filter((e) => e.themeSlug === slug)
    .sort(
      (a, b) =>
        (a.themeOrder ?? 0) - (b.themeOrder ?? 0) ||
        (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
    );

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
      <nav className="ui mb-8 text-sm text-ink-faint">
        <Link href="/essays" className="transition-colors hover:text-ink-soft">
          ← Essays
        </Link>
      </nav>

      <header>
        <p className="eyebrow">A theme</p>
        <h1 className="mt-2 font-serif text-4xl leading-tight tracking-tight text-ink">
          {theme.title}
        </h1>
        {theme.description && (
          <p className="mt-3 leading-relaxed text-ink-soft">{theme.description}</p>
        )}
        <p className="ui mt-3 text-xs text-ink-faint">
          {essays.length} {essays.length === 1 ? "essay" : "essays"}
        </p>

        {isSteward && (
          <details className="ui group mt-6">
            <summary className="cursor-pointer list-none text-sm text-gold transition-colors hover:text-ink">
              Edit theme
            </summary>
            <form action={updateTheme} className="mt-4 space-y-3">
              <IdempotencyField />
              <input type="hidden" name="slug" value={theme.slug} />
              <div>
                <label htmlFor="title" className="block text-xs text-ink-soft">Name</label>
                <input
                  id="title"
                  name="title"
                  required
                  defaultValue={theme.title}
                  className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-2 text-ink outline-none focus:border-gold-soft"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-xs text-ink-soft">
                  Description <span className="text-ink-faint">(optional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  defaultValue={theme.description}
                  className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-2 text-ink outline-none focus:border-gold-soft"
                />
              </div>
              <div>
                <label htmlFor="position" className="block text-xs text-ink-soft">
                  Position <span className="text-ink-faint">(orders themes on the index)</span>
                </label>
                <input
                  id="position"
                  name="position"
                  type="number"
                  defaultValue={theme.position}
                  className="mt-1 w-24 rounded-xl border border-line bg-card px-3 py-2 text-ink outline-none focus:border-gold-soft"
                />
              </div>
              <p className="text-xs text-ink-faint">
                The link stays the same when you rename — only the name changes.
              </p>
              <SubmitButton
                pendingLabel="Saving…"
                className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-parchment hover:opacity-90"
              >
                Save
              </SubmitButton>
            </form>
          </details>
        )}
      </header>

      <section className="mt-10">
        {essays.length > 0 ? (
          <ol className="space-y-4">
            {essays.map((e, i) => (
              <li key={e.slug}>
                <Link
                  href={`/essays/${e.slug}`}
                  className="flex gap-4 rounded-2xl border border-line bg-card/50 p-5 transition-colors hover:bg-glow/40"
                >
                  <span className="font-serif text-2xl text-gold-soft">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="flex items-baseline gap-2">
                      <span className="font-serif text-xl text-ink">{e.title}</span>
                      {e.status === "draft" && (
                        <span className="ui rounded-full border border-line px-2 py-0.5 text-xs text-ink-faint">
                          Draft
                        </span>
                      )}
                    </span>
                    {e.dek && <span className="mt-1 block text-sm text-ink-soft">{e.dek}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-2xl border border-dashed border-line bg-card/40 p-6 text-ink-soft">
            No essays in this theme yet.
          </p>
        )}
      </section>
    </div>
  );
}
