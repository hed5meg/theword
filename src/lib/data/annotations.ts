import type { Annotation } from "@/lib/types";
import { createServerSupabase } from "@/lib/supabase/server";

// Author annotations are PUBLIC (RLS allows anyone to read non-hidden rows), so
// the session client works for signed-out readers too. Graceful: if the table
// isn't there yet (migration not run), we simply return nothing.

const SELECT =
  "id,rendering_id,quoted_text,anchor_start,anchor_end,context_prefix,context_suffix,note";

type Row = {
  id: string;
  rendering_id: string;
  quoted_text: string;
  anchor_start: number;
  anchor_end: number;
  context_prefix: string | null;
  context_suffix: string | null;
  note: string;
};

function mapAnnotation(r: Row): Annotation {
  return {
    id: r.id,
    renderingId: r.rendering_id,
    quotedText: r.quoted_text,
    anchorStart: r.anchor_start,
    anchorEnd: r.anchor_end,
    contextPrefix: r.context_prefix ?? "",
    contextSuffix: r.context_suffix ?? "",
    note: r.note,
  };
}

/** Annotations grouped by rendering id (public — visible to everyone). */
export async function getAnnotationsByRendering(
  renderingIds: string[],
): Promise<Map<string, Annotation[]>> {
  const out = new Map<string, Annotation[]>();
  if (renderingIds.length === 0) return out;
  try {
    const sb = await createServerSupabase();
    const { data, error } = await sb
      .from("rendering_annotations")
      .select(SELECT)
      .in("rendering_id", renderingIds)
      .order("anchor_start", { ascending: true });
    if (error || !data) return out;
    for (const r of data as unknown as Row[]) {
      const a = mapAnnotation(r);
      const list = out.get(a.renderingId) ?? [];
      list.push(a);
      out.set(a.renderingId, list);
    }
  } catch {
    // table missing
  }
  return out;
}
