import type { ReflectionTarget } from "@/lib/types";
import { createAnonClient } from "@/lib/supabase/admin";

export interface ReflectionNode {
  id: string;
  body: string;
  authorName: string;
  authorHandle?: string;
  createdAt: string;
  replies: ReflectionNode[];
}

/** Gentle, threaded reflections for a target, oldest first, one reply level. */
export async function getReflections(
  targetType: ReflectionTarget,
  targetId: string,
): Promise<ReflectionNode[]> {
  const sb = createAnonClient();
  if (!sb) return [];

  const { data } = await sb
    .from("reflections")
    .select("id,body,parent_id,created_at,author:profiles(handle,display_name)")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("hidden", false)
    .order("created_at", { ascending: true });

  type Row = {
    id: string;
    body: string;
    parent_id: string | null;
    created_at: string;
    author: { handle: string; display_name: string } | null;
  };

  const rows = (data ?? []) as unknown as Row[];
  const node = (r: Row): ReflectionNode => ({
    id: r.id,
    body: r.body,
    authorName: r.author?.display_name ?? "A member",
    authorHandle: r.author?.handle,
    createdAt: r.created_at,
    replies: [],
  });

  const byId = new Map<string, ReflectionNode>();
  const roots: ReflectionNode[] = [];
  for (const r of rows) byId.set(r.id, node(r));
  for (const r of rows) {
    const n = byId.get(r.id)!;
    if (r.parent_id && byId.has(r.parent_id)) {
      byId.get(r.parent_id)!.replies.push(n);
    } else {
      roots.push(n);
    }
  }
  return roots;
}
