import type {
  BookStats,
  MovementOutline,
  PassageLocation,
  Tenet,
  TenetDetail,
  TenetUsage,
} from "@/lib/types";
import { buildBook, buildTenets } from "@/lib/content/seed";

// Read API backed by the in-repo seed content. Used for local development
// without Supabase configured, and as a resilient fallback.

export async function getOutline(): Promise<MovementOutline[]> {
  const book = await buildBook();
  return book.map((m) => ({
    slug: m.slug,
    title: m.title,
    summary: m.summary,
    passages: m.passages.map((p) => ({
      slug: p.slug,
      movementSlug: m.slug,
      canonicalRef: p.canonicalRef,
      title: p.title,
      renderingCount: p.renderings.length,
    })),
  }));
}

export async function getPassage(
  movementSlug: string,
  passageSlug: string,
): Promise<PassageLocation | null> {
  const book = await buildBook();
  const flat = book.flatMap((m) => m.passages.map((p) => ({ m, p })));
  const i = flat.findIndex(
    (e) => e.m.slug === movementSlug && e.p.slug === passageSlug,
  );
  if (i === -1) return null;

  const ref = (e: { m: { slug: string }; p: { slug: string; title: string } }) => ({
    movementSlug: e.m.slug,
    passageSlug: e.p.slug,
    title: e.p.title,
  });

  return {
    movementSlug: flat[i].m.slug,
    movementTitle: flat[i].m.title,
    passage: flat[i].p,
    previous: i > 0 ? ref(flat[i - 1]) : null,
    next: i < flat.length - 1 ? ref(flat[i + 1]) : null,
  };
}

export async function getTenets(): Promise<Tenet[]> {
  return buildTenets();
}

export async function getTenet(slug: string): Promise<TenetDetail | null> {
  const [tenets, book] = await Promise.all([buildTenets(), buildBook()]);
  const tenet = tenets.find((t) => t.slug === slug);
  if (!tenet) return null;

  const usages: TenetUsage[] = [];
  for (const m of book) {
    for (const p of m.passages) {
      for (const r of p.renderings) {
        if (r.tenets.some((t) => t.slug === slug)) {
          usages.push({
            passageSlug: p.slug,
            movementSlug: m.slug,
            passageTitle: p.title,
            canonicalRef: p.canonicalRef,
            author: r.author,
            isGathered: r.isGathered,
          });
        }
      }
    }
  }
  return { tenet, usages };
}

export async function getStats(): Promise<BookStats> {
  const [book, tenets] = await Promise.all([buildBook(), buildTenets()]);
  let passages = 0;
  let renderings = 0;
  for (const m of book) {
    passages += m.passages.length;
    for (const p of m.passages) renderings += p.renderings.length;
  }
  return { movements: book.length, passages, renderings, tenets: tenets.length };
}
