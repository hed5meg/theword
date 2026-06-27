import type {
  ArrangementCard,
  ArrangementMeta,
  ArrangementOutline,
  ArrangementOutlineGroup,
  ArrangementPassageLocation,
  Rendering,
} from "@/lib/types";
import { createAnonClient } from "@/lib/supabase/admin";
import {
  RENDERING_SELECT,
  mapRendering,
  resonanceCounts,
  type RenderingRow,
} from "@/lib/data/from-supabase";

export const DEFAULT_ARRANGEMENT_SLUG = "the-love-ordered-arrangement";

type ProfileRef = { handle: string; display_name: string } | null;

function meta(row: {
  slug: string;
  title: string;
  description: string | null;
  is_default: boolean;
  is_system: boolean;
  author: ProfileRef;
}): ArrangementMeta {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description ?? undefined,
    isDefault: row.is_default,
    isSystem: row.is_system,
    authorName: row.author?.display_name,
    authorHandle: row.author?.handle,
  };
}

/** The slug of the default arrangement (what everyone sees first). */
export async function getDefaultArrangementSlug(): Promise<string> {
  const sb = createAnonClient();
  if (!sb) return DEFAULT_ARRANGEMENT_SLUG;
  const { data } = await sb
    .from("arrangements")
    .select("slug")
    .eq("is_default", true)
    .maybeSingle();
  return (data?.slug as string) ?? DEFAULT_ARRANGEMENT_SLUG;
}

/** Lightweight list for the reader's arrangement selector. */
export async function getArrangementMetaList(): Promise<ArrangementMeta[]> {
  const sb = createAnonClient();
  if (!sb) return [];
  const { data } = await sb
    .from("arrangements")
    .select("slug,title,description,is_default,is_system,author:profiles(handle,display_name)")
    .eq("status", "published")
    .order("is_default", { ascending: false })
    .order("is_system", { ascending: false })
    .order("created_at", { ascending: true });
  return ((data ?? []) as unknown as Parameters<typeof meta>[0][]).map(meta);
}

type EntryRow = {
  order_index: number;
  title: string | null;
  slug: string | null;
  arrangement_movement_id: string | null;
  passages: {
    slug: string;
    canonical_ref: string;
    title: string;
    renderings?: { count: number }[];
  };
};
type MovementRow = {
  id: string;
  title: string;
  subtitle: string | null;
  order_index: number;
};

function displaySlug(e: EntryRow): string {
  return e.slug ?? e.passages.slug;
}
function displayTitle(e: EntryRow): string {
  return e.title ?? e.passages.title;
}

/** The full outline of an arrangement: movements → entries, in order. */
export async function getArrangementOutline(
  slug: string,
): Promise<ArrangementOutline | null> {
  const sb = createAnonClient();
  if (!sb) return null;
  const { data } = await sb
    .from("arrangements")
    .select(
      "slug,title,description,is_default,is_system,author:profiles(handle,display_name)," +
        "arrangement_movements(id,title,subtitle,order_index)," +
        "arrangement_entries(order_index,title,slug,arrangement_movement_id," +
        "passages(slug,canonical_ref,title,renderings!renderings_passage_id_fkey(count)))",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;

  const row = data as unknown as Parameters<typeof meta>[0] & {
    arrangement_movements: MovementRow[];
    arrangement_entries: EntryRow[];
  };

  const entries = [...row.arrangement_entries].sort(
    (a, b) => a.order_index - b.order_index,
  );
  const toEntry = (e: EntryRow) => ({
    slug: displaySlug(e),
    title: displayTitle(e),
    canonicalRef: e.passages.canonical_ref,
    renderingCount: e.passages.renderings?.[0]?.count ?? 0,
  });

  const groups: ArrangementOutlineGroup[] = [];
  const movements = [...row.arrangement_movements].sort(
    (a, b) => a.order_index - b.order_index,
  );
  if (movements.length > 0) {
    for (const m of movements) {
      groups.push({
        title: m.title,
        subtitle: m.subtitle ?? undefined,
        entries: entries
          .filter((e) => e.arrangement_movement_id === m.id)
          .map(toEntry),
      });
    }
    const ungrouped = entries.filter((e) => !e.arrangement_movement_id);
    if (ungrouped.length) groups.push({ entries: ungrouped.map(toEntry) });
  } else {
    groups.push({ entries: entries.map(toEntry) });
  }

  return { arrangement: meta(row), groups, total: entries.length };
}

/** A passage as read within a specific arrangement (routing C). */
export async function getArrangementPassage(
  arrangementSlug: string,
  entrySlug: string,
): Promise<ArrangementPassageLocation | null> {
  const sb = createAnonClient();
  if (!sb) return null;

  const { data } = await sb
    .from("arrangements")
    .select(
      "slug,title,description,is_default,is_system,author:profiles(handle,display_name)," +
        "arrangement_entries(order_index,title,slug,passage_id," +
        "passages(slug,canonical_ref,title),arrangement_movements(title))",
    )
    .eq("slug", arrangementSlug)
    .maybeSingle();
  if (!data) return null;

  type LocEntry = {
    order_index: number;
    title: string | null;
    slug: string | null;
    passage_id: string;
    passages: { slug: string; canonical_ref: string; title: string };
    arrangement_movements: { title: string } | null;
  };
  const row = data as unknown as Parameters<typeof meta>[0] & {
    arrangement_entries: LocEntry[];
  };

  const entries = [...row.arrangement_entries].sort(
    (a, b) => a.order_index - b.order_index,
  );
  const dSlug = (e: LocEntry) => e.slug ?? e.passages.slug;
  const dTitle = (e: LocEntry) => e.title ?? e.passages.title;
  const i = entries.findIndex((e) => dSlug(e) === entrySlug);
  if (i === -1) return null;
  const entry = entries[i];

  // Passage detail (renderings + traditional text).
  const { data: p } = await sb
    .from("passages")
    .select(
      `id,slug,canonical_ref,title,traditional_text,current_rendering_id,renderings!renderings_passage_id_fkey(${RENDERING_SELECT})`,
    )
    .eq("id", entry.passage_id)
    .maybeSingle();
  if (!p) return null;
  const pr = p as unknown as {
    id: string;
    slug: string;
    canonical_ref: string;
    traditional_text: string | null;
    current_rendering_id: string | null;
    renderings: RenderingRow[];
  };

  const counts = await resonanceCounts(
    sb,
    "rendering",
    pr.renderings.map((r) => r.id),
  );
  const renderings: Rendering[] = pr.renderings
    .map((r) => mapRendering(r, pr.current_rendering_id, counts.get(r.id) ?? 0))
    .sort((a, b) => Number(b.isGathered) - Number(a.isGathered));

  const ref = (e: LocEntry) => ({
    arrangementSlug,
    passageSlug: dSlug(e),
    title: dTitle(e),
  });

  return {
    arrangement: meta(row),
    movementTitle: entry.arrangement_movements?.title,
    entrySlug,
    position: i + 1,
    total: entries.length,
    previous: i > 0 ? ref(entries[i - 1]) : null,
    next: i < entries.length - 1 ? ref(entries[i + 1]) : null,
    passage: {
      id: pr.id,
      slug: pr.slug, // base slug, used by the "offer a rendering" link
      movementSlug: arrangementSlug,
      canonicalRef: pr.canonical_ref,
      title: dTitle(entry), // per-arrangement display title
      orderIndex: i,
      traditionalText: pr.traditional_text ?? undefined,
      gatheredRendering: renderings.find((r) => r.isGathered) ?? null,
      renderings,
    },
  };
}

/** Cards for the /arrangements browse page. */
export async function listArrangements(): Promise<ArrangementCard[]> {
  const sb = createAnonClient();
  if (!sb) return [];
  const { data } = await sb
    .from("arrangements")
    .select(
      "id,slug,title,description,is_default,is_system,author:profiles(handle,display_name)," +
        "arrangement_movements(title,order_index)," +
        "arrangement_entries(order_index,title,passages(title))",
    )
    .eq("status", "published")
    .order("is_default", { ascending: false })
    .order("is_system", { ascending: false })
    .order("created_at", { ascending: true });
  if (!data) return [];

  type Row = Parameters<typeof meta>[0] & {
    id: string;
    arrangement_movements: { title: string; order_index: number }[];
    arrangement_entries: {
      order_index: number;
      title: string | null;
      passages: { title: string };
    }[];
  };
  const rows = data as unknown as Row[];

  const ids = rows.map((r) => r.id);
  const res = await resonanceCounts(sb, "arrangement", ids);

  return rows.map((r) => {
    const movements = [...r.arrangement_movements].sort(
      (a, b) => a.order_index - b.order_index,
    );
    const entries = [...r.arrangement_entries].sort(
      (a, b) => a.order_index - b.order_index,
    );
    const preview =
      movements.length > 0
        ? movements.map((m) => m.title)
        : entries.slice(0, 5).map((e) => e.title ?? e.passages.title);
    return {
      ...meta(r),
      id: r.id,
      movementCount: movements.length,
      passageCount: entries.length,
      resonanceCount: res.get(r.id) ?? 0,
      preview,
    };
  });
}

// ---- Builder support -------------------------------------------------------

export interface BuilderPassage {
  passageId: string;
  baseSlug: string;
  title: string;
  canonicalRef: string;
}

/** All passages (base names), in canonical order — the builder's atoms. */
export async function getAllPassages(): Promise<BuilderPassage[]> {
  const sb = createAnonClient();
  if (!sb) return [];
  const { data } = await sb
    .from("passages")
    .select("id,slug,title,canonical_ref");
  type Row = { id: string; slug: string; title: string; canonical_ref: string };
  return ((data ?? []) as Row[])
    .map((r) => ({
      passageId: r.id,
      baseSlug: r.slug,
      title: r.title,
      canonicalRef: r.canonical_ref,
    }))
    .sort((a, b) => {
      const k = (ref: string) => {
        const m = /Rev\s+(\d+):(\d+)/.exec(ref);
        return m ? Number(m[1]) * 1000 + Number(m[2]) : 0;
      };
      return k(a.canonicalRef) - k(b.canonicalRef);
    });
}

export interface BuilderItem {
  kind: "movement" | "passage";
  // movement
  title?: string;
  subtitle?: string;
  // passage
  passageId?: string;
  canonicalRef?: string;
}

export interface BuilderState {
  slug?: string;
  title: string;
  description: string;
  tenetSlugs: string[];
  items: BuilderItem[];
}

/** Build the editor's initial state from an existing arrangement. */
export async function getArrangementEditState(
  slug: string,
): Promise<BuilderState | null> {
  const sb = createAnonClient();
  if (!sb) return null;
  const { data } = await sb
    .from("arrangements")
    .select(
      "slug,title,description,is_system," +
        "arrangement_tenets(tenets(slug))," +
        "arrangement_movements(id,title,subtitle,order_index)," +
        "arrangement_entries(order_index,arrangement_movement_id,passages(id,title,canonical_ref))",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;

  type Row = {
    slug: string;
    title: string;
    description: string | null;
    arrangement_tenets: { tenets: { slug: string } }[];
    arrangement_movements: {
      id: string;
      title: string;
      subtitle: string | null;
      order_index: number;
    }[];
    arrangement_entries: {
      order_index: number;
      arrangement_movement_id: string | null;
      passages: { id: string; title: string; canonical_ref: string };
    }[];
  };
  const row = data as unknown as Row;

  const movements = [...row.arrangement_movements].sort(
    (a, b) => a.order_index - b.order_index,
  );
  const entries = [...row.arrangement_entries].sort(
    (a, b) => a.order_index - b.order_index,
  );

  // Flatten to builder items: each movement header followed by its passages,
  // in entry order. (Entries already encode order; group by movement.)
  const items: BuilderItem[] = [];
  const emitted = new Set<string>();
  const entriesByMovement = (mid: string | null) =>
    entries.filter((e) => e.arrangement_movement_id === mid);

  for (const m of movements) {
    items.push({ kind: "movement", title: m.title, subtitle: m.subtitle ?? "" });
    for (const e of entriesByMovement(m.id)) {
      items.push({
        kind: "passage",
        passageId: e.passages.id,
        title: e.passages.title,
        canonicalRef: e.passages.canonical_ref,
      });
      emitted.add(e.passages.id);
    }
  }
  // Any ungrouped passages (no movement) at the end.
  for (const e of entries) {
    if (!emitted.has(e.passages.id)) {
      items.push({
        kind: "passage",
        passageId: e.passages.id,
        title: e.passages.title,
        canonicalRef: e.passages.canonical_ref,
      });
    }
  }

  return {
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    tenetSlugs: row.arrangement_tenets.map((t) => t.tenets.slug),
    items,
  };
}

export interface ArrangementView {
  meta: ArrangementMeta;
  id: string;
  outline: ArrangementOutline;
  resonanceCount: number;
}

/** Full data for /arrangements/[slug]. */
export async function getArrangementView(
  slug: string,
): Promise<ArrangementView | null> {
  const sb = createAnonClient();
  if (!sb) return null;
  const outline = await getArrangementOutline(slug);
  if (!outline) return null;
  const { data: idRow } = await sb
    .from("arrangements")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  const id = (idRow?.id as string) ?? "";
  const res = id ? await resonanceCounts(sb, "arrangement", [id]) : new Map();
  return { meta: outline.arrangement, id, outline, resonanceCount: res.get(id) ?? 0 };
}
