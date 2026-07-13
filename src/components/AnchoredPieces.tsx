import Link from "next/link";
import type { AnchoredPieces as Pieces } from "@/lib/data/pieces";

// A quiet strip of essays / episodes anchored to the current reader page.
export function AnchoredPieces({
  pieces,
  className = "",
}: {
  pieces: Pieces;
  className?: string;
}) {
  const { essays, episodes } = pieces;
  if (essays.length === 0 && episodes.length === 0) return null;

  return (
    <section className={`rounded-2xl border border-line bg-card/40 p-5 ${className}`}>
      {essays.length > 0 && (
        <div>
          <h3 className="eyebrow">Essays on this</h3>
          <ul className="mt-2 space-y-1.5">
            {essays.map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/essays/${e.slug}`}
                  className="ui text-ink-soft transition-colors hover:text-gold"
                >
                  {e.title}
                  {(e.byline || e.authorName) && (
                    <span className="text-ink-faint"> · {e.byline ?? e.authorName}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {episodes.length > 0 && (
        <div className={essays.length > 0 ? "mt-4" : ""}>
          <h3 className="eyebrow">Listen</h3>
          <ul className="mt-2 space-y-1.5">
            {episodes.map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/podcasts/${e.slug}`}
                  className="ui text-ink-soft transition-colors hover:text-gold"
                >
                  ♫ {e.title}
                  {(e.byline || e.authorName) && (
                    <span className="text-ink-faint"> · {e.byline ?? e.authorName}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
