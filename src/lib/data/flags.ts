import { createServerSupabase } from "@/lib/supabase/server";

export interface FlagItem {
  id: string;
  targetType: string;
  targetId: string;
  reason?: string;
  createdAt: string;
  reporterName?: string;
  targetSnippet: string;
  targetHref?: string;
  renderingStatus?: string;
  reflectionHidden?: boolean;
}

function snippet(body: string, n = 120): string {
  const clean = body.replace(/\s+/g, " ").trim();
  return clean.length > n ? clean.slice(0, n) + "…" : clean;
}

/** Open flags for the steward queue. Readable only by stewards (RLS). */
export async function getOpenFlags(): Promise<FlagItem[]> {
  const sb = await createServerSupabase();
  const { data } = await sb
    .from("flags")
    .select("id,target_type,target_id,reason,created_at,reporter:profiles(handle,display_name)")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  type Row = {
    id: string;
    target_type: string;
    target_id: string;
    reason: string | null;
    created_at: string;
    reporter: { handle: string; display_name: string } | null;
  };
  const rows = (data ?? []) as unknown as Row[];

  const items: FlagItem[] = rows.map((r) => ({
    id: r.id,
    targetType: r.target_type,
    targetId: r.target_id,
    reason: r.reason ?? undefined,
    createdAt: r.created_at,
    reporterName: r.reporter?.display_name,
    targetSnippet: "(content unavailable)",
  }));

  const idsByType = (t: string) =>
    items.filter((i) => i.targetType === t).map((i) => i.targetId);
  const apply = (t: string, fn: (i: FlagItem) => void) =>
    items.filter((i) => i.targetType === t).forEach(fn);

  // Renderings
  const rIds = idsByType("rendering");
  if (rIds.length) {
    const { data: rs } = await sb
      .from("renderings")
      .select("id,body,status,passages!inner(slug,movements!inner(slug))")
      .in("id", rIds);
    const map = new Map(
      ((rs ?? []) as unknown as {
        id: string;
        body: string;
        status: string;
        passages: { slug: string; movements: { slug: string } };
      }[]).map((x) => [x.id, x]),
    );
    apply("rendering", (i) => {
      const x = map.get(i.targetId);
      if (x) {
        i.targetSnippet = snippet(x.body);
        i.renderingStatus = x.status;
        i.targetHref = `/read/${x.passages.movements.slug}/${x.passages.slug}`;
      }
    });
  }

  // Reflections
  const fIds = idsByType("reflection");
  if (fIds.length) {
    const { data: fs } = await sb
      .from("reflections")
      .select("id,body,hidden")
      .in("id", fIds);
    const map = new Map(
      ((fs ?? []) as unknown as { id: string; body: string; hidden: boolean }[]).map((x) => [
        x.id,
        x,
      ]),
    );
    apply("reflection", (i) => {
      const x = map.get(i.targetId);
      if (x) {
        i.targetSnippet = snippet(x.body);
        i.reflectionHidden = x.hidden;
      }
    });
  }

  // Tenets
  const tIds = idsByType("tenet");
  if (tIds.length) {
    const { data: ts } = await sb.from("tenets").select("id,slug,title").in("id", tIds);
    const map = new Map(
      ((ts ?? []) as unknown as { id: string; slug: string; title: string }[]).map((x) => [
        x.id,
        x,
      ]),
    );
    apply("tenet", (i) => {
      const x = map.get(i.targetId);
      if (x) {
        i.targetSnippet = x.title;
        i.targetHref = `/principles/${x.slug}`;
      }
    });
  }

  // Passages
  const pIds = idsByType("passage");
  if (pIds.length) {
    const { data: ps } = await sb
      .from("passages")
      .select("id,slug,title,movements!inner(slug)")
      .in("id", pIds);
    const map = new Map(
      ((ps ?? []) as unknown as {
        id: string;
        slug: string;
        title: string;
        movements: { slug: string };
      }[]).map((x) => [x.id, x]),
    );
    apply("passage", (i) => {
      const x = map.get(i.targetId);
      if (x) {
        i.targetSnippet = x.title;
        i.targetHref = `/read/${x.movements.slug}/${x.slug}`;
      }
    });
  }

  return items;
}
