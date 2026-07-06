import { createAnonClient } from "@/lib/supabase/admin";
import { getProfileByHandle } from "@/lib/data/members";

// Named branches are public (RLS open select), so the anon client suffices.

export interface BranchSummary {
  name: string;
  slug: string;
  passageCount: number;
}

export interface BranchEntry {
  passageTitle: string;
  canonicalRef: string;
  passageSlug: string;
  renderingId: string;
  isGathered: boolean;
}

export interface BranchDetail {
  name: string;
  slug: string;
  description?: string;
  authorName: string;
  authorHandle: string;
  entries: BranchEntry[];
}

/** A contributor's named branches (for their profile and the compose picker). */
export async function getBranchesByAuthor(
  authorId: string,
): Promise<BranchSummary[]> {
  const sb = createAnonClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("branches")
    .select("name,slug,renderings(id)")
    .eq("author_id", authorId)
    .order("name");
  if (error || !data) return [];
  type Row = { name: string; slug: string; renderings: { id: string }[] };
  return (data as unknown as Row[]).map((b) => ({
    name: b.name,
    slug: b.slug,
    passageCount: b.renderings?.length ?? 0,
  }));
}

/** One named branch, read whole: its passages in book order. */
export async function getBranch(
  handle: string,
  slug: string,
): Promise<BranchDetail | null> {
  const sb = createAnonClient();
  if (!sb) return null;
  const profile = await getProfileByHandle(handle);
  if (!profile) return null;

  const { data, error } = await sb
    .from("branches")
    .select(
      "name,slug,description,renderings(id,status,passages!renderings_passage_id_fkey(slug,title,canonical_ref,order_index,current_rendering_id))",
    )
    .eq("author_id", profile.id)
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;

  type Row = {
    name: string;
    slug: string;
    description: string | null;
    renderings: {
      id: string;
      status: string;
      passages: {
        slug: string;
        title: string;
        canonical_ref: string;
        order_index: number;
        current_rendering_id: string | null;
      } | null;
    }[];
  };
  const row = data as unknown as Row;

  const entries: BranchEntry[] = (row.renderings ?? [])
    .filter((r) => r.passages && r.status !== "draft")
    .sort(
      (a, b) => (a.passages!.order_index) - (b.passages!.order_index),
    )
    .map((r) => ({
      passageTitle: r.passages!.title,
      canonicalRef: r.passages!.canonical_ref,
      passageSlug: r.passages!.slug,
      renderingId: r.id,
      isGathered: r.id === r.passages!.current_rendering_id,
    }));

  return {
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    authorName: profile.displayName,
    authorHandle: profile.handle,
    entries,
  };
}
