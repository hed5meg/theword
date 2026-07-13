import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { IdempotencyField } from "@/components/IdempotencyField";
import { SubmitButton } from "@/components/SubmitButton";
import { subscribeFeed } from "@/lib/actions/podcast-feeds";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Subscribe to a show" };

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getProfile();
  const isSteward = profile?.role === "steward" || profile?.role === "admin";
  if (!isSteward) redirect("/podcasts");
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-xl px-5 py-12 sm:px-8">
      <nav className="ui mb-8 text-sm text-ink-faint">
        <Link href="/podcasts" className="transition-colors hover:text-ink-soft">
          ← Podcasts
        </Link>
      </nav>
      <header className="border-b border-line/70 pb-6">
        <p className="eyebrow">Subscribe to a show</p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight text-ink">
          Add a podcast by its feed
        </h1>
        <p className="mt-2 text-ink-soft">
          Paste the show&rsquo;s RSS feed URL. Every episode will appear here
          automatically and stay current — new ones show up on their own.
        </p>
      </header>

      <form action={subscribeFeed} className="ui mt-8 space-y-4">
        <IdempotencyField />
        {error === "required" && (
          <p className="text-sm text-red-700">Please paste a feed URL.</p>
        )}
        {error === "unreadable" && (
          <p className="text-sm text-red-700">
            That feed couldn&rsquo;t be read. Double-check it&rsquo;s the RSS feed URL
            (not the Spotify page).
          </p>
        )}
        {error === "save" && (
          <p className="text-sm text-red-700">Something went wrong. Please try again.</p>
        )}
        <div>
          <label htmlFor="feed_url" className="block text-sm text-ink-soft">
            RSS feed URL
          </label>
          <input
            id="feed_url"
            name="feed_url"
            type="url"
            required
            placeholder="https://anchor.fm/s/…/podcast/rss"
            className="mt-1.5 w-full rounded-xl border border-line bg-card px-4 py-3 text-ink outline-none focus:border-gold-soft"
          />
          <p className="mt-1 text-xs text-ink-faint">
            Find it in your podcast host (Spotify for Podcasters, Buzzsprout,
            Transistor, Substack…) under “RSS feed.”
          </p>
        </div>
        <SubmitButton
          pendingLabel="Reading the feed…"
          className="rounded-full bg-ink px-7 py-3 text-sm font-medium text-parchment transition-opacity hover:opacity-90"
        >
          Subscribe
        </SubmitButton>
      </form>
    </div>
  );
}
