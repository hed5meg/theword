import type { Rendering } from "@/lib/types";
import type { GatheredEvent } from "@/lib/data/gathering";
import { promoteGathered } from "@/lib/actions/gathering";

function snippet(body: string, n = 80): string {
  const clean = body.replace(/\s+/g, " ").trim();
  return clean.length > n ? clean.slice(0, n) + "…" : clean;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

/** The history of how this passage has been gathered. Visible to everyone. */
export function GatheredHistory({ events }: { events: GatheredEvent[] }) {
  if (events.length === 0) return null;
  return (
    <details className="ui mt-8 rounded-2xl border border-line bg-parchment-deep/40 px-5 py-4">
      <summary className="cursor-pointer list-none text-sm uppercase tracking-wider text-ink-faint">
        How this passage has been gathered ({events.length})
      </summary>
      <ul className="mt-4 space-y-3 text-sm text-ink-soft">
        {events.map((e, i) => (
          <li key={i} className="border-l-2 border-line pl-3">
            <p className="text-ink">
              {e.renderingAuthor ? `Gathered "${e.renderingAuthor}"` : "Gathered a rendering"}
              {e.promotedBy && <span className="text-ink-faint"> · by {e.promotedBy}</span>}
              {e.createdAt && <span className="text-ink-faint"> · {formatDate(e.createdAt)}</span>}
            </p>
            {e.note && <p className="mt-0.5 italic text-ink-soft">“{e.note}”</p>}
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Steward-only controls to set or replace the Gathered Rendering. */
export function StewardPassageTools({
  passageId,
  renderings,
  path,
}: {
  passageId: string;
  renderings: Rendering[];
  path: string;
}) {
  const candidates = renderings.filter((r) => !r.isGathered && r.id);

  return (
    <section className="ui mt-10 rounded-2xl border border-gold-soft/50 bg-glow/30 p-6">
      <h2 className="font-serif text-xl text-ink">Steward · gather this passage</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Set the community&rsquo;s current Gathered Rendering. Nothing is destroyed —
        the previous one returns to the side, and the change is recorded.
      </p>

      {candidates.length > 0 && (
        <form action={promoteGathered} className="mt-5 space-y-3">
          <input type="hidden" name="passage_id" value={passageId} />
          <input type="hidden" name="path" value={path} />
          <fieldset className="space-y-2">
            <legend className="text-sm text-ink-soft">Promote an existing rendering</legend>
            {candidates.map((r) => (
              <label
                key={r.id}
                className="flex items-start gap-2 rounded-lg border border-line bg-card/60 p-2.5 text-sm"
              >
                <input type="radio" name="rendering_id" value={r.id} required className="mt-1" />
                <span>
                  <span className="text-ink-soft">{r.author}</span>
                  <span className="block text-ink-faint">{snippet(r.body)}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <input
            name="note"
            placeholder="A note on this gathering (optional)"
            className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:border-gold-soft"
          />
          <button
            type="submit"
            className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-parchment transition-opacity hover:opacity-90"
          >
            Make this the Gathered Rendering
          </button>
        </form>
      )}

      <details className="mt-5 group">
        <summary className="cursor-pointer list-none text-sm text-gold transition-colors hover:text-ink">
          Or gather a merged rendering
        </summary>
        <form action={promoteGathered} className="mt-3 space-y-3">
          <input type="hidden" name="passage_id" value={passageId} />
          <input type="hidden" name="path" value={path} />
          <textarea
            name="merged_body"
            required
            rows={8}
            placeholder="Paste or write a merged rendering that gathers the best of the others…"
            className="w-full rounded-lg border border-line bg-card px-3 py-2 font-serif text-base text-ink outline-none focus:border-gold-soft"
          />
          <input
            name="note"
            placeholder="A note on this gathering (optional)"
            className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:border-gold-soft"
          />
          <button
            type="submit"
            className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-parchment transition-opacity hover:opacity-90"
          >
            Gather this merged rendering
          </button>
        </form>
      </details>
    </section>
  );
}
