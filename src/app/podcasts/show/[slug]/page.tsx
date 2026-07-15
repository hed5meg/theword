import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getShow } from "@/lib/data/podcast-feeds";
import { getProfile } from "@/lib/auth";
import { EpisodePlayer } from "@/components/EpisodePlayer";
import { unsubscribeFeed } from "@/lib/actions/podcast-feeds";
import { ConfirmButton } from "@/components/ConfirmButton";
import { pageMeta } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const show = await getShow(slug);
  if (!show) return {};
  return pageMeta({
    title: show.title,
    description:
      show.feed.description || `${show.title} — a podcast on theword.love.`,
    pathname: `/podcasts/show/${slug}`,
  });
}

export default async function ShowPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [show, profile] = await Promise.all([getShow(slug), getProfile()]);
  if (!show) notFound();
  const isSteward = profile?.role === "steward" || profile?.role === "admin";
  const { feed } = show;

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
      <nav className="ui mb-8 flex items-center justify-between gap-4 text-sm text-ink-faint">
        <Link href="/podcasts" className="transition-colors hover:text-ink-soft">
          ← Podcasts
        </Link>
        {isSteward && (
          <form action={unsubscribeFeed}>
            <input type="hidden" name="id" value={show.id} />
            <ConfirmButton
              confirm="Confirm unsubscribe"
              className="ui text-ink-faint transition-colors hover:text-red-700"
            >
              Unsubscribe
            </ConfirmButton>
          </form>
        )}
      </nav>

      <header className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {feed.image && (
          <Image
            src={feed.image}
            alt=""
            width={112}
            height={112}
            unoptimized
            className="size-24 shrink-0 rounded-2xl border border-line object-cover sm:size-28"
          />
        )}
        <div className="min-w-0">
          <p className="eyebrow">A show</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight tracking-tight text-ink">
            {show.title}
          </h1>
          {feed.description && (
            <p className="mt-3 leading-relaxed text-ink-soft">{feed.description}</p>
          )}
          <p className="ui mt-3 text-xs text-ink-faint">
            {feed.episodes.length}{" "}
            {feed.episodes.length === 1 ? "episode" : "episodes"}
            {feed.link && (
              <>
                {" · "}
                <a
                  href={feed.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:text-ink"
                >
                  Show site ↗
                </a>
              </>
            )}
          </p>
        </div>
      </header>

      <section className="mt-10 space-y-4">
        {feed.episodes.length > 0 ? (
          feed.episodes.map((ep) => <EpisodePlayer key={ep.guid} episode={ep} />)
        ) : (
          <p className="rounded-2xl border border-dashed border-line bg-card/40 p-6 text-ink-soft">
            No episodes in this feed yet.
          </p>
        )}
      </section>
    </div>
  );
}
