"use client";

import { playBloom } from "@/lib/bloom";

/**
 * The resonance submit button. Adding your light blooms the page (same warm
 * flare as the hero CTA); withdrawing it doesn't. Styled to pop, gently.
 */
export function ResonanceLightButton({
  active,
  label,
  activeLabel,
}: {
  active: boolean;
  label: string;
  activeLabel: string;
}) {
  return (
    <button
      type="submit"
      aria-pressed={active}
      onClick={() => {
        if (!active) playBloom();
      }}
      className={`ui inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-transform hover:-translate-y-px ${
        active
          ? "border-gold-soft bg-glow text-gold"
          : "border-gold-soft/70 bg-card text-gold shadow-[0_0_16px_-3px_rgba(201,168,94,0.55)] hover:bg-glow"
      }`}
    >
      <span aria-hidden className="cta-star">
        ✦
      </span>
      {active ? activeLabel : label}
    </button>
  );
}
