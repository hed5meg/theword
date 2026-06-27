import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { loadContent } from "@/lib/content/parse";
import * as fromSeed from "@/lib/data/from-seed";
import * as fromSupabase from "@/lib/data/from-supabase";

// ---------------------------------------------------------------------------
// Data access layer — the reader's only source.
//
// When Supabase is configured, reads come from the database (live, collaborative).
// Otherwise they come from the in-repo seed content, so the book still renders
// with `npm run dev` and no credentials. Same signatures either way.
// ---------------------------------------------------------------------------

const source = isSupabaseConfigured() ? fromSupabase : fromSeed;

export const getOutline = source.getOutline;
export const getPassage = source.getPassage;
export const getTenets = source.getTenets;
export const getTenet = source.getTenet;
export const getStats = source.getStats;

export type {
  BookStats,
  PassageLocation,
  MovementOutline,
  PassageOutline,
  TenetDetail,
} from "@/lib/types";

export async function getMission(): Promise<string> {
  const { mission } = await loadContent();
  return mission
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n\n");
}
