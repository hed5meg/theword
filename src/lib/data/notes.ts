import type { Note, NoteReply, InboxNote } from "@/lib/types";
import { createServerSupabase } from "@/lib/supabase/server";

// Notes are RLS-filtered to the viewer (writer, rendering author, steward), so we
// use the session client. Everything is graceful: if the table isn't there yet
// (migration not run) or the viewer can't see anything, we return empty.

const NOTE_SELECT =
  "id,rendering_id,quoted_text,anchor_start,anchor_end,context_prefix,context_suffix,body,suggested_wording,status,orphaned,created_at,author:profiles(handle,display_name),note_replies(id,body,created_at,author:profiles(handle,display_name))";

type ProfileRef = { handle: string; display_name: string } | null;
type Row = {
  id: string;
  rendering_id: string;
  quoted_text: string;
  anchor_start: number;
  anchor_end: number;
  context_prefix: string | null;
  context_suffix: string | null;
  body: string;
  suggested_wording: string | null;
  status: Note["status"];
  orphaned: boolean;
  created_at: string;
  author: ProfileRef;
  note_replies: {
    id: string;
    body: string;
    created_at: string;
    author: ProfileRef;
  }[];
};

function mapNote(r: Row): Note {
  const replies: NoteReply[] = (r.note_replies ?? [])
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((x) => ({
      id: x.id,
      authorName: x.author?.display_name ?? "A member",
      authorHandle: x.author?.handle,
      body: x.body,
      createdAt: x.created_at,
    }));
  return {
    id: r.id,
    renderingId: r.rendering_id,
    quotedText: r.quoted_text,
    anchorStart: r.anchor_start,
    anchorEnd: r.anchor_end,
    contextPrefix: r.context_prefix ?? "",
    contextSuffix: r.context_suffix ?? "",
    body: r.body,
    suggestedWording: r.suggested_wording ?? undefined,
    status: r.status,
    orphaned: r.orphaned,
    createdAt: r.created_at,
    authorName: r.author?.display_name ?? "A member",
    authorHandle: r.author?.handle,
    replies,
  };
}

/** Notes the viewer may see, grouped by rendering id. Empty for logged-out. */
export async function getNotesByRendering(
  renderingIds: string[],
): Promise<Map<string, Note[]>> {
  const out = new Map<string, Note[]>();
  if (renderingIds.length === 0) return out;
  try {
    const sb = await createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return out;
    const { data, error } = await sb
      .from("notes")
      .select(NOTE_SELECT)
      .in("rendering_id", renderingIds)
      .order("created_at", { ascending: true });
    if (error || !data) return out;
    for (const r of data as unknown as Row[]) {
      const n = mapNote(r);
      const list = out.get(n.renderingId) ?? [];
      list.push(n);
      out.set(n.renderingId, list);
    }
  } catch {
    // table missing / not signed in
  }
  return out;
}

/** How many notes the viewer can see (for the header indicator). */
export async function getNoteCount(): Promise<number> {
  try {
    const sb = await createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return 0;
    const { count } = await sb
      .from("notes")
      .select("id", { count: "exact", head: true })
      .neq("status", "archived");
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** The viewer's inbox: notes on their renderings (author) or all (steward). */
export async function getInboxNotes(): Promise<InboxNote[]> {
  try {
    const sb = await createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return [];
    const { data } = await sb
      .from("notes")
      .select(
        `${NOTE_SELECT},renderings!inner(author_name,passages!inner(slug,title,canonical_ref))`,
      )
      .order("created_at", { ascending: false });
    if (!data) return [];
    type IRow = Row & {
      renderings: {
        author_name: string | null;
        passages: { slug: string; title: string; canonical_ref: string };
      };
    };
    return (data as unknown as IRow[]).map((r) => ({
      ...mapNote(r),
      renderingAuthor: r.renderings.author_name ?? "A contributor",
      passageTitle: r.renderings.passages.title,
      passageHref: `/read/the-canonical-order/${r.renderings.passages.slug}`,
    }));
  } catch {
    return [];
  }
}
