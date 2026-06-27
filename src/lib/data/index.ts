import type { Movement, Passage, Tenet } from "@/lib/types";
import { buildBook, buildTenets } from "@/lib/content/seed";
import { loadContent } from "@/lib/content/parse";

// ---------------------------------------------------------------------------
// Data access layer
//
// The reader talks only to these functions, never to a content file or a
// database directly. Today they are backed by the in-repo seed content, so the
// gathered book renders beautifully with `npm run dev` and no credentials.
// When Supabase is provisioned and seeded (npm run seed), reads move here —
// the function signatures stay the same, so pages don't change.
// ---------------------------------------------------------------------------

let bookMemo: Promise<Movement[]> | null = null;
let tenetsMemo: Promise<Tenet[]> | null = null;

export function getBook(): Promise<Movement[]> {
  if (!bookMemo) bookMemo = buildBook();
  return bookMemo;
}

export function getTenets(): Promise<Tenet[]> {
  if (!tenetsMemo) tenetsMemo = buildTenets();
  return tenetsMemo;
}

export async function getMovement(slug: string): Promise<Movement | null> {
  const book = await getBook();
  return book.find((m) => m.slug === slug) ?? null;
}

export interface PassageLocation {
  movement: Movement;
  passage: Passage;
  /** Adjacent passages in reading order, for gentle next/previous links. */
  previous: { movementSlug: string; passageSlug: string; title: string } | null;
  next: { movementSlug: string; passageSlug: string; title: string } | null;
}

export async function getPassage(
  movementSlug: string,
  passageSlug: string,
): Promise<PassageLocation | null> {
  const book = await getBook();

  // Flatten to reading order so we can find neighbours across movements.
  const flat: { movement: Movement; passage: Passage }[] = [];
  for (const movement of book) {
    for (const passage of movement.passages) flat.push({ movement, passage });
  }

  const i = flat.findIndex(
    (e) => e.movement.slug === movementSlug && e.passage.slug === passageSlug,
  );
  if (i === -1) return null;

  const toRef = (e: { movement: Movement; passage: Passage }) => ({
    movementSlug: e.movement.slug,
    passageSlug: e.passage.slug,
    title: e.passage.title,
  });

  return {
    movement: flat[i].movement,
    passage: flat[i].passage,
    previous: i > 0 ? toRef(flat[i - 1]) : null,
    next: i < flat.length - 1 ? toRef(flat[i + 1]) : null,
  };
}

export async function getMission(): Promise<string> {
  // The mission file keeps each paragraph on its own line; turn single line
  // breaks into Markdown paragraph breaks so they render with breathing room.
  const { mission } = await loadContent();
  return mission
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n\n");
}

export interface BookStats {
  movements: number;
  passages: number;
  renderings: number;
  tenets: number;
}

export async function getStats(): Promise<BookStats> {
  const [book, tenets] = await Promise.all([getBook(), getTenets()]);
  let passages = 0;
  let renderings = 0;
  for (const m of book) {
    passages += m.passages.length;
    for (const p of m.passages) renderings += p.renderings.length;
  }
  return { movements: book.length, passages, renderings, tenets: tenets.length };
}
