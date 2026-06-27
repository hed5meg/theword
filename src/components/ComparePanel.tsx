"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

export interface CompareText {
  key: string; // "traditional" | "gathered" | <rendering id>
  label: string;
  kind: "traditional" | "rendering";
  body: string;
  language?: string;
  tradition?: string;
  tenets?: { slug: string; title: string }[];
  canonicalRef?: string;
}

export function ComparePanel({
  texts,
  initialLeft,
  initialRight,
  basePath,
}: {
  texts: CompareText[];
  initialLeft: string;
  initialRight: string;
  basePath: string;
}) {
  const router = useRouter();
  const fallback = texts.find((t) => t.key === "gathered") ?? texts[0];
  const resolve = (key: string) => texts.find((t) => t.key === key) ?? fallback;

  const [left, setLeft] = useState(resolve(initialLeft).key);
  const [right, setRight] = useState(resolve(initialRight).key);
  const [mobileSide, setMobileSide] = useState<"left" | "right">("left");
  const [message, setMessage] = useState("");

  function sync(l: string, r: string) {
    router.replace(`${basePath}?compare=${l},${r}`, { scroll: false });
  }
  function pick(side: "left" | "right", key: string) {
    if (side === "left") {
      setLeft(key);
      sync(key, right);
      setMessage(`Left pane now showing ${resolve(key).label}`);
    } else {
      setRight(key);
      sync(left, key);
      setMessage(`Right pane now showing ${resolve(key).label}`);
    }
  }
  function swap() {
    setLeft(right);
    setRight(left);
    sync(right, left);
    setMessage("Swapped the two panes");
  }
  function exit() {
    router.replace(basePath, { scroll: false });
  }

  const leftText = resolve(left);
  const rightText = resolve(right);
  const sameText = left === right;

  return (
    <section aria-label="Comparison" className="mt-8">
      <div aria-live="polite" className="sr-only">
        {message}
      </div>

      {/* Control bar */}
      <div className="ui flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-card/60 px-4 py-3">
        <span className="text-sm font-medium text-ink">Comparing two texts</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={swap}
            aria-label="Swap the two panes"
            className="rounded-full border border-line px-3 py-1 text-sm text-ink-soft transition-colors hover:border-gold-soft/50 hover:text-ink"
          >
            ⇄ Swap
          </button>
          <button
            type="button"
            onClick={exit}
            className="rounded-full border border-line px-3 py-1 text-sm text-ink-soft transition-colors hover:border-gold-soft/50 hover:text-ink"
          >
            Close compare
          </button>
        </div>
      </div>

      {sameText && (
        <p className="ui mt-3 rounded-xl border border-dashed border-line bg-parchment-deep/40 px-4 py-2 text-sm text-ink-soft">
          You&rsquo;re comparing a text with itself — choose a different text for one
          of the panes.
        </p>
      )}

      {/* Wide: two columns */}
      <div className="mt-4 hidden gap-6 lg:grid lg:grid-cols-2">
        <Pane
          text={leftText}
          texts={texts}
          onPick={(k) => pick("left", k)}
          side="Left"
        />
        <Pane
          text={rightText}
          texts={texts}
          onPick={(k) => pick("right", k)}
          side="Right"
        />
      </div>

      {/* Narrow: A | B switch, one pane at a time */}
      <div className="mt-4 lg:hidden">
        <div
          role="group"
          aria-label="Choose which text to view"
          className="ui mb-3 grid grid-cols-2 overflow-hidden rounded-full border border-line"
        >
          {(["left", "right"] as const).map((s) => {
            const active = mobileSide === s;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setMobileSide(s);
                  setMessage(
                    `Showing ${(s === "left" ? leftText : rightText).label}`,
                  );
                }}
                className={`px-3 py-2 text-sm transition-colors ${
                  active ? "bg-glow text-gold" : "text-ink-soft hover:text-ink"
                }`}
              >
                {s === "left" ? "A" : "B"} ·{" "}
                {(s === "left" ? leftText : rightText).label}
              </button>
            );
          })}
        </div>
        <Pane
          text={mobileSide === "left" ? leftText : rightText}
          texts={texts}
          onPick={(k) => pick(mobileSide, k)}
          side={mobileSide === "left" ? "Left" : "Right"}
          narrow
        />
      </div>
    </section>
  );
}

function Pane({
  text,
  texts,
  onPick,
  side,
  narrow = false,
}: {
  text: CompareText;
  texts: CompareText[];
  onPick: (key: string) => void;
  side: string;
  narrow?: boolean;
}) {
  return (
    <div
      aria-label={`Comparison pane: ${text.label}`}
      className="flex flex-col rounded-2xl border border-line bg-card/50 p-5"
    >
      <div className="ui mb-3 border-b border-line/70 pb-3">
        <label className="block text-xs uppercase tracking-wider text-ink-faint">
          {side} pane
        </label>
        <select
          value={text.key}
          onChange={(e) => onPick(e.target.value)}
          aria-label={`${side} pane text`}
          className="mt-1 w-full rounded-lg border border-line bg-card px-3 py-1.5 text-sm text-ink outline-none focus:border-gold-soft"
        >
          {texts.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-ink-faint">
          {text.kind === "traditional"
            ? `${text.canonicalRef ?? ""} · KJV`
            : [text.language, text.tradition].filter(Boolean).join(" · ")}
        </p>
      </div>

      <div className={narrow ? "" : "max-h-[70vh] overflow-y-auto pr-1"}>
        {text.kind === "traditional" ? (
          <p className="prose-traditional">{text.body}</p>
        ) : (
          <div className="prose-reverent">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
            >
              {text.body}
            </ReactMarkdown>
          </div>
        )}
        {text.kind === "rendering" && text.tenets && text.tenets.length > 0 && (
          <p className="ui mt-4 border-t border-line/70 pt-3 text-xs text-ink-faint">
            Read through: {text.tenets.map((t) => t.title).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}
