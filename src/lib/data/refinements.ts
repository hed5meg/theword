import type { RefinementView, RefinementChangeView } from "@/lib/types";
import { createServerSupabase } from "@/lib/supabase/server";
import { reAnchor } from "@/lib/anchor";

const SELECT =
  "id,status,reason,created_at,proposer:profiles(id,handle,display_name)," +
  "refinement_changes(id,anchor_start,anchor_end,quoted_text,context_prefix,context_suffix,replacement_text,change_status)," +
  "refinement_tenets(tenets(title))," +
  "refinement_replies(id,body,created_at,author:profiles(display_name))," +
  "renderings!inner(body,author_id,passages!inner(slug,title))";

type ProfileRef = { id?: string; handle?: string; display_name: string } | null;

/** Refinements the viewer can see (proposer, rendering author, or steward). */
export async function getRefinementInbox(): Promise<RefinementView[]> {
  try {
    const sb = await createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return [];
    const { data: me } = await sb
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const isSteward = me?.role === "steward" || me?.role === "admin";

    const { data } = await sb
      .from("refinements")
      .select(SELECT)
      .order("created_at", { ascending: false });
    if (!data) return [];

    type Row = {
      id: string;
      status: RefinementView["status"];
      reason: string | null;
      created_at: string;
      proposer: ProfileRef;
      refinement_changes: {
        id: string;
        anchor_start: number;
        anchor_end: number;
        quoted_text: string;
        context_prefix: string | null;
        context_suffix: string | null;
        replacement_text: string;
        change_status: RefinementChangeView["status"];
      }[];
      refinement_tenets: { tenets: { title: string } }[];
      refinement_replies: { id: string; body: string; author: ProfileRef }[];
      renderings: {
        body: string;
        author_id: string | null;
        passages: { slug: string; title: string };
      };
    };

    return (data as unknown as Row[]).map((r) => {
      const body = r.renderings.body ?? "";
      const changes: RefinementChangeView[] = r.refinement_changes.map((c) => {
        const at = reAnchor(body, {
          anchorStart: c.anchor_start,
          anchorEnd: c.anchor_end,
          quotedText: c.quoted_text,
          contextPrefix: c.context_prefix ?? "",
          contextSuffix: c.context_suffix ?? "",
        });
        const stale = c.change_status === "open" && !at;
        return {
          id: c.id,
          quotedText: c.quoted_text,
          replacementText: c.replacement_text,
          currently: at ? body.slice(at.start, at.end) : null,
          stale,
          status: stale ? "stale" : c.change_status,
        };
      });
      return {
        id: r.id,
        status: r.status,
        reason: r.reason ?? undefined,
        proposerName: r.proposer?.display_name ?? "A member",
        proposerHandle: r.proposer?.handle,
        createdAt: r.created_at,
        passageTitle: r.renderings.passages.title,
        passageHref: `/read/the-canonical-order/${r.renderings.passages.slug}`,
        renderingAuthor: "—",
        changes,
        tenetTitles: r.refinement_tenets.map((t) => t.tenets.title),
        replies: (r.refinement_replies ?? [])
          .sort((a, b) => a.id.localeCompare(b.id))
          .map((x) => ({
            id: x.id,
            authorName: x.author?.display_name ?? "A member",
            body: x.body,
          })),
        canManage: isSteward || r.renderings.author_id === user.id,
        isProposer: r.proposer?.id === user.id,
      };
    });
  } catch {
    return [];
  }
}

/** Count of open refinements visible to the viewer (header indicator). */
export async function getRefinementCount(): Promise<number> {
  try {
    const sb = await createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return 0;
    const { count } = await sb
      .from("refinements")
      .select("id", { count: "exact", head: true })
      .eq("status", "open");
    return count ?? 0;
  } catch {
    return 0;
  }
}
