import type { Tenet } from "@/lib/types";

/**
 * The tenets a rendering says it read by. Rendered as quiet chips; the title
 * attribute surfaces the plain description until the Tenets library ships (M2).
 */
export function TenetList({ tenets }: { tenets: Tenet[] }) {
  if (tenets.length === 0) return null;
  return (
    <div className="ui flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-wider text-ink-faint">
        Read through
      </span>
      {tenets.map((t) => (
        <span
          key={t.slug}
          title={t.description}
          className="rounded-full border border-line bg-parchment-deep/60 px-3 py-1 text-xs text-ink-soft"
        >
          {t.title}
        </span>
      ))}
    </div>
  );
}
