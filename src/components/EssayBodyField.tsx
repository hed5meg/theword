"use client";

import { useRef, useState } from "react";
import type { EssayLinkTarget } from "@/lib/data/essays";

/**
 * The essay body textarea with a cross-link picker: pick a target essay (and
 * optionally a section/anchor within it), and it inserts the [[…]] shorthand at
 * the cursor — wrapping any selected text as the link label.
 */
export function EssayBodyField({
  defaultValue = "",
  targets,
  className = "",
  placeholder,
  rows = 16,
}: {
  defaultValue?: string;
  targets: EssayLinkTarget[];
  className?: string;
  placeholder?: string;
  rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState(targets[0]?.slug ?? "");
  const [anchorId, setAnchorId] = useState("");
  const [label, setLabel] = useState("");
  const sel = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  const current = targets.find((t) => t.slug === slug);
  const target = anchorId ? `${slug}#${anchorId}` : slug;
  const token = label.trim() ? `[[${target}|${label.trim()}]]` : `[[${target}]]`;

  function openPicker() {
    const ta = ref.current;
    if (ta) {
      sel.current = { start: ta.selectionStart, end: ta.selectionEnd };
      setLabel(value.slice(ta.selectionStart, ta.selectionEnd));
    }
    setOpen(true);
  }

  function insert() {
    const { start, end } = sel.current;
    const next = value.slice(0, start) + token + value.slice(end);
    setValue(next);
    setOpen(false);
    setAnchorId("");
    setLabel("");
    requestAnimationFrame(() => {
      const ta = ref.current;
      if (ta) {
        ta.focus();
        const pos = start + token.length;
        ta.setSelectionRange(pos, pos);
      }
    });
  }

  const selectClass =
    "rounded-lg border border-line bg-card px-2 py-1.5 text-sm text-ink outline-none focus:border-gold-soft";

  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor="body" className="block text-sm text-ink-soft">
          Essay
        </label>
        {targets.length > 0 && (
          <button
            type="button"
            onClick={openPicker}
            className="ui text-xs text-gold transition-colors hover:text-ink"
          >
            ＋ Link an essay
          </button>
        )}
      </div>

      <textarea
        id="body"
        name="body"
        ref={ref}
        required
        rows={rows}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
      <p className="mt-1 text-xs text-ink-faint">
        Markdown is welcome. Link essays with{" "}
        <code className="text-ink-soft">[[slug#anchor|text]]</code>; anchor a
        paragraph by ending it with <code className="text-ink-soft">{"{#name}"}</code>.
      </p>

      {open && (
        <div className="ui mt-3 rounded-xl border border-gold-soft/40 bg-glow/30 p-4">
          <p className="mb-3 text-xs uppercase tracking-wider text-gold">Link an essay</p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col text-xs text-ink-faint">
              Essay
              <select
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setAnchorId("");
                }}
                className={`mt-1 ${selectClass}`}
              >
                {targets.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-xs text-ink-faint">
              Section
              <select
                value={anchorId}
                onChange={(e) => setAnchorId(e.target.value)}
                className={`mt-1 ${selectClass}`}
              >
                <option value="">— whole essay —</option>
                {(current?.anchors ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-1 flex-col text-xs text-ink-faint">
              Link text <span className="text-ink-faint/70">(optional)</span>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={current?.title ?? ""}
                className={`mt-1 min-w-0 ${selectClass}`}
              />
            </label>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={insert}
              className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-parchment hover:opacity-90"
            >
              Insert
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-ink-faint transition-colors hover:text-ink-soft"
            >
              Cancel
            </button>
            <code className="ml-auto truncate text-xs text-ink-faint">{token}</code>
          </div>
        </div>
      )}
    </div>
  );
}
