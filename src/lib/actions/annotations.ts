"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

// Author annotations: the one who offered a rendering glosses a word/phrase of
// their own text. RLS enforces that only the rendering's author (or a steward)
// may write; these actions just carry the anchor and note through.

export async function createAnnotation(formData: FormData) {
  const path = String(formData.get("path") ?? "/");
  const renderingId = String(formData.get("rendering_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const quoted = String(formData.get("quoted_text") ?? "");
  const start = Number(formData.get("anchor_start") ?? 0);
  const end = Number(formData.get("anchor_end") ?? 0);

  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(path)}`);
  if (!note || !quoted || !renderingId) {
    revalidatePath(path);
    return;
  }

  await sb.from("rendering_annotations").insert({
    rendering_id: renderingId,
    author_id: user.id,
    quoted_text: quoted,
    anchor_start: start,
    anchor_end: end,
    context_prefix: String(formData.get("context_prefix") ?? ""),
    context_suffix: String(formData.get("context_suffix") ?? ""),
    note,
  });

  revalidatePath(path);
}

export async function updateAnnotation(formData: FormData) {
  const path = String(formData.get("path") ?? "/");
  const id = String(formData.get("annotation_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(path)}`);
  if (!id || !note) {
    revalidatePath(path);
    return;
  }

  await sb
    .from("rendering_annotations")
    .update({ note, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath(path);
}

export async function deleteAnnotation(formData: FormData) {
  const path = String(formData.get("path") ?? "/");
  const id = String(formData.get("annotation_id") ?? "");

  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(path)}`);
  if (!id) {
    revalidatePath(path);
    return;
  }

  await sb.from("rendering_annotations").delete().eq("id", id);
  revalidatePath(path);
}
