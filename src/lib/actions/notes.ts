"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";
import { notify } from "@/lib/email";

/** Ensure a rendering has a baseline version row; return its id (for provenance). */
async function ensureRenderingVersion(
  sb: SupabaseClient,
  renderingId: string,
): Promise<string | null> {
  const { data: existing } = await sb
    .from("rendering_versions")
    .select("id")
    .eq("rendering_id", renderingId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return existing.id as string;
  const { data: r } = await sb
    .from("renderings")
    .select("body")
    .eq("id", renderingId)
    .maybeSingle();
  const { data: created } = await sb
    .from("rendering_versions")
    .insert({ rendering_id: renderingId, body: r?.body ?? "", note: "baseline" })
    .select("id")
    .single();
  return (created?.id as string) ?? null;
}

export async function createNote(formData: FormData) {
  const path = String(formData.get("path") ?? "/");
  const renderingId = String(formData.get("rendering_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const suggested = String(formData.get("suggested_wording") ?? "").trim();
  const quoted = String(formData.get("quoted_text") ?? "");
  const start = Number(formData.get("anchor_start") ?? 0);
  const end = Number(formData.get("anchor_end") ?? 0);

  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(path)}`);
  if (!body || !quoted || !renderingId) {
    revalidatePath(path);
    return;
  }

  const versionId = await ensureRenderingVersion(sb, renderingId);
  const { error } = await sb.from("notes").insert({
    rendering_id: renderingId,
    rendering_version_id: versionId,
    author_id: user.id,
    quoted_text: quoted,
    anchor_start: start,
    anchor_end: end,
    context_prefix: String(formData.get("context_prefix") ?? ""),
    context_suffix: String(formData.get("context_suffix") ?? ""),
    body,
    suggested_wording: suggested || null,
  });
  if (error) {
    revalidatePath(path);
    return;
  }

  // Notify the rendering's author (gentle, opt-out honored in notify()).
  const { data: r } = await sb
    .from("renderings")
    .select("author_id")
    .eq("id", renderingId)
    .maybeSingle();
  await notify(
    r?.author_id as string | null,
    "A gentle note on your rendering",
    `Someone left a note on a rendering you offered:\n\n"${quoted.slice(0, 140)}"\n\n${body}`,
    path,
  );

  revalidatePath(path);
}

export async function addNoteReply(formData: FormData) {
  const path = String(formData.get("path") ?? "/");
  const noteId = String(formData.get("note_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(path)}`);
  if (!body || !noteId) {
    revalidatePath(path);
    return;
  }

  await sb.from("note_replies").insert({ note_id: noteId, author_id: user.id, body });

  // Notify the note's writer and the rendering's author (except the replier).
  const { data: note } = await sb
    .from("notes")
    .select("author_id,rendering_id,renderings(author_id)")
    .eq("id", noteId)
    .maybeSingle();
  if (note) {
    const targets = new Set<string>();
    if (note.author_id) targets.add(note.author_id as string);
    const ra = (note.renderings as unknown as { author_id: string | null } | null)
      ?.author_id;
    if (ra) targets.add(ra);
    targets.delete(user.id);
    for (const id of targets) {
      await notify(id, "A reply to a note", body, path);
    }
  }

  revalidatePath(path);
}

export async function setNoteStatus(formData: FormData) {
  const path = String(formData.get("path") ?? "/");
  const noteId = String(formData.get("note_id") ?? "");
  const status = String(formData.get("status") ?? "open");

  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(path)}`);

  await sb
    .from("notes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", noteId);

  if (status === "addressed" || status === "archived") {
    const { data: note } = await sb
      .from("notes")
      .select("author_id")
      .eq("id", noteId)
      .maybeSingle();
    await notify(
      note?.author_id as string | null,
      "Your note was tended",
      status === "addressed"
        ? "The one who offered the rendering has addressed your note. Thank you for helping it grow clearer."
        : "Your note has been gently set aside, with thanks — it was kept, and it helped.",
      path,
    );
  }

  revalidatePath(path);
}
