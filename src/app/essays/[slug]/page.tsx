import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEssay, listEssays } from "@/lib/data/essays";
import { pageMeta, summarize } from "@/lib/metadata";
import { getProfile } from "@/lib/auth";
import { getMyResonatedIds } from "@/lib/resonance";
import { getReflections } from "@/lib/data/reflections";
import { Prose } from "@/components/Prose";
import { ResonanceControl } from "@/components/ResonanceControl";
import { FlagControl } from "@/components/FlagControl";
import { Reflections } from "@/components/Reflections";
import { deleteEssay } from "@/lib/actions/essays";
import { ConfirmButton } from "@/components/ConfirmButton";
import { AnchorTags } from "@/components/AnchorTags";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const essay = await getEssay(slug);
  if (!essay) return {};
  return pageMeta({
    title: essay.title,
    description: essay.dek || summarize(essay.body),
    pathname: `/essays/${slug}`,
    type: "article",
  });
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

export default async function EssayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const essay = await getEssay(slug);
  if (!essay) notFound();

  const profile = await getProfile();
  const signedIn = Boolean(profile);
  const isSteward = profile?.role === "steward" || profile?.role === "admin";
  const path = `/essays/${slug}`;

  const [resonated, reflections, siblings] = await Promise.all([
    getMyResonatedIds("essay", [essay.id]),
    getReflections("essay", essay.id),
    essay.themeSlug ? listEssays() : Promise.resolve([]),
  ]);

  // Previous / next essay within the theme (in order).
  const inTheme = essay.themeSlug
    ? siblings
        .filter((e) => e.themeSlug === essay.themeSlug)
        .sort(
          (a, b) =>
            (a.themeOrder ?? 0) - (b.themeOrder ?? 0) ||
            (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
        )
    : [];
  const idx = inTheme.findIndex((e) => e.slug === essay.slug);
  const prev = idx > 0 ? inTheme[idx - 1] : null;
  const next = idx >= 0 && idx < inTheme.length - 1 ? inTheme[idx + 1] : null;

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
      <nav className="ui mb-8 flex items-center justify-between gap-4 text-sm text-ink-faint">
        <Link href="/essays" className="transition-colors hover:text-ink-soft">
          ← Essays
        </Link>
        {isSteward && (
          <span className="flex items-center gap-4">
            <Link href={`/essays/${slug}/edit`} className="text-gold hover:text-ink">
              Edit
            </Link>
            <form action={deleteEssay}>
              <input type="hidden" name="id" value={essay.id} />
              <input type="hidden" name="slug" value={slug} />
              <ConfirmButton
                confirm="Confirm delete"
                className="text-ink-faint transition-colors hover:text-red-700"
              >
                Delete
              </ConfirmButton>
            </form>
          </span>
        )}
      </nav>

      <header>
        {essay.status === "draft" && (
          <span className="ui mb-3 inline-block rounded-full border border-line px-2.5 py-0.5 text-xs text-ink-faint">
            Draft
          </span>
        )}
        <h1 className="font-serif text-4xl leading-tight tracking-tight text-ink">
          {essay.title}
        </h1>
        {essay.dek && (
          <p className="mt-3 font-serif text-xl italic leading-relaxed text-ink-soft">
            {essay.dek}
          </p>
        )}
        <p className="ui mt-4 text-sm text-ink-faint">
          {essay.themeSlug && essay.themeTitle && (
            <>
              <Link
                href={`/essays/theme/${essay.themeSlug}`}
                className="text-gold transition-colors hover:text-ink"
              >
                {essay.themeTitle}
              </Link>
              <span aria-hidden> · </span>
            </>
          )}
          {essay.byline ?? essay.authorName}
          {essay.publishedAt ? ` · ${fmt(essay.publishedAt)}` : ""}
        </p>
        <AnchorTags anchor={essay.anchor} className="mt-4" />
      </header>

      <div className="mt-8">
        <Prose scripture>{essay.body}</Prose>
      </div>

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-5">
        <ResonanceControl
          targetType="essay"
          targetId={essay.id}
          count={essay.resonanceCount}
          active={resonated.has(essay.id)}
          signedIn={signedIn}
          path={path}
          noun="this essay"
        />
        <FlagControl targetType="essay" targetId={essay.id} path={path} signedIn={signedIn} />
      </footer>

      {(prev || next) && (
        <nav className="ui mt-8 flex items-stretch justify-between gap-4 border-t border-line/70 pt-6 text-sm">
          {prev ? (
            <Link
              href={`/essays/${prev.slug}`}
              className="group flex max-w-[45%] flex-col text-left transition-colors hover:text-ink"
            >
              <span className="text-xs uppercase tracking-wider text-ink-faint">← Previous</span>
              <span className="mt-1 font-serif text-base text-ink-soft group-hover:text-ink">
                {prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {essay.themeSlug && (
            <Link
              href={`/essays/theme/${essay.themeSlug}`}
              className="self-center whitespace-nowrap text-xs text-ink-faint transition-colors hover:text-gold"
            >
              {essay.themeTitle}
            </Link>
          )}
          {next ? (
            <Link
              href={`/essays/${next.slug}`}
              className="group flex max-w-[45%] flex-col text-right transition-colors hover:text-ink"
            >
              <span className="text-xs uppercase tracking-wider text-ink-faint">Next →</span>
              <span className="mt-1 font-serif text-base text-ink-soft group-hover:text-ink">
                {next.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}

      <Reflections
        targetType="essay"
        targetId={essay.id}
        path={path}
        signedIn={signedIn}
        reflections={reflections}
      />
    </div>
  );
}
