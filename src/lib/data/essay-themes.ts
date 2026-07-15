import { createAnonClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

// Essay themes are public (RLS open read). Ordering: by the steward-set
// position, then by creation. Graceful when the table is absent.

export interface ThemeMeta {
  id: string;
  title: string;
  slug: string;
  description?: string;
  position: number;
}

export async function listThemes(): Promise<ThemeMeta[]> {
  const sb = createAnonClient();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from("essay_themes")
      .select("id,title,slug,description,position")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return (
      data as {
        id: string;
        title: string;
        slug: string;
        description: string | null;
        position: number;
      }[]
    ).map((t) => ({
      id: t.id,
      title: t.title,
      slug: t.slug,
      description: t.description ?? undefined,
      position: t.position,
    }));
  } catch {
    return [];
  }
}

/**
 * The next order number for each theme (max existing order + 1), keyed by the
 * theme's lower-cased title. Used to auto-fill the essay form's Order field.
 * Session client so a steward's drafts count toward the max.
 */
export async function getThemeNextOrders(): Promise<Record<string, number>> {
  try {
    const sb = await createServerSupabase();
    const { data, error } = await sb
      .from("essays")
      .select("theme_order,theme:essay_themes(title)");
    if (error || !data) return {};
    const max: Record<string, number> = {};
    for (const r of data as unknown as {
      theme_order: number | null;
      theme: { title: string } | null;
    }[]) {
      const title = r.theme?.title;
      if (!title) continue;
      const key = title.toLowerCase();
      const o = r.theme_order ?? 0;
      if (o > (max[key] ?? 0)) max[key] = o;
    }
    const next: Record<string, number> = {};
    for (const k of Object.keys(max)) next[k] = max[k] + 1;
    return next;
  } catch {
    return {};
  }
}

export async function getThemeMeta(slug: string): Promise<ThemeMeta | null> {
  const sb = createAnonClient();
  if (!sb) return null;
  try {
    const { data } = await sb
      .from("essay_themes")
      .select("id,title,slug,description,position")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return null;
    const t = data as {
      id: string;
      title: string;
      slug: string;
      description: string | null;
      position: number;
    };
    return {
      id: t.id,
      title: t.title,
      slug: t.slug,
      description: t.description ?? undefined,
      position: t.position,
    };
  } catch {
    return null;
  }
}
