import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";
import { createServerSupabase } from "@/lib/supabase/server";

/** The signed-in auth user, or null. */
export async function getUser(): Promise<User | null> {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user;
}

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

/** The signed-in member's profile, or null if signed out. */
export async function getProfile(): Promise<Profile | null> {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb
    .from("profiles")
    .select("id,handle,display_name,bio,traditions,languages,role")
    .eq("id", user.id)
    .maybeSingle();
  return data ? mapProfile(data) : null;
}

/**
 * Ensure a profile exists for the freshly signed-in user. The DB trigger
 * normally does this; this is a resilient fallback so accounts work even before
 * the trigger migration is applied. Uses the user's own session (RLS-safe).
 */
export async function ensureProfile(sb: SupabaseClient, user: User): Promise<void> {
  const { data: existing } = await sb
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return;

  const email = user.email ?? "";
  const base =
    email.split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ||
    "friend";
  const displayName = base
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

  // Try the clean handle; on collision, append a short id suffix.
  const attempt = async (handle: string) =>
    sb.from("profiles").insert({ id: user.id, handle, display_name: displayName });

  const first = await attempt(base);
  if (first.error) {
    await attempt(`${base}-${user.id.slice(0, 6)}`);
  }
}
