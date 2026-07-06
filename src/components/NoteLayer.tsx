"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import type { Annotation, Note } from "@/lib/types";
import { computeAnchor, offsetsToRange, reAnchor, type TextAnchor } from "@/lib/anchor";
import { createNote, addNoteReply, setNoteStatus } from "@/lib/actions/notes";
import {
  createRefinement,
  promoteNoteToRefinement,
} from "@/lib/actions/refinements";
import {
  createAnnotation,
  updateAnnotation,
  deleteAnnotation,
} from "@/lib/actions/annotations";

// CSS Custom Highlight API (progressive enhancement; typed loosely as it's new).
type HighlightCtor = new (...ranges: Range[]) => unknown;
interface HighlightRegistry {
  set(name: string, h: unknown): void;
  delete(name: string): void;
}

export function NoteLayer({
  renderingId,
  body,
  notes,
  annotations = [],
  path,
  canCreate,
  canManage,
  canAnnotate = false,
  proseClass = "",
  allTenets = [],
}: {
  renderingId: string;
  body: string;
  notes: Note[];
  /** Author glosses on words/phrases — public, coloured, hoverable. */
  annotations?: Annotation[];
  path: string;
  canCreate: boolean;
  canManage: boolean;
  /** The viewer authored this rendering (or is a steward): may add glosses. */
  canAnnotate?: boolean;
  proseClass?: string;
  allTenets?: { slug: string; title: string }[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<TextAnchor | null>(null);
  const [btn, setBtn] = useState<{ top: number; left: number } | null>(null);
  const [composing, setComposing] = useState<
    "note" | "refinement" | "annotation" | null
  >(null);
  const [openNote, setOpenNote] = useState<Note | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [glossDrawer, setGlossDrawer] = useState(false);
  const [editingGloss, setEditingGloss] = useState<Annotation | null>(null);
  const [tip, setTip] = useState<
    { note: string; top: number; left: number; pinned: boolean } | null
  >(null);

  // Keep the rendered Markdown element stable so state changes (tooltips,
  // sheets) don't re-render — and clobber — the annotation spans we inject.
  const rendered = useMemo(
    () => (
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {body}
      </ReactMarkdown>
    ),
    [body],
  );

  // Wrap each anchored annotation in a coloured, hoverable span. Runs BEFORE the
  // note-highlight effect (so that reads the final DOM). Processes back-to-front
  // so earlier offsets stay valid as we mutate later ones.
  useEffect(() => {
    const el = ref.current;
    if (!el || annotations.length === 0) return;
    const text = el.textContent ?? "";
    const placements: { start: number; end: number; a: Annotation }[] = [];
    for (const a of annotations) {
      const at = reAnchor(text, {
        anchorStart: a.anchorStart,
        anchorEnd: a.anchorEnd,
        quotedText: a.quotedText,
        contextPrefix: a.contextPrefix,
        contextSuffix: a.contextSuffix,
      });
      if (at) placements.push({ start: at.start, end: at.end, a });
    }
    // Drop overlaps (keep the earlier-starting one); wrap last-first.
    placements.sort((x, y) => x.start - y.start);
    const clean: typeof placements = [];
    let lastEnd = -1;
    for (const p of placements) {
      if (p.start >= lastEnd) {
        clean.push(p);
        lastEnd = p.end;
      }
    }
    const spans: HTMLSpanElement[] = [];
    for (const p of clean.slice().reverse()) {
      const range = offsetsToRange(el, p.start, p.end);
      if (!range) continue;
      try {
        const span = document.createElement("span");
        span.className = "annotation";
        span.dataset.annotationId = p.a.id;
        span.tabIndex = 0;
        span.setAttribute("role", "note");
        span.setAttribute("aria-label", `${p.a.quotedText}: ${p.a.note}`);
        span.appendChild(range.extractContents());
        range.insertNode(span);
        spans.push(span);
      } catch {
        /* skip a span that can't be cleanly wrapped */
      }
    }
    return () => {
      for (const span of spans) {
        const parent = span.parentNode;
        if (!parent) continue;
        while (span.firstChild) parent.insertBefore(span.firstChild, span);
        parent.removeChild(span);
        parent.normalize();
      }
    };
  }, [annotations, body]);

  // Highlight anchored, non-orphaned notes (CSS Custom Highlight API; optional).
  // Depends on annotations too, so it recomputes after any re-wrap above.
  useEffect(() => {
    const el = ref.current;
    const w = window as unknown as { Highlight?: HighlightCtor };
    const registry = (CSS as unknown as { highlights?: HighlightRegistry }).highlights;
    if (!el || !w.Highlight || !registry) return;
    const text = el.textContent ?? "";
    const ranges: Range[] = [];
    for (const n of notes) {
      const at = reAnchor(text, {
        anchorStart: n.anchorStart,
        anchorEnd: n.anchorEnd,
        quotedText: n.quotedText,
        contextPrefix: n.contextPrefix,
        contextSuffix: n.contextSuffix,
      });
      if (!at) continue;
      const r = offsetsToRange(el, at.start, at.end);
      if (r) ranges.push(r);
    }
    try {
      if (ranges.length) registry.set("note", new w.Highlight(...ranges));
      else registry.delete("note");
    } catch {
      /* ignore */
    }
    return () => registry.delete("note");
  }, [notes, annotations]);

  function onSelect() {
    if (!canCreate) return;
    const el = ref.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.isCollapsed || sel.rangeCount === 0) {
      setBtn(null);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) {
      setBtn(null);
      return;
    }
    const a = computeAnchor(el, range);
    if (!a) {
      setBtn(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    setAnchor(a);
    setBtn({ top: rect.top - 8, left: rect.left + rect.width / 2 });
  }

  // --- Annotation tooltip (event-delegated on the prose container) ----------
  const annById = useMemo(() => {
    const m = new Map<string, Annotation>();
    for (const a of annotations) m.set(a.id, a);
    return m;
  }, [annotations]);

  const showTip = useCallback(
    (span: HTMLElement, pinned: boolean) => {
      const id = span.dataset.annotationId;
      const a = id ? annById.get(id) : undefined;
      if (!a) return;
      span.setAttribute("data-active", "true");
      const rect = span.getBoundingClientRect();
      setTip({
        note: a.note,
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
        pinned,
      });
    },
    [annById],
  );

  const clearActive = useCallback(() => {
    ref.current
      ?.querySelectorAll<HTMLElement>(".annotation[data-active]")
      .forEach((s) => s.removeAttribute("data-active"));
  }, []);

  const onProsePointerOver = useCallback(
    (e: React.MouseEvent) => {
      if (tip?.pinned) return;
      const span = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-annotation-id]",
      );
      if (span) showTip(span, false);
      else if (tip) {
        clearActive();
        setTip(null);
      }
    },
    [tip, showTip, clearActive],
  );

  const onProseClick = useCallback(
    (e: React.MouseEvent) => {
      const span = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-annotation-id]",
      );
      if (!span) {
        if (tip?.pinned) {
          clearActive();
          setTip(null);
        }
        return;
      }
      // The author manages a gloss by clicking it; a reader pins the tooltip.
      if (canAnnotate) {
        const id = span.dataset.annotationId;
        const a = id ? annById.get(id) : undefined;
        if (a) {
          clearActive();
          setTip(null);
          setEditingGloss(a);
        }
        return;
      }
      clearActive();
      showTip(span, true);
    },
    [canAnnotate, annById, tip, showTip, clearActive],
  );

  const noteCount = notes.length;
  const glossCount = annotations.length;

  return (
    <div className="relative">
      {/* Injected at runtime: Lightning CSS (build) doesn't parse ::highlight(). */}
      <style>{`::highlight(note){background-color:var(--color-glow);text-decoration:underline dotted var(--color-gold-soft);text-underline-offset:3px}`}</style>
      <div
        ref={ref}
        onMouseUp={onSelect}
        onKeyUp={onSelect}
        onMouseOver={onProsePointerOver}
        onMouseLeave={() => {
          if (!tip?.pinned) {
            clearActive();
            setTip(null);
          }
        }}
        onFocus={(e) => {
          const span = (e.target as HTMLElement).closest?.<HTMLElement>(
            "[data-annotation-id]",
          );
          if (span && !tip?.pinned) showTip(span, false);
        }}
        onBlur={() => {
          if (!tip?.pinned) {
            clearActive();
            setTip(null);
          }
        }}
        onClick={onProseClick}
        className={`prose-reverent ${proseClass}`}
      >
        {rendered}
      </div>

      {/* Annotation tooltip */}
      {tip && (
        <div
          role="tooltip"
          style={{
            position: "fixed",
            top: tip.top,
            left: tip.left,
            transform: "translate(-50%, -100%)",
          }}
          className="ui pointer-events-none z-40 max-w-xs rounded-xl border border-gold-soft/50 bg-card px-3.5 py-2.5 text-sm leading-relaxed text-ink shadow-xl"
        >
          <span className="mb-1 block text-[0.65rem] uppercase tracking-wider text-gold">
            Why this word
          </span>
          {tip.note}
        </div>
      )}

      {/* Affordances: reader notes + author glosses */}
      {(noteCount > 0 || glossCount > 0 || canCreate) && (
        <div className="ui mt-3 flex flex-wrap items-center gap-4">
          {(noteCount > 0 || canCreate) && (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs text-ink-faint transition-colors hover:text-ink-soft"
            >
              ✎ {noteCount > 0 ? `${noteCount} ${noteCount === 1 ? "note" : "notes"}` : "Notes"}
            </button>
          )}
          {(glossCount > 0 || canAnnotate) && (
            <button
              type="button"
              onClick={() => setGlossDrawer(true)}
              className="inline-flex items-center gap-1.5 text-xs text-gold/80 transition-colors hover:text-gold"
            >
              ◆ {glossCount > 0 ? `${glossCount} ${glossCount === 1 ? "gloss" : "glosses"}` : "Glosses"}
            </button>
          )}
        </div>
      )}

      {/* Floating selection menu */}
      {btn && anchor && !composing && (
        <div
          style={{ position: "fixed", top: btn.top, left: btn.left, transform: "translate(-50%, -100%)" }}
          className="ui z-40 flex overflow-hidden rounded-full bg-ink text-xs font-medium text-parchment shadow-lg"
        >
          {canAnnotate && (
            <>
              <button
                type="button"
                onClick={() => { setComposing("annotation"); setBtn(null); }}
                className="px-3 py-1.5 text-gold-soft hover:bg-ink-soft"
              >
                Explain this
              </button>
              <span aria-hidden className="my-1 w-px bg-parchment/30" />
            </>
          )}
          <button
            type="button"
            onClick={() => { setComposing("note"); setBtn(null); }}
            className="px-3 py-1.5 hover:bg-ink-soft"
          >
            Leave a note
          </button>
          <span aria-hidden className="my-1 w-px bg-parchment/30" />
          <button
            type="button"
            onClick={() => { setComposing("refinement"); setBtn(null); }}
            className="px-3 py-1.5 hover:bg-ink-soft"
          >
            Suggest a refinement
          </button>
        </div>
      )}

      {/* Compose an annotation (author only) */}
      {composing === "annotation" && anchor && (
        <Sheet onClose={() => setComposing(null)} title="Explain your word">
          <p className="ui mb-3 rounded-lg border border-gold-soft/40 bg-glow/50 p-3 text-sm italic text-ink">
            “{anchor.quotedText}”
          </p>
          <form action={createAnnotation} className="ui space-y-3" onSubmit={() => setComposing(null)}>
            <input type="hidden" name="path" value={path} />
            <input type="hidden" name="rendering_id" value={renderingId} />
            <input type="hidden" name="quoted_text" value={anchor.quotedText} />
            <input type="hidden" name="anchor_start" value={anchor.anchorStart} />
            <input type="hidden" name="anchor_end" value={anchor.anchorEnd} />
            <input type="hidden" name="context_prefix" value={anchor.contextPrefix} />
            <input type="hidden" name="context_suffix" value={anchor.contextSuffix} />
            <textarea
              name="note"
              required
              rows={3}
              placeholder="Why you chose this word or phrase…"
              className="w-full rounded-xl border border-line bg-card px-3 py-2 text-ink outline-none focus:border-gold-soft"
            />
            <p className="text-xs text-ink-faint">
              This shows to every reader — a gentle gloss in your own hand.
            </p>
            <button type="submit" className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-parchment hover:opacity-90">
              Add the gloss
            </button>
          </form>
        </Sheet>
      )}

      {/* Compose a note */}
      {composing === "note" && anchor && (
        <Sheet onClose={() => setComposing(null)} title="Leave a note">
          <p className="ui mb-3 rounded-lg border border-line bg-parchment-deep/40 p-3 text-sm italic text-ink-soft">
            “{anchor.quotedText}”
          </p>
          <form action={createNote} className="ui space-y-3" onSubmit={() => setComposing(null)}>
            <input type="hidden" name="path" value={path} />
            <input type="hidden" name="rendering_id" value={renderingId} />
            <input type="hidden" name="quoted_text" value={anchor.quotedText} />
            <input type="hidden" name="anchor_start" value={anchor.anchorStart} />
            <input type="hidden" name="anchor_end" value={anchor.anchorEnd} />
            <input type="hidden" name="context_prefix" value={anchor.contextPrefix} />
            <input type="hidden" name="context_suffix" value={anchor.contextSuffix} />
            <textarea
              name="body"
              required
              rows={3}
              placeholder="What did you notice here?"
              className="w-full rounded-xl border border-line bg-card px-3 py-2 text-ink outline-none focus:border-gold-soft"
            />
            <textarea
              name="suggested_wording"
              rows={2}
              placeholder="Suggest a wording (optional)"
              className="w-full rounded-xl border border-line bg-card px-3 py-2 text-ink outline-none focus:border-gold-soft"
            />
            <p className="text-xs text-ink-faint">
              Goes only to the one who offered this rendering and the stewards. Held in love.
            </p>
            <button type="submit" className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-parchment hover:opacity-90">
              Offer the note
            </button>
          </form>
        </Sheet>
      )}

      {/* Compose a refinement */}
      {composing === "refinement" && anchor && (
        <Sheet onClose={() => setComposing(null)} title="Suggest a refinement">
          <p className="ui mb-1 text-xs uppercase tracking-wider text-ink-faint">Currently</p>
          <p className="ui mb-3 rounded-lg border border-line bg-parchment-deep/40 p-3 text-sm italic text-ink-soft">
            “{anchor.quotedText}”
          </p>
          <form action={createRefinement} className="ui space-y-3" onSubmit={() => setComposing(null)}>
            <input type="hidden" name="path" value={path} />
            <input type="hidden" name="rendering_id" value={renderingId} />
            <input type="hidden" name="quoted_text" value={anchor.quotedText} />
            <input type="hidden" name="anchor_start" value={anchor.anchorStart} />
            <input type="hidden" name="anchor_end" value={anchor.anchorEnd} />
            <input type="hidden" name="context_prefix" value={anchor.contextPrefix} />
            <input type="hidden" name="context_suffix" value={anchor.contextSuffix} />
            <div>
              <label className="block text-xs uppercase tracking-wider text-gold">
                Your proposed wording
              </label>
              <textarea
                name="replacement_text"
                required
                rows={3}
                defaultValue={anchor.quotedText}
                className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-2 text-ink outline-none focus:border-gold-soft"
              />
            </div>
            <textarea
              name="reason"
              rows={2}
              placeholder="Why this refines it"
              className="w-full rounded-xl border border-line bg-card px-3 py-2 text-ink outline-none focus:border-gold-soft"
            />
            {allTenets.length > 0 && (
              <details>
                <summary className="cursor-pointer text-xs text-ink-faint">
                  Principles it serves (optional)
                </summary>
                <div className="mt-2 grid max-h-40 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
                  {allTenets.map((t) => (
                    <label key={t.slug} className="flex items-start gap-2 text-sm text-ink-soft">
                      <input type="checkbox" name="tenets" value={t.slug} className="mt-1 accent-[var(--color-gold)]" />
                      <span>{t.title}</span>
                    </label>
                  ))}
                </div>
              </details>
            )}
            <p className="text-xs text-ink-faint">
              Held gently, and weighed in love by the one who offered this rendering.
            </p>
            <button type="submit" className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-parchment hover:opacity-90">
              Offer the refinement
            </button>
          </form>
        </Sheet>
      )}

      {/* Glosses drawer (author manages, or anyone browses) */}
      {glossDrawer && (
        <Sheet onClose={() => setGlossDrawer(false)} title="Glosses in this branch">
          {glossCount === 0 ? (
            <p className="text-sm text-ink-soft">
              {canAnnotate
                ? "No glosses yet. Select any words above and choose “Explain this” to add one."
                : "No glosses here yet."}
            </p>
          ) : (
            <ul className="space-y-3">
              {annotations.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setGlossDrawer(false);
                      if (canAnnotate) setEditingGloss(a);
                    }}
                    className="ui w-full rounded-xl border border-line bg-card/60 p-3 text-left transition-colors hover:bg-glow/40"
                  >
                    <span className="block text-sm italic text-gold">
                      “{a.quotedText.slice(0, 80)}{a.quotedText.length > 80 ? "…" : ""}”
                    </span>
                    <span className="mt-1 block text-sm text-ink">{a.note}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      )}

      {/* Edit / remove a gloss (author only) */}
      {editingGloss && (
        <Sheet onClose={() => setEditingGloss(null)} title="Your gloss">
          <p className="ui mb-3 rounded-lg border border-gold-soft/40 bg-glow/50 p-3 text-sm italic text-ink">
            “{editingGloss.quotedText}”
          </p>
          <form action={updateAnnotation} className="ui space-y-3" onSubmit={() => setEditingGloss(null)}>
            <input type="hidden" name="path" value={path} />
            <input type="hidden" name="annotation_id" value={editingGloss.id} />
            <textarea
              name="note"
              required
              rows={3}
              defaultValue={editingGloss.note}
              className="w-full rounded-xl border border-line bg-card px-3 py-2 text-ink outline-none focus:border-gold-soft"
            />
            <div className="flex items-center gap-3">
              <button type="submit" className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-parchment hover:opacity-90">
                Save
              </button>
              <span className="text-ink-faint">·</span>
              <button
                type="submit"
                formAction={deleteAnnotation}
                className="text-sm text-ink-faint transition-colors hover:text-red-700"
              >
                Remove gloss
              </button>
            </div>
          </form>
        </Sheet>
      )}

      {/* Reading drawer (list) */}
      {drawerOpen && (
        <Sheet onClose={() => setDrawerOpen(false)} title="Notes in the margin">
          {notes.length === 0 ? (
            <p className="text-sm text-ink-soft">
              {canCreate
                ? "No notes yet. Select any words above to leave one."
                : "No notes here yet."}
            </p>
          ) : (
            <ul className="space-y-3">
              {notes.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => setOpenNote(n)}
                    className="ui w-full rounded-xl border border-line bg-card/60 p-3 text-left transition-colors hover:bg-glow/40"
                  >
                    <span className="block text-sm italic text-ink-soft">
                      “{n.quotedText.slice(0, 80)}{n.quotedText.length > 80 ? "…" : ""}”
                      {n.orphaned && " · (text moved)"}
                    </span>
                    <span className="mt-1 block text-sm text-ink">{n.body}</span>
                    <span className="mt-1 block text-xs text-ink-faint">
                      {n.authorName} · {n.status}
                      {n.replies.length > 0 ? ` · ${n.replies.length} replies` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      )}

      {/* Single note thread */}
      {openNote && (
        <Sheet onClose={() => setOpenNote(null)} title="A note">
          <p className="ui mb-2 rounded-lg border border-line bg-parchment-deep/40 p-3 text-sm italic text-ink-soft">
            “{openNote.quotedText}”{openNote.orphaned && " · the text this pointed to has changed"}
          </p>
          <p className="text-ink">{openNote.body}</p>
          {openNote.suggestedWording && (
            <div className="ui mt-2">
              <p className="text-sm text-ink-soft">
                <span className="text-ink-faint">Suggested wording:</span>{" "}
                {openNote.suggestedWording}
              </p>
              <form action={promoteNoteToRefinement} className="mt-2">
                <input type="hidden" name="path" value={path} />
                <input type="hidden" name="note_id" value={openNote.id} />
                <button
                  type="submit"
                  className="rounded-full border border-gold-soft/60 px-3 py-1 text-xs text-gold transition-colors hover:bg-glow"
                >
                  Make this a refinement
                </button>
              </form>
            </div>
          )}
          <p className="ui mt-1 text-xs text-ink-faint">
            {openNote.authorName} · {openNote.status}
          </p>

          {openNote.replies.length > 0 && (
            <ul className="mt-4 space-y-2 border-t border-line/70 pt-3">
              {openNote.replies.map((r) => (
                <li key={r.id} className="text-sm">
                  <span className="text-ink">{r.body}</span>
                  <span className="ui block text-xs text-ink-faint">{r.authorName}</span>
                </li>
              ))}
            </ul>
          )}

          <form action={addNoteReply} className="ui mt-4 space-y-2">
            <input type="hidden" name="path" value={path} />
            <input type="hidden" name="note_id" value={openNote.id} />
            <textarea
              name="body"
              required
              rows={2}
              placeholder="A gentle reply…"
              className="w-full rounded-xl border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:border-gold-soft"
            />
            <button
              type="submit"
              className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-parchment"
            >
              Reply
            </button>
          </form>

          {canManage && (
            <div className="ui mt-4 flex flex-wrap gap-2 border-t border-line/70 pt-3">
              {(["acknowledged", "addressed", "archived"] as const).map((s) => (
                <form key={s} action={setNoteStatus}>
                  <input type="hidden" name="path" value={path} />
                  <input type="hidden" name="note_id" value={openNote.id} />
                  <input type="hidden" name="status" value={s} />
                  <button
                    type="submit"
                    className="rounded-full border border-line px-3 py-1 text-xs text-ink-soft transition-colors hover:border-gold-soft/50 hover:text-ink"
                  >
                    {s === "addressed" ? "Addressed" : s === "archived" ? "Set aside" : "Acknowledge"}
                  </button>
                </form>
              ))}
            </div>
          )}
        </Sheet>
      )}
    </div>
  );
}

function Sheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/30"
      />
      <div
        role="dialog"
        aria-label={title}
        className="relative z-10 max-h-[80vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-card p-5 shadow-xl sm:max-w-md sm:rounded-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ui text-ink-faint hover:text-ink"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
