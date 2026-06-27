"use client";

import { useRouter } from "next/navigation";

/**
 * Choose which rendering of a passage to read. One at a time, never ranked —
 * the gathered rendering leads; the rest are equals in the list. (True
 * side-by-side reading lives in Compare mode.)
 */
export function RenderingPicker({
  options,
  current,
  basePath,
}: {
  options: { key: string; label: string }[];
  current: string;
  basePath: string;
}) {
  const router = useRouter();
  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const key = e.target.value;
    const url = key === "gathered" ? basePath : `${basePath}?rendering=${key}`;
    router.replace(url, { scroll: false });
  }
  return (
    <label className="ui flex min-w-0 max-w-full items-center gap-2 text-sm text-ink-soft">
      <span className="shrink-0 text-ink-faint">Rendering:</span>
      <select
        value={current}
        onChange={onChange}
        aria-label="Choose a rendering to read"
        className="min-w-0 max-w-full truncate rounded-full border border-line bg-card px-3 py-1.5 text-ink outline-none focus:border-gold-soft"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
