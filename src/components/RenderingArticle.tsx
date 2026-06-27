import type { Rendering } from "@/lib/types";
import { Prose } from "@/components/Prose";
import { TenetList } from "@/components/TenetList";

/**
 * One rendering of a passage. The gathered rendering is set larger and airier;
 * alternatives sit calmly beside it, never ranked.
 */
export function RenderingArticle({
  rendering,
  variant = "alternative",
}: {
  rendering: Rendering;
  variant?: "gathered" | "alternative";
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
        <span className="text-ink-soft">{rendering.author}</span>
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
        <ResonanceTally count={rendering.resonanceCount} />
      </footer>
    </article>
  );
}

function ResonanceTally({ count }: { count: number }) {
  return (
    <p className="ui flex items-center gap-1.5 text-xs text-ink-faint">
      <span aria-hidden className="text-gold-soft">
        ✦
      </span>
      {count > 0
        ? `${count} ${count === 1 ? "person resonates" : "people resonate"} with this`
        : "Resonance opens with accounts soon — this rendering is waiting for the first light"}
    </p>
  );
}
