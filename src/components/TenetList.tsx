import Link from "next/link";
import type { Tenet } from "@/lib/types";

/**
 * The tenets a rendering says it read by — tappable chips that link into the
 * Tenets library. When `showInfo` is set (the first time tenets appear on a
 * passage), a small accessible popover explains what a tenet is.
 */
export function TenetList({
  tenets,
  showInfo = false,
}: {
  tenets: Tenet[];
  showInfo?: boolean;
}) {
  if (tenets.length === 0) return null;
  return (
    <div className="ui flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-wider text-ink-faint">
        Read through
      </span>
      {showInfo && <TenetInfo />}
      {tenets.map((t) => (
        <Link
          key={t.slug}
          href={`/principles/${t.slug}`}
          title={t.description}
          className="rounded-full border border-gold-soft/40 bg-parchment-deep/50 px-3 py-1 text-xs text-ink-soft transition-colors hover:border-gold-soft hover:bg-glow hover:text-ink"
        >
          {t.title}
        </Link>
      ))}
    </div>
  );
}

function TenetInfo() {
  return (
    <details className="relative inline-block">
      <summary
        className="flex cursor-pointer list-none items-center gap-1 rounded-full border border-line px-2 py-1 text-xs text-ink-faint transition-colors hover:border-gold-soft/50 hover:text-ink-soft"
        aria-label="What is a principle?"
      >
        <span aria-hidden className="font-medium">
          ⓘ
        </span>
        What&rsquo;s a principle?
      </summary>
      <div
        role="note"
        className="absolute left-0 z-20 mt-2 w-72 rounded-xl border border-line bg-card p-4 text-sm leading-relaxed text-ink-soft shadow-lg"
      >
        A <strong className="text-ink">principle</strong> is a lens the community
        reads the text through, tested against love. Each rendering names the
        principles it applied.
        <Link
          href="/principles"
          className="mt-2 block text-gold underline-offset-2 hover:underline"
        >
          Explore the principles →
        </Link>
      </div>
    </details>
  );
}
