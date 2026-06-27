"use client";

import Link from "next/link";
import { playBloom } from "@/lib/bloom";

export function LightCTA({
  href,
  children = "Add your light",
  className = "",
}: {
  href: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} onClick={playBloom} className={`ui light-cta ${className}`}>
      <span aria-hidden className="cta-star text-base">
        ✦
      </span>
      {children}
    </Link>
  );
}
