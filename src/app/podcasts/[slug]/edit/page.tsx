import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { getEpisodeForEdit } from "@/lib/data/podcasts";
import { getAnchorOptions } from "@/lib/data/pieces";
import { EpisodeForm } from "@/components/EpisodeForm";
import { updateEpisode } from "@/lib/actions/podcasts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit episode" };

export default async function EditEpisodePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const profile = await getProfile();
  const isSteward = profile?.role === "steward" || profile?.role === "admin";
  if (!isSteward) redirect(`/podcasts/${slug}`);

  const [editing, options, { error }] = await Promise.all([
    getEpisodeForEdit(slug),
    getAnchorOptions(),
    searchParams,
  ]);
  if (!editing) notFound();

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      <nav className="ui mb-8 text-sm text-ink-faint">
        <Link href={`/podcasts/${slug}`} className="transition-colors hover:text-ink-soft">
          ← Back to the episode
        </Link>
      </nav>
      <header className="border-b border-line/70 pb-6">
        <p className="eyebrow">Edit episode</p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight text-ink">{editing.title}</h1>
      </header>
      <EpisodeForm
        action={updateEpisode}
        editing={editing}
        options={options}
        error={error}
        cancelHref={`/podcasts/${slug}`}
      />
    </div>
  );
}
