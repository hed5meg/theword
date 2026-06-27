import type { Profile } from "@/lib/types";
import { createAnonClient } from "@/lib/supabase/admin";

// Public profile reads. Profiles are open to read (RLS), so the anon client is
// fine. These only return data when Supabase is configured.

function mapProfile(row: {
  id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  traditions: string[] | null;
  languages: string[] | null;
  role: Profile["role"];
}): Profile {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    bio: row.bio ?? undefined,
    traditions: row.traditions ?? [],
    languages: row.languages ?? [],
    role: row.role,
  };
}

export async function getProfileByHandle(handle: string): Promise<Profile | null> {
  const sb = createAnonClient();
  if (!sb) return null;
  const { data } = await sb
    .from("profiles")
    .select("id,handle,display_name,bio,traditions,languages,role")
    .eq("handle", handle)
    .maybeSingle();
  return data ? mapProfile(data) : null;
}

export interface MemberRendering {
  passageTitle: string;
  canonicalRef: string;
  movementSlug: string;
  passageSlug: string;
  isGathered: boolean;
}

/** A member's renderings, as their personal rendering of the book. */
export async function getMemberRenderings(
  profileId: string,
): Promise<MemberRendering[]> {
  const sb = createAnonClient();
  if (!sb) return [];
  const { data } = await sb
    .from("renderings")
    .select(
      "id,status,passages!inner(slug,title,canonical_ref,order_index,current_rendering_id,movements!inner(slug))",
    )
    .eq("author_id", profileId)
    .neq("status", "draft");

  type Row = {
    id: string;
    passages: {
      slug: string;
      title: string;
      canonical_ref: string;
      order_index: number;
      current_rendering_id: string | null;
      movements: { slug: string };
    };
  };

  return ((data ?? []) as unknown as Row[])
    .sort((a, b) => a.passages.order_index - b.passages.order_index)
    .map((r) => ({
      passageTitle: r.passages.title,
      canonicalRef: r.passages.canonical_ref,
      movementSlug: r.passages.movements.slug,
      passageSlug: r.passages.slug,
      isGathered: r.id === r.passages.current_rendering_id,
    }));
}
