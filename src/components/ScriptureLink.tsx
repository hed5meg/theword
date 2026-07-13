"use client";

import { useCallback, useRef, useState } from "react";

// A scripture reference link → Gospel Library, with a hover/focus preview of the
// verse text (fetched once from /api/verse; falls back to just the link).

type Props = Record<string, unknown> & {
  node?: { properties?: Record<string, unknown> };
  href?: string;
  children?: React.ReactNode;
};

/** Read a value set by the rehype plugin, from the hast node or the DOM prop. */
function pick(props: Props, hastKey: string, domKey: string): string {
  const fromNode = props.node?.properties?.[hastKey];
  if (typeof fromNode === "string") return fromNode;
  const fromProp = props[domKey];
  return typeof fromProp === "string" ? fromProp : "";
}

export function ScriptureLink(props: Props) {
  const { href, children } = props;
  const source = pick(props, "dataSource", "data-source");
  const key = pick(props, "dataKey", "data-key");
  const ch = pick(props, "dataCh", "data-ch");
  const v1 = pick(props, "dataV1", "data-v1");
  const v2 = pick(props, "dataV2", "data-v2");
  const ref = pick(props, "dataRef", "data-ref");

  const anchorRef = useRef<HTMLAnchorElement>(null);
  const [tip, setTip] = useState<{ top: number; left: number } | null>(null);
  // undefined = not fetched, null = none, string = verse text
  const [text, setText] = useState<string | null | undefined>(undefined);
  const fetched = useRef(false);

  const load = useCallback(() => {
    if (fetched.current || !v1 || !source || !key || !ch) return;
    fetched.current = true;
    const q = new URLSearchParams({ source, key, ch, v1 });
    if (v2) q.set("v2", v2);
    fetch(`/api/verse?${q.toString()}`)
      .then((r) => r.json())
      .then((d: { text: string | null }) => setText(d.text))
      .catch(() => setText(null));
  }, [source, key, ch, v1, v2]);

  const open = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTip({ top: r.top - 8, left: r.left + r.width / 2 });
    load();
  }, [load]);

  const close = useCallback(() => setTip(null), []);

  return (
    <>
      <a
        ref={anchorRef}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="scripture-ref"
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
      >
        {children}
      </a>
      {tip && (
        <span
          role="tooltip"
          style={{
            position: "fixed",
            top: tip.top,
            left: tip.left,
            transform: "translate(-50%, -100%)",
          }}
          className="ui pointer-events-none z-50 block max-w-xs rounded-xl border border-gold-soft/50 bg-card px-3.5 py-2.5 text-sm leading-relaxed text-ink shadow-xl"
        >
          <span className="mb-1 block text-[0.65rem] font-medium uppercase tracking-wider text-gold">
            {ref || "Scripture"}
          </span>
          {text === undefined ? (
            <span className="text-ink-faint">…</span>
          ) : text ? (
            <span className="font-serif">{text}</span>
          ) : (
            <span className="text-ink-soft">Open in Gospel Library ↗</span>
          )}
        </span>
      )}
    </>
  );
}
