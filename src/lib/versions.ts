import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ensure a rendering has at least a baseline version row; return its id.
 * Shared by Margin Notes (anchor provenance) and Refinements (accept → new
 * version). Not a server action — a plain server-side helper.
 */
export async function ensureRenderingVersion(
  sb: SupabaseClient,
  renderingId: string,
): Promise<string | null> {
  const { data: existing } = await sb
    .from("rendering_versions")
    .select("id")
    .eq("rendering_id", renderingId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return existing.id as string;
  const { data: r } = await sb
    .from("renderings")
    .select("body")
    .eq("id", renderingId)
    .maybeSingle();
  const { data: created } = await sb
    .from("rendering_versions")
    .insert({ rendering_id: renderingId, body: r?.body ?? "", note: "baseline" })
    .select("id")
    .single();
  return (created?.id as string) ?? null;
}
