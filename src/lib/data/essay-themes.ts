import { createAnonClient } from "@/lib/supabase/admin";

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
