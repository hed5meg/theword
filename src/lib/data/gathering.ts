import { createAnonClient } from "@/lib/supabase/admin";

export interface GatheredEvent {
  note?: string;
  promotedBy?: string;
  renderingAuthor?: string;
  createdAt: string;
}

/** The record of how a passage's Gathered Rendering has changed over time. */
export async function getGatheredHistory(passageId: string): Promise<GatheredEvent[]> {
  const sb = createAnonClient();
  if (!sb) return [];
  const { data } = await sb
    .from("gathered_history")
    .select(
      "note,created_at,promoter:profiles(display_name),renderings(author_name,author:profiles(display_name))",
    )
    .eq("passage_id", passageId)
    .order("created_at", { ascending: false });

  type Row = {
    note: string | null;
    created_at: string;
    promoter: { display_name: string } | null;
    renderings: {
      author_name: string | null;
      author: { display_name: string } | null;
    } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    note: r.note ?? undefined,
    promotedBy: r.promoter?.display_name ?? undefined,
    renderingAuthor:
      r.renderings?.author?.display_name ?? r.renderings?.author_name ?? undefined,
    createdAt: r.created_at,
  }));
}
