import type { FlagTarget } from "@/lib/types";
import { createFlag } from "@/lib/actions/flags";
import { IdempotencyField } from "@/components/IdempotencyField";

/**
 * A quiet "flag for a steward" disclosure. Shown only to signed-in members so
 * the reading surface stays calm.
 */
export function FlagControl({
  targetType,
  targetId,
  path,
  signedIn,
}: {
  targetType: FlagTarget;
  targetId: string;
  path: string;
  signedIn: boolean;
}) {
  if (!signedIn) return null;
  return (
    <details className="ui group">
      <summary className="cursor-pointer list-none text-xs text-ink-faint transition-colors hover:text-ink-soft">
        Flag for a steward
      </summary>
      <form action={createFlag} className="mt-2 flex flex-col gap-2 sm:flex-row">
        <IdempotencyField />
        <input type="hidden" name="target_type" value={targetType} />
        <input type="hidden" name="target_id" value={targetId} />
        <input type="hidden" name="path" value={path} />
        <input
          name="reason"
          placeholder="What feels off here? (optional)"
          className="w-full rounded-lg border border-line bg-card px-3 py-1.5 text-sm text-ink outline-none focus:border-gold-soft"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-gold-soft/50 hover:text-ink"
        >
          Send to a steward
        </button>
      </form>
    </details>
  );
}
