import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getThemeMeta } from "@/lib/data/essay-themes";
import { getEssay, listEssays } from "@/lib/data/essays";
import { Prose } from "@/components/Prose";
import { PrintButton } from "@/components/PrintButton";
import { AutoPrint } from "@/components/AutoPrint";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const theme = await getThemeMeta(slug);
  if (!theme) return {};
  return { title: theme.title, robots: { index: false } };
}

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

// The whole theme as one printable booklet: a title page with contents, then
// each essay in theme order, each starting on a fresh page.
export default async function ThemePrintPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [theme, all] = await Promise.all([getThemeMeta(slug), listEssays()]);
  if (!theme) notFound();

  const cards = all
    .filter((e) => e.themeSlug === slug)
    .sort(
      (a, b) =>
        (a.themeOrder ?? 0) - (b.themeOrder ?? 0) ||
        (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
    );
  const essays = (await Promise.all(cards.map((c) => getEssay(c.slug)))).filter(
    (e) => e !== null,
  );

  // Titles for resolving [[slug]] cross-links to the target essay's name.
  const essayLinks = Object.fromEntries(all.map((e) => [e.slug, e.title]));

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
      <AutoPrint />
      <nav className="ui mb-8 flex items-center justify-between gap-4 text-sm text-ink-faint print:hidden">
        <Link href={`/essays/theme/${slug}`} className="transition-colors hover:text-ink-soft">
          ← {theme.title}
        </Link>
        <PrintButton />
      </nav>

      <header className="print-title-page">
        <p className="eyebrow">The Unsealed Revelation</p>
        <h1 className="mt-2 font-serif text-4xl leading-tight tracking-tight text-ink">
          {theme.title}
        </h1>
        {theme.description && (
          <p className="mt-3 font-serif text-xl italic leading-relaxed text-ink-soft">
            {theme.description}
          </p>
        )}
        {essays.length > 0 && (
          <ol className="mt-10 space-y-2">
            {essays.map((e, i) => (
              <li key={e.slug} className="flex gap-3 font-serif text-lg text-ink">
                <span className="w-6 shrink-0 text-gold-soft">{i + 1}</span>
                <span>{e.title}</span>
              </li>
            ))}
          </ol>
        )}
        <p className="ui mt-10 text-sm text-ink-faint">theword.love/essays/theme/{slug}</p>
      </header>

      {essays.map((essay) => (
        <article key={essay.slug} className="print-new-page mt-16 border-t border-line/70 pt-12 print:mt-0 print:border-0 print:pt-0">
          <h2 className="print-essay-title font-serif text-4xl leading-tight tracking-tight text-ink">
            {essay.title}
          </h2>
          {essay.dek && (
            <p className="mt-3 font-serif text-xl italic leading-relaxed text-ink-soft">
              {essay.dek}
            </p>
          )}
          <p className="ui mt-4 text-sm text-ink-faint">
            {essay.byline ?? essay.authorName}
            {essay.publishedAt ? ` · ${fmt(essay.publishedAt)}` : ""}
            {essay.status === "draft" ? " · Draft" : ""}
          </p>
          <div className="mt-8">
            <Prose scripture essayLinks={essayLinks}>
              {essay.body}
            </Prose>
          </div>
        </article>
      ))}

      <p className="print-colophon hidden print:block">
        theword.love/essays/theme/{slug} · The Unsealed Revelation
      </p>
    </div>
  );
}
