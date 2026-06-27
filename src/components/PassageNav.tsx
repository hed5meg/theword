import Link from "next/link";
import type { MovementOutline } from "@/lib/types";

/**
 * In-passage wayfinding: a "Passage X of Y" progress indicator and a jump menu
 * listing every movement and passage. The menu is a native <details> disclosure
 * so it is fully keyboard- and screen-reader-accessible without JavaScript.
 */
export function PassageNav({
  outline,
  movementSlug,
  passageSlug,
  position,
  total,
}: {
  outline: MovementOutline[];
  movementSlug: string;
  passageSlug: string;
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
          {outline.map((m) => (
            <div key={m.slug} className="mb-3 last:mb-0">
              <p className="px-2 py-1 text-xs uppercase tracking-wider text-ink-faint">
                {m.title}
              </p>
              <ul>
                {m.passages.map((p) => {
                  const current =
                    p.movementSlug === movementSlug && p.slug === passageSlug;
                  return (
                    <li key={p.slug}>
                      <Link
                        href={`/read/${m.slug}/${p.slug}`}
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
