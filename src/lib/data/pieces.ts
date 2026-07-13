import type { PieceRef } from "@/lib/types";
import { createAnonClient } from "@/lib/supabase/admin";
import { getAllPassages, listArrangements } from "@/lib/data/arrangements";
import { getTenets } from "@/lib/data";
import type { AnchorOption } from "@/components/AnchorFields";

// Published essays and episodes anchored to a given passage / arrangement /
// principle, for surfacing on those reader pages. Public (anon client);
// graceful when the tables aren't there yet.

type RefRow = {
  title: string;
  slug: string;
  byline: string | null;
  author: { display_name: string } | null;
};

async function refs(
  table: "essays" | "podcast_episodes",
  column: "passage_id" | "arrangement_id" | "tenet_id",
  id: string,
  kind: "essay" | "episode",
): Promise<PieceRef[]> {
  const sb = createAnonClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from(table)
    .select("title,slug,byline,author:profiles(display_name)")
    .eq(column, id)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error || !data) return [];
  return (data as unknown as RefRow[]).map((r) => ({
    kind,
    title: r.title,
    slug: r.slug,
    byline: r.byline ?? undefined,
    authorName: r.author?.display_name,
  }));
}

export interface AnchoredPieces {
  essays: PieceRef[];
  episodes: PieceRef[];
}

async function forColumn(
  column: "passage_id" | "arrangement_id" | "tenet_id",
  id: string | undefined,
): Promise<AnchoredPieces> {
  if (!id) return { essays: [], episodes: [] };
  const [essays, episodes] = await Promise.all([
    refs("essays", column, id, "essay"),
    refs("podcast_episodes", column, id, "episode"),
  ]);
  return { essays, episodes };
}

export const getPiecesForPassage = (id?: string) => forColumn("passage_id", id);
export const getPiecesForArrangement = (id?: string) =>
  forColumn("arrangement_id", id);
export const getPiecesForTenet = (id?: string) => forColumn("tenet_id", id);

/** Option lists for the anchor pickers in the essay/episode compose forms. */
export async function getAnchorOptions(): Promise<{
  passages: AnchorOption[];
  arrangements: AnchorOption[];
  tenets: AnchorOption[];
}> {
  const [passages, arrangements, tenets] = await Promise.all([
    getAllPassages(),
    listArrangements(),
    getTenets(),
  ]);
  return {
    passages: passages.map((p) => ({
      id: p.passageId,
      label: `${p.title} · ${p.canonicalRef}`,
    })),
    arrangements: arrangements.map((a) => ({ id: a.id, label: a.title })),
    tenets: tenets
      .filter((t) => t.id)
      .map((t) => ({ id: t.id as string, label: t.title })),
  };
}
