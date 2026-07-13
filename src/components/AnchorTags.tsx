import Link from "next/link";
import type { PieceAnchor } from "@/lib/types";

// Small linked chips for wherever a piece is anchored (passage / arrangement /
// principle). Renders nothing when the piece is standalone.
export function AnchorTags({
  anchor,
  className = "",
}: {
  anchor: PieceAnchor;
  className?: string;
}) {
  const tags: { href: string; label: string }[] = [];
  if (anchor.passageSlug && anchor.passageTitle) {
    tags.push({
      href: `/read/the-canonical-order/${anchor.passageSlug}`,
      label: anchor.passageTitle,
    });
  }
  if (anchor.arrangementSlug && anchor.arrangementTitle) {
    tags.push({
      href: `/read/${anchor.arrangementSlug}`,
      label: anchor.arrangementTitle,
    });
  }
  if (anchor.tenetSlug && anchor.tenetTitle) {
    tags.push({
      href: `/principles/${anchor.tenetSlug}`,
      label: anchor.tenetTitle,
    });
  }
  if (tags.length === 0) return null;

  return (
    <div className={`ui flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-xs text-ink-faint">On:</span>
      {tags.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className="inline-block rounded-full border border-gold-soft/50 bg-glow/40 px-3 py-1 text-xs text-gold transition-colors hover:bg-glow"
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
