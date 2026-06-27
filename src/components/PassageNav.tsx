import Link from "next/link";
import type { ArrangementOutlineGroup } from "@/lib/types";

/**
 * In-passage wayfinding within the active arrangement: a "Passage X of Y"
 * indicator and a jump menu (movements → passages). Native <details>, so it's
 * fully keyboard- and screen-reader-accessible without JavaScript.
 */
export function PassageNav({
  arrangementSlug,
  groups,
  currentSlug,
  position,
  total,
}: {
  arrangementSlug: string;
  groups: ArrangementOutlineGroup[];
  currentSlug: string;
  position: number;
  total: number;
}) {
  return (
    <div className="ui flex items-center gap-3">
      <span className="text-xs text-ink-faint" aria-label={`Passage ${position} of ${total}`}>
        Passage {position} of {total}
      </span>
      <details className="relative">
        <summary className="flex cursor-pointer list-none items-center gap-1 rounded-full border border-line px-3 py-1 text-xs text-ink-soft transition-colors hover:border-gold-soft/50 hover:text-ink">
          Jump to a passage
          <span aria-hidden>⌄</span>
        </summary>
        <nav
          aria-label="All passages"
          className="absolute right-0 z-30 mt-2 max-h-[70vh] w-72 overflow-y-auto rounded-xl border border-line bg-card p-3 shadow-lg"
        >
          {groups.map((g, gi) => (
            <div key={g.title ?? `g-${gi}`} className="mb-3 last:mb-0">
              {g.title && (
                <p className="px-2 py-1 text-xs uppercase tracking-wider text-ink-faint">
                  {g.title}
                </p>
              )}
              <ul>
                {g.entries.map((p) => {
                  const current = p.slug === currentSlug;
                  return (
                    <li key={p.slug}>
                      <Link
                        href={`/read/${arrangementSlug}/${p.slug}`}
                        aria-current={current ? "page" : undefined}
                        className={`block rounded-lg px-2 py-1.5 text-sm transition-colors ${
                          current
                            ? "bg-glow font-medium text-gold"
                            : "text-ink-soft hover:bg-parchment-deep/60 hover:text-ink"
                        }`}
                      >
                        {p.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </details>
    </div>
  );
}
