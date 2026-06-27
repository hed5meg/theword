import { createAnonClient } from "@/lib/supabase/admin";

export interface PassageRef {
  id: string;
  slug: string;
  title: string;
  canonicalRef: string;
  traditionalText?: string;
  movementSlug: string;
}

/** Minimal passage lookup by slug, for the authoring flow. */
export async function getPassageRef(slug: string): Promise<PassageRef | null> {
  const sb = createAnonClient();
  if (!sb) return null;
  const { data } = await sb
    .from("passages")
    .select("id,slug,title,canonical_ref,traditional_text,movements!inner(slug)")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;

  type Row = {
    id: string;
    slug: string;
    title: string;
    canonical_ref: string;
    traditional_text: string | null;
    movements: { slug: string };
  };
  const row = data as unknown as Row;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    canonicalRef: row.canonical_ref,
    traditionalText: row.traditional_text ?? undefined,
    movementSlug: row.movements.slug,
  };
}
