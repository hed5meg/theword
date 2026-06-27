"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { saveArrangement } from "@/app/arrangements/actions";
import type { BuilderState } from "@/lib/data/arrangements";

interface Item {
  _id: string;
  kind: "movement" | "passage";
  title?: string;
  subtitle?: string;
  passageId?: string;
  canonicalRef?: string;
}

let counter = 0;
const nextId = () => `it-${counter++}`;

export function ArrangementBuilder({
  initial,
  allTenets,
  error,
}: {
  initial: BuilderState;
  allTenets: { slug: string; title: string }[];
  error?: string;
}) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [tenetSlugs, setTenetSlugs] = useState<Set<string>>(
    new Set(initial.tenetSlugs),
  );
  const [items, setItems] = useState<Item[]>(
    initial.items.map((i) => ({ ...i, _id: nextId() })),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i._id === active.id);
      const newIndex = prev.findIndex((i) => i._id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function move(id: string, dir: -1 | 1) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x._id === id);
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      return arrayMove(prev, i, j);
    });
  }

  function addMovement() {
    setItems((prev) => [
      ...prev,
      { _id: nextId(), kind: "movement", title: "New movement", subtitle: "" },
    ]);
  }
  function removeMovement(id: string) {
    setItems((prev) => prev.filter((i) => i._id !== id));
  }
  function editMovement(id: string, field: "title" | "subtitle", value: string) {
    setItems((prev) =>
      prev.map((i) => (i._id === id ? { ...i, [field]: value } : i)),
    );
  }

  const stateJson = JSON.stringify({
    slug: initial.slug,
    title,
    description,
    tenetSlugs: [...tenetSlugs],
    items: items.map(({ kind, title, subtitle, passageId, canonicalRef }) => ({
      kind,
      title,
      subtitle,
      passageId,
      canonicalRef,
    })),
  } satisfies BuilderState);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      <header>
        <p className="eyebrow">Your way through the book</p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight text-ink">
          {initial.slug ? "Edit arrangement" : "Begin an arrangement"}
        </h1>
        <p className="mt-2 text-ink-soft">
          Sequence the passages and gather them into your own movements. Every
          passage stays in — you&rsquo;re choosing the order and the groupings.
        </p>
      </header>

      {error && (
        <p className="ui mt-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error === "incomplete"
            ? "Every passage must appear exactly once."
            : error === "title"
              ? "Please give your arrangement a title."
              : "Something went wrong — please try again."}
        </p>
      )}

      <form action={saveArrangement} className="ui mt-8 space-y-6">
        <input type="hidden" name="state" value={stateJson} />

        <div>
          <label htmlFor="title" className="block text-sm text-ink-soft">
            Title
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="A name for this way through the book"
            className="mt-1.5 w-full rounded-xl border border-line bg-card px-4 py-3 text-ink outline-none focus:border-gold-soft"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm text-ink-soft">
            The reasoning <span className="text-ink-faint">(the arc you see)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1.5 w-full rounded-xl border border-line bg-card px-4 py-3 text-ink outline-none focus:border-gold-soft"
          />
        </div>

        {/* Sequence + grouping */}
        <div>
          <div className="flex items-center justify-between">
            <span className="block text-sm text-ink-soft">Sequence & movements</span>
            <button
              type="button"
              onClick={addMovement}
              className="rounded-full border border-gold-soft/60 px-3 py-1 text-xs text-gold transition-colors hover:bg-glow"
            >
              + Add a movement
            </button>
          </div>
          <p className="mt-1 text-xs text-ink-faint">
            Drag to reorder, or use the ↑ ↓ buttons. A passage belongs to the
            movement above it.
          </p>

          <div className="mt-3 space-y-1.5">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={items.map((i) => i._id)}
                strategy={verticalListSortingStrategy}
              >
                {items.map((item) => (
                  <SortableRow
                    key={item._id}
                    item={item}
                    onUp={() => move(item._id, -1)}
                    onDown={() => move(item._id, 1)}
                    onRemove={() => removeMovement(item._id)}
                    onEdit={(f, v) => editMovement(item._id, f, v)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Principles */}
        <fieldset>
          <legend className="block text-sm text-ink-soft">
            Principles this ordering expresses{" "}
            <span className="text-ink-faint">(optional)</span>
          </legend>
          <div className="mt-3 grid max-h-60 grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-line bg-card/50 p-4 sm:grid-cols-2">
            {allTenets.map((t) => (
              <label key={t.slug} className="flex items-start gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={tenetSlugs.has(t.slug)}
                  onChange={(e) =>
                    setTenetSlugs((prev) => {
                      const n = new Set(prev);
                      if (e.target.checked) n.add(t.slug);
                      else n.delete(t.slug);
                      return n;
                    })
                  }
                  className="mt-1 accent-[var(--color-gold)]"
                />
                <span>{t.title}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            name="status"
            value="published"
            className="rounded-full bg-ink px-7 py-3 text-sm font-medium text-parchment transition-opacity hover:opacity-90"
          >
            Publish
          </button>
          <button
            type="submit"
            name="status"
            value="draft"
            className="rounded-full border border-line px-6 py-3 text-sm font-medium text-ink-soft transition-colors hover:border-gold-soft/50 hover:text-ink"
          >
            Save draft
          </button>
        </div>
      </form>
    </div>
  );
}

function SortableRow({
  item,
  onUp,
  onDown,
  onRemove,
  onEdit,
}: {
  item: Item;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
  onEdit: (field: "title" | "subtitle", value: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const isMovement = item.kind === "movement";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 rounded-xl border p-2.5 ${
        isMovement
          ? "border-gold-soft/50 bg-glow/30"
          : "border-line bg-card"
      }`}
    >
      <button
        type="button"
        className="mt-1 cursor-grab touch-none px-1 text-ink-faint"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>

      <div className="min-w-0 flex-1">
        {isMovement ? (
          <div className="space-y-1.5">
            <input
              value={item.title ?? ""}
              onChange={(e) => onEdit("title", e.target.value)}
              placeholder="Movement title"
              aria-label="Movement title"
              className="w-full rounded-lg border border-line bg-card px-3 py-1.5 font-serif text-base text-ink outline-none focus:border-gold-soft"
            />
            <input
              value={item.subtitle ?? ""}
              onChange={(e) => onEdit("subtitle", e.target.value)}
              placeholder="A one-line description (optional)"
              aria-label="Movement subtitle"
              className="w-full rounded-lg border border-line bg-card px-3 py-1 text-sm text-ink-soft outline-none focus:border-gold-soft"
            />
          </div>
        ) : (
          <div className="flex items-baseline justify-between gap-3 py-1">
            <span className="font-serif text-base text-ink">{item.title}</span>
            <span className="shrink-0 text-xs text-ink-faint">{item.canonicalRef}</span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-center gap-1">
        <div className="flex gap-0.5">
          <button
            type="button"
            onClick={onUp}
            aria-label="Move up"
            className="rounded px-1.5 text-ink-faint hover:text-ink"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onDown}
            aria-label="Move down"
            className="rounded px-1.5 text-ink-faint hover:text-ink"
          >
            ↓
          </button>
        </div>
        {isMovement && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove movement"
            className="text-xs text-ink-faint hover:text-red-700"
          >
            remove
          </button>
        )}
      </div>
    </div>
  );
}
