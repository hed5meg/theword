import Link from "next/link";
import type { ResonanceTarget } from "@/lib/types";
import { toggleResonance } from "@/lib/actions/resonance";

/**
 * Additive "this resonates" control. Signed-in members can give or withdraw a
 * single positive signal; signed-out visitors see the count and a gentle invite.
 */
export function ResonanceControl({
  targetType,
  targetId,
  count,
  active,
  signedIn,
  path,
  noun = "this",
}: {
  targetType: ResonanceTarget;
  targetId: string;
  count: number;
  active: boolean;
  signedIn: boolean;
  path: string;
  noun?: string;
}) {
  const label =
    count > 0
      ? `${count} ${count === 1 ? "light" : "lights"}`
      : "Be the first light";

  if (!signedIn) {
    return (
      <Link
        href={`/signin?next=${encodeURIComponent(path)}`}
        className="ui inline-flex items-center gap-1.5 text-xs text-ink-faint transition-colors hover:text-ink-soft"
        title={`Sign in to say ${noun} resonates`}
      >
        <span aria-hidden className="text-gold-soft">
          ✦
        </span>
        {label}
      </Link>
    );
  }

  return (
    <form action={toggleResonance}>
      <input type="hidden" name="target_type" value={targetType} />
      <input type="hidden" name="target_id" value={targetId} />
      <input type="hidden" name="path" value={path} />
      <button
        type="submit"
        aria-pressed={active}
        className={`ui inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
          active
            ? "border-gold-soft/60 bg-glow text-gold"
            : "border-line text-ink-faint hover:border-gold-soft/50 hover:text-ink-soft"
        }`}
      >
        <span aria-hidden>✦</span>
        {active ? `This resonates · ${count}` : label}
      </button>
    </form>
  );
}
