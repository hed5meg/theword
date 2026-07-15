import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEpisode } from "@/lib/data/podcasts";
import { getProfile } from "@/lib/auth";
import { getMyResonatedIds } from "@/lib/resonance";
import { getReflections } from "@/lib/data/reflections";
import { Prose } from "@/components/Prose";
import { ResonanceControl } from "@/components/ResonanceControl";
import { FlagControl } from "@/components/FlagControl";
import { Reflections } from "@/components/Reflections";
import { AudioEmbed } from "@/components/AudioEmbed";
import { AnchorTags } from "@/components/AnchorTags";
import { deleteEpisode } from "@/lib/actions/podcasts";
import { ConfirmButton } from "@/components/ConfirmButton";
import { pageMeta, summarize } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ep = await getEpisode(slug);
  if (!ep) return {};
  return pageMeta({
    title: ep.title,
    description:
      (ep.notes && summarize(ep.notes)) ||
      ep.series ||
      "An episode on theword.love.",
    pathname: `/podcasts/${slug}`,
    type: "article",
    staticImage: false,
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

export default async function EpisodePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ep = await getEpisode(slug);
  if (!ep) notFound();

  const profile = await getProfile();
  const signedIn = Boolean(profile);
  const isSteward = profile?.role === "steward" || profile?.role === "admin";
  const path = `/podcasts/${slug}`;

  const [resonated, reflections] = await Promise.all([
    getMyResonatedIds("episode", [ep.id]),
    getReflections("episode", ep.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
      <nav className="ui mb-8 flex items-center justify-between gap-4 text-sm text-ink-faint">
        <Link href="/podcasts" className="transition-colors hover:text-ink-soft">
          ← Podcasts
        </Link>
        {isSteward && (
          <span className="flex items-center gap-4">
            <Link href={`/podcasts/${slug}/edit`} className="text-gold hover:text-ink">
              Edit
            </Link>
            <form action={deleteEpisode}>
              <input type="hidden" name="id" value={ep.id} />
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
        {ep.status === "draft" && (
          <span className="ui mb-3 inline-block rounded-full border border-line px-2.5 py-0.5 text-xs text-ink-faint">
            Draft
          </span>
        )}
        {ep.series && <p className="eyebrow">{ep.series}</p>}
        <h1 className="mt-2 font-serif text-4xl leading-tight tracking-tight text-ink">
          {ep.title}
        </h1>
        <p className="ui mt-3 text-sm text-ink-faint">
          {ep.byline ?? ep.authorName}
          {ep.publishedAt ? ` · ${fmt(ep.publishedAt)}` : ""}
        </p>
        <AnchorTags anchor={ep.anchor} className="mt-4" />
      </header>

      <div className="mt-6">
        <AudioEmbed url={ep.audioUrl} />
      </div>

      {ep.notes && (
        <div className="mt-8">
          <Prose scripture>{ep.notes}</Prose>
        </div>
      )}

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-5">
        <ResonanceControl
          targetType="episode"
          targetId={ep.id}
          count={ep.resonanceCount}
          active={resonated.has(ep.id)}
          signedIn={signedIn}
          path={path}
          noun="this episode"
        />
        <FlagControl targetType="episode" targetId={ep.id} path={path} signedIn={signedIn} />
      </footer>

      <Reflections
        targetType="episode"
        targetId={ep.id}
        path={path}
        signedIn={signedIn}
        reflections={reflections}
      />
    </div>
  );
}
