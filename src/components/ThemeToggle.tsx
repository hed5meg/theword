"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const OPTIONS: { value: string; label: string; glyph: string }[] = [
  { value: "system", label: "System theme", glyph: "◐" },
  { value: "light", label: "Light theme", glyph: "☼" },
  { value: "dark", label: "Dark theme", glyph: "☾" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Standard next-themes hydration guard: theme is unknown until mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Reserve space until mounted to avoid a hydration flash.
  if (!mounted) {
    return <div className="h-7 w-[5.25rem]" aria-hidden />;
  }

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="ui flex items-center gap-0.5 rounded-full border border-line p-0.5"
    >
      {OPTIONS.map((o) => {
        const active = (theme ?? "system") === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setTheme(o.value)}
            aria-label={o.label}
            aria-pressed={active}
            title={o.label}
            className={`flex h-6 w-6 items-center justify-center rounded-full text-sm transition-colors ${
              active
                ? "bg-glow text-gold"
                : "text-ink-faint hover:text-ink"
            }`}
          >
            <span aria-hidden>{o.glyph}</span>
          </button>
        );
      })}
    </div>
  );
}
