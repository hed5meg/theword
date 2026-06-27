import type { ResonanceTarget } from "@/lib/types";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Which of the given targets the signed-in member has already resonated with.
 * Returns an empty set when signed out.
 */
export async function getMyResonatedIds(
  targetType: ResonanceTarget,
  ids: string[],
): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return new Set();

  const { data } = await sb
    .from("resonances")
    .select("target_id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .in("target_id", ids);

  return new Set(((data ?? []) as { target_id: string }[]).map((r) => r.target_id));
}
