"use client";

import { useRouter } from "next/navigation";
import type { ArrangementMeta } from "@/lib/types";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * "Reading: {name} ▾" — switches the active arrangement. Persists the choice in
 * a cookie and navigates to that arrangement's table of contents. Native select,
 * so it's keyboard- and screen-reader-accessible.
 */
export function ArrangementSelector({
  arrangements,
  current,
}: {
  arrangements: ArrangementMeta[];
  current: string;
}) {
  const router = useRouter();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const slug = e.target.value;
    document.cookie = `arrangement=${slug}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    router.push(`/read/${slug}`);
  }

  return (
    <label className="ui inline-flex items-center gap-2 text-sm text-ink-soft">
      <span className="text-ink-faint">Reading:</span>
      <select
        value={current}
        onChange={onChange}
        aria-label="Choose an arrangement to read"
        className="rounded-full border border-line bg-card px-3 py-1.5 text-ink outline-none focus:border-gold-soft"
      >
        {arrangements.map((a) => (
          <option key={a.slug} value={a.slug}>
            {a.title}
          </option>
        ))}
      </select>
    </label>
  );
}
