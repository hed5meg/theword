import Link from "next/link";
import type { Rendering } from "@/lib/types";
import { Prose } from "@/components/Prose";
import { TenetList } from "@/components/TenetList";
import { ResonanceControl } from "@/components/ResonanceControl";

/**
 * One rendering of a passage. The gathered rendering is set larger and airier;
 * alternatives sit calmly beside it, never ranked.
 */
export function RenderingArticle({
  rendering,
  variant = "alternative",
  signedIn = false,
  resonated = false,
  path = "/",
}: {
  rendering: Rendering;
  variant?: "gathered" | "alternative";
  signedIn?: boolean;
  resonated?: boolean;
  path?: string;
}) {
  const isGathered = variant === "gathered";

  return (
    <article className={isGathered ? "" : "rounded-2xl border border-line bg-card/50 p-6 sm:p-8"}>
      <header className="ui mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-faint">
        {isGathered && (
          <span className="rounded-full bg-glow px-3 py-1 text-xs font-medium tracking-wide text-gold">
            Gathered Rendering
          </span>
        )}
        {rendering.authorHandle ? (
          <Link
            href={`/members/${rendering.authorHandle}`}
            className="text-ink-soft transition-colors hover:text-ink"
          >
            {rendering.author}
          </Link>
        ) : (
          <span className="text-ink-soft">{rendering.author}</span>
        )}
        <span aria-hidden>·</span>
        <span>{rendering.language}</span>
        {rendering.tradition && (
          <>
            <span aria-hidden>·</span>
            <span>{rendering.tradition}</span>
          </>
        )}
      </header>

      <Prose className={isGathered ? "prose-gathered" : ""}>
        {rendering.body}
      </Prose>

      <footer className="mt-6 flex flex-col gap-4 border-t border-line/70 pt-4">
        <TenetList tenets={rendering.tenets} />
        {rendering.id && (
          <ResonanceControl
            targetType="rendering"
            targetId={rendering.id}
            count={rendering.resonanceCount}
            active={resonated}
            signedIn={signedIn}
            path={path}
            noun="this rendering"
          />
        )}
      </footer>
    </article>
  );
}
