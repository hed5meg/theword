import Link from "next/link";
import type { ResonanceTarget } from "@/lib/types";
import { toggleResonance } from "@/lib/actions/resonance";
import { ResonanceLightButton } from "@/components/ResonanceLightButton";

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
        className="ui inline-flex items-center gap-1.5 rounded-full border border-gold-soft/70 bg-card px-4 py-1.5 text-sm font-medium text-gold shadow-[0_0_16px_-3px_rgba(201,168,94,0.55)] transition-transform hover:-translate-y-px hover:bg-glow"
        title={`Sign in to say ${noun} resonates`}
      >
        <span aria-hidden>✦</span>
        {label}
      </Link>
    );
  }

  return (
    <form action={toggleResonance}>
      <input type="hidden" name="target_type" value={targetType} />
      <input type="hidden" name="target_id" value={targetId} />
      <input type="hidden" name="path" value={path} />
      <ResonanceLightButton
        active={active}
        label={label}
        activeLabel={`This resonates · ${count}`}
      />
    </form>
  );
}
