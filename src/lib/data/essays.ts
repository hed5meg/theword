import type { Essay, EssayCard, PieceAnchor } from "@/lib/types";
import { createServerSupabase } from "@/lib/supabase/server";
import { resonanceCounts } from "@/lib/data/from-supabase";
import { extractAnchors, type EssayAnchor } from "@/lib/rehype-essay";

export interface EssayLinkTarget {
  slug: string;
  title: string;
  anchors: EssayAnchor[];
}

/** Essays (with their linkable anchors) for the editor's cross-link picker. */
export async function getEssayLinkTargets(): Promise<EssayLinkTarget[]> {
  try {
    const sb = await createServerSupabase();
    const { data, error } = await sb
      .from("essays")
      .select("slug,title,body")
      .order("title");
    if (error || !data) return [];
    return (data as { slug: string; title: string; body: string }[]).map((r) => ({
      slug: r.slug,
      title: r.title,
      anchors: extractAnchors(r.body),
    }));
  } catch {
    return [];
  }
}

// Essays are curated: RLS returns published rows to everyone and drafts to
// stewards. We use the session client so stewards see their drafts. Graceful:
// if the table isn't there yet (migration not run), we return nothing.

type AnchorRefs = {
  passages: { slug: string; title: string } | null;
  arrangements: { slug: string; title: string } | null;
  tenets: { slug: string; title: string } | null;
};

const SELECT =
  "id,title,slug,dek,body,byline,status,published_at,theme_order,author:profiles(handle,display_name),theme:essay_themes(title,slug),passages(slug,title),arrangements(slug,title),tenets(slug,title)";

function anchorOf(r: AnchorRefs): PieceAnchor {
  return {
    passageSlug: r.passages?.slug,
    passageTitle: r.passages?.title,
    arrangementSlug: r.arrangements?.slug,
    arrangementTitle: r.arrangements?.title,
    tenetSlug: r.tenets?.slug,
    tenetTitle: r.tenets?.title,
  };
}

type Row = AnchorRefs & {
  id: string;
  title: string;
  slug: string;
  dek: string | null;
  body: string;
  byline: string | null;
  status: Essay["status"];
  published_at: string | null;
  theme_order: number | null;
  author: { handle: string; display_name: string } | null;
  theme: { title: string; slug: string } | null;
};

/** Published essays (plus the viewing steward's drafts), newest first. */
export async function listEssays(): Promise<EssayCard[]> {
  try {
    const sb = await createServerSupabase();
    const { data, error } = await sb
      .from("essays")
      .select(SELECT)
      .order("published_at", { ascending: false, nullsFirst: true })
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return (data as unknown as Row[]).map((r) => ({
      title: r.title,
      slug: r.slug,
      dek: r.dek ?? undefined,
      byline: r.byline ?? undefined,
      authorName: r.author?.display_name,
      status: r.status,
      publishedAt: r.published_at ?? undefined,
      anchor: anchorOf(r),
      themeTitle: r.theme?.title,
      themeSlug: r.theme?.slug,
      themeOrder: r.theme_order ?? 0,
    }));
  } catch {
    return [];
  }
}

/** One essay by slug (draft visible only to stewards, via RLS). */
export async function getEssay(slug: string): Promise<Essay | null> {
  try {
    const sb = await createServerSupabase();
    const { data, error } = await sb
      .from("essays")
      .select(SELECT)
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    const r = data as unknown as Row;
    const counts = await resonanceCounts(sb, "essay", [r.id]);
    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      dek: r.dek ?? undefined,
      body: r.body,
      byline: r.byline ?? undefined,
      authorName: r.author?.display_name,
      authorHandle: r.author?.handle,
      status: r.status,
      publishedAt: r.published_at ?? undefined,
      resonanceCount: counts.get(r.id) ?? 0,
      anchor: anchorOf(r),
      themeTitle: r.theme?.title,
      themeSlug: r.theme?.slug,
    };
  } catch {
    return null;
  }
}

export interface EssayEdit {
  id: string;
  title: string;
  slug: string;
  dek: string;
  body: string;
  byline: string;
  status: Essay["status"];
  passageId: string;
  arrangementId: string;
  tenetId: string;
  themeTitle: string;
  themeOrder: number;
}

/** Raw essay row for editing (stewards only, via RLS). */
export async function getEssayForEdit(slug: string): Promise<EssayEdit | null> {
  try {
    const sb = await createServerSupabase();
    const { data } = await sb
      .from("essays")
      .select(
        "id,title,slug,dek,body,byline,status,theme_order,passage_id,arrangement_id,tenet_id,theme:essay_themes(title)",
      )
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return null;
    const r = data as unknown as {
      id: string;
      title: string;
      slug: string;
      dek: string | null;
      body: string;
      byline: string | null;
      status: Essay["status"];
      theme_order: number | null;
      passage_id: string | null;
      arrangement_id: string | null;
      tenet_id: string | null;
      theme: { title: string } | null;
    };
    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      dek: r.dek ?? "",
      body: r.body,
      byline: r.byline ?? "",
      status: r.status,
      passageId: r.passage_id ?? "",
      arrangementId: r.arrangement_id ?? "",
      tenetId: r.tenet_id ?? "",
      themeTitle: r.theme?.title ?? "",
      themeOrder: r.theme_order ?? 0,
    };
  } catch {
    return null;
  }
}
