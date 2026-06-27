import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BookStats,
  MovementOutline,
  PassageLocation,
  Rendering,
  RenderingStatus,
  Tenet,
  TenetDetail,
  TenetUsage,
} from "@/lib/types";
import { createAnonClient } from "@/lib/supabase/admin";
import * as seed from "@/lib/data/from-seed";

// Read API backed by Supabase. Public content is governed by RLS (open select),
// so the anon client suffices. If the client can't be created we fall back to
// the seed content so the reader never goes dark.

type ProfileRef = { handle: string; display_name: string } | null;
type TenetRow = {
  slug: string;
  title: string;
  description: string;
  support: string | null;
  group: string | null;
};
type RenderingRow = {
  id: string;
  body: string;
  language: string;
  tradition: string | null;
  status: RenderingStatus;
  author_name: string | null;
  created_at: string;
  author: ProfileRef;
  rendering_tenets: { tenets: TenetRow }[];
};

const RENDERING_SELECT =
  "id,body,language,tradition,status,author_name,created_at,author:profiles(handle,display_name),rendering_tenets(tenets(slug,title,description,support,group))";

function authorName(row: { author: ProfileRef; author_name: string | null }): string {
  return row.author?.display_name ?? row.author_name ?? "A contributor";
}

function mapTenet(t: TenetRow, resonanceCount = 0): Tenet {
  return {
    slug: t.slug,
    title: t.title,
    description: t.description,
    support: t.support ?? "",
    group: t.group ?? undefined,
    resonanceCount,
  };
}

function mapRendering(
  row: RenderingRow,
  currentRenderingId: string | null,
  resonanceCount: number,
): Rendering {
  return {
    id: row.id,
    body: row.body,
    author: authorName(row),
    authorHandle: row.author?.handle,
    language: row.language,
    tradition: row.tradition ?? undefined,
    status: row.status,
    tenets: (row.rendering_tenets ?? []).map((rt) => mapTenet(rt.tenets)),
    resonanceCount,
    isGathered: row.id === currentRenderingId,
  };
}

/** Count additive resonances for a set of targets, tallied by target id. */
async function resonanceCounts(
  sb: SupabaseClient,
  targetType: "rendering" | "tenet" | "reflection",
  ids: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (ids.length === 0) return counts;
  const { data } = await sb
    .from("resonances")
    .select("target_id")
    .eq("target_type", targetType)
    .in("target_id", ids);
  for (const row of (data ?? []) as { target_id: string }[]) {
    counts.set(row.target_id, (counts.get(row.target_id) ?? 0) + 1);
  }
  return counts;
}

export async function getOutline(): Promise<MovementOutline[]> {
  const sb = createAnonClient();
  if (!sb) return seed.getOutline();

  const { data, error } = await sb
    .from("movements")
    .select(
      "slug,title,summary,order_index, passages(slug,canonical_ref,title,order_index,renderings!renderings_passage_id_fkey(count))",
    )
    .order("order_index")
    .order("order_index", { referencedTable: "passages" });
  if (error || !data) return seed.getOutline();

  type Row = {
    slug: string;
    title: string;
    summary: string | null;
    passages: {
      slug: string;
      canonical_ref: string;
      title: string;
      renderings: { count: number }[];
    }[];
  };

  return (data as unknown as Row[]).map((m) => ({
    slug: m.slug,
    title: m.title,
    summary: m.summary ?? "",
    passages: (m.passages ?? []).map((p) => ({
      slug: p.slug,
      movementSlug: m.slug,
      canonicalRef: p.canonical_ref,
      title: p.title,
      renderingCount: p.renderings?.[0]?.count ?? 0,
    })),
  }));
}

export async function getPassage(
  movementSlug: string,
  passageSlug: string,
): Promise<PassageLocation | null> {
  const sb = createAnonClient();
  if (!sb) return seed.getPassage(movementSlug, passageSlug);

  const { data: movement } = await sb
    .from("movements")
    .select("id,slug,title")
    .eq("slug", movementSlug)
    .maybeSingle();
  if (!movement) return null;

  const { data: p } = await sb
    .from("passages")
    .select(
      `id,slug,canonical_ref,title,order_index,traditional_text,current_rendering_id,renderings!renderings_passage_id_fkey(${RENDERING_SELECT})`,
    )
    .eq("movement_id", movement.id)
    .eq("slug", passageSlug)
    .maybeSingle();
  if (!p) return null;

  type PassageRow = {
    slug: string;
    canonical_ref: string;
    title: string;
    traditional_text: string | null;
    current_rendering_id: string | null;
    renderings: RenderingRow[];
  };
  const passageRow = p as unknown as PassageRow;

  const counts = await resonanceCounts(
    sb,
    "rendering",
    passageRow.renderings.map((r) => r.id),
  );

  const renderings = passageRow.renderings
    .map((r) =>
      mapRendering(r, passageRow.current_rendering_id, counts.get(r.id) ?? 0),
    )
    .sort((a, b) => Number(b.isGathered) - Number(a.isGathered));

  const passage = {
    slug: passageRow.slug,
    movementSlug,
    canonicalRef: passageRow.canonical_ref,
    title: passageRow.title,
    orderIndex: 0,
    traditionalText: passageRow.traditional_text ?? undefined,
    gatheredRendering: renderings.find((r) => r.isGathered) ?? null,
    renderings,
  };

  // Neighbours from the outline (reading order across movements).
  const outline = await getOutline();
  const flat = outline.flatMap((m) => m.passages);
  const i = flat.findIndex(
    (e) => e.movementSlug === movementSlug && e.slug === passageSlug,
  );
  const toRef = (e: { movementSlug: string; slug: string; title: string }) => ({
    movementSlug: e.movementSlug,
    passageSlug: e.slug,
    title: e.title,
  });

  return {
    movementSlug,
    movementTitle: movement.title,
    passage,
    previous: i > 0 ? toRef(flat[i - 1]) : null,
    next: i >= 0 && i < flat.length - 1 ? toRef(flat[i + 1]) : null,
  };
}

export async function getTenets(): Promise<Tenet[]> {
  const sb = createAnonClient();
  if (!sb) return seed.getTenets();

  const { data, error } = await sb
    .from("tenets")
    .select("id,slug,title,description,support,group")
    .order("created_at");
  if (error || !data) return seed.getTenets();

  type Row = TenetRow & { id: string };
  const rows = data as unknown as Row[];
  const counts = await resonanceCounts(
    sb,
    "tenet",
    rows.map((t) => t.id),
  );
  return rows.map((t) => mapTenet(t, counts.get(t.id) ?? 0));
}

export async function getTenet(slug: string): Promise<TenetDetail | null> {
  const sb = createAnonClient();
  if (!sb) return seed.getTenet(slug);

  const { data: t } = await sb
    .from("tenets")
    .select("id,slug,title,description,support,group")
    .eq("slug", slug)
    .maybeSingle();
  if (!t) return null;

  const tenetRow = t as TenetRow & { id: string };
  const count = (await resonanceCounts(sb, "tenet", [tenetRow.id])).get(tenetRow.id) ?? 0;

  const { data: links } = await sb
    .from("rendering_tenets")
    .select(
      "renderings!inner(id,author_name,status,author:profiles(handle,display_name),passages!inner(slug,title,canonical_ref,current_rendering_id,movements!inner(slug)))",
    )
    .eq("tenet_id", tenetRow.id);

  type LinkRow = {
    renderings: {
      id: string;
      author_name: string | null;
      author: ProfileRef;
      passages: {
        slug: string;
        title: string;
        canonical_ref: string;
        current_rendering_id: string | null;
        movements: { slug: string };
      };
    };
  };

  const usages: TenetUsage[] = ((links ?? []) as unknown as LinkRow[]).map((l) => {
    const r = l.renderings;
    const pg = r.passages;
    return {
      passageSlug: pg.slug,
      movementSlug: pg.movements.slug,
      passageTitle: pg.title,
      canonicalRef: pg.canonical_ref,
      author: authorName(r),
      isGathered: r.id === pg.current_rendering_id,
    };
  });

  return { tenet: mapTenet(tenetRow, count), usages };
}

export async function getStats(): Promise<BookStats> {
  const sb = createAnonClient();
  if (!sb) return seed.getStats();

  const counted = async (table: string) => {
    const { count } = await sb.from(table).select("*", { count: "exact", head: true });
    return count ?? 0;
  };
  const [movements, passages, renderings, tenets] = await Promise.all([
    counted("movements"),
    counted("passages"),
    counted("renderings"),
    counted("tenets"),
  ]);
  return { movements, passages, renderings, tenets };
}
