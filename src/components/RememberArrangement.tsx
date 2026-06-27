"use client";

import { useEffect } from "react";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Remembers the arrangement you're reading, so a bare /read returns you here. */
export function RememberArrangement({ slug }: { slug: string }) {
  useEffect(() => {
    document.cookie = `arrangement=${slug}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  }, [slug]);
  return null;
}
