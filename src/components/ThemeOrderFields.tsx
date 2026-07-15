"use client";

import { useState } from "react";

const field =
  "mt-1.5 w-full rounded-xl border border-line bg-card px-4 py-3 text-ink outline-none focus:border-gold-soft";

/**
 * The essay form's Theme + Order fields. Choosing a theme auto-fills Order with
 * the next number in that theme (1 for a theme's first essay). Editing keeps the
 * essay's current order unless you move it to a different theme.
 */
export function ThemeOrderFields({
  themes,
  nextOrders,
  initialTheme = "",
  initialOrder,
  editing = false,
}: {
  themes: string[];
  nextOrders: Record<string, number>;
  initialTheme?: string;
  initialOrder?: number;
  editing?: boolean;
}) {
  const norm = (s: string) => s.trim().toLowerCase();
  const nextFor = (name: string) => nextOrders[norm(name)] ?? 1;

  const [theme, setTheme] = useState(initialTheme);
  const [order, setOrder] = useState<number | string>(
    initialOrder ?? nextFor(initialTheme),
  );

  function onThemeChange(v: string) {
    setTheme(v);
    // Back to the essay's own theme → its own order; otherwise the next slot.
    if (editing && norm(v) === norm(initialTheme)) {
      setOrder(initialOrder ?? nextFor(v));
    } else {
      setOrder(nextFor(v));
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
      <div>
        <label htmlFor="theme_name" className="block text-sm text-ink-soft">
          Theme <span className="text-ink-faint">(optional)</span>
        </label>
        <input
          id="theme_name"
          name="theme_name"
          list="essay-themes"
          value={theme}
          onChange={(e) => onThemeChange(e.target.value)}
          placeholder="e.g. Wheat and Tares"
          autoComplete="off"
          className={field}
        />
        {themes.length > 0 && (
          <datalist id="essay-themes">
            {themes.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        )}
        <p className="mt-1 text-xs text-ink-faint">
          Gather essays under a theme; reuse the same name to add more.
        </p>
      </div>
      <div>
        <label htmlFor="theme_order" className="block text-sm text-ink-soft">
          Order
        </label>
        <input
          id="theme_order"
          name="theme_order"
          type="number"
          min={1}
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          className={`${field} sm:w-24`}
        />
      </div>
    </div>
  );
}
