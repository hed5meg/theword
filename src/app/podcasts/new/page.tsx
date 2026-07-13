import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { getAnchorOptions } from "@/lib/data/pieces";
import { EpisodeForm } from "@/components/EpisodeForm";
import { createEpisode } from "@/lib/actions/podcasts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "New episode" };

export default async function NewEpisodePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getProfile();
  const isSteward = profile?.role === "steward" || profile?.role === "admin";
  if (!isSteward) redirect("/podcasts");

  const [options, { error }] = await Promise.all([getAnchorOptions(), searchParams]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      <nav className="ui mb-8 text-sm text-ink-faint">
        <Link href="/podcasts" className="transition-colors hover:text-ink-soft">
          ← Podcasts
        </Link>
      </nav>
      <header className="border-b border-line/70 pb-6">
        <p className="eyebrow">A new episode</p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight text-ink">Add an episode</h1>
      </header>
      <EpisodeForm
        action={createEpisode}
        options={options}
        error={error}
        cancelHref="/podcasts"
      />
    </div>
  );
}
