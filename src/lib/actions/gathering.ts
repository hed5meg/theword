"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Promote a Gathered Rendering for a passage — the relational, human act of
 * gathering. A steward either chooses an existing rendering or gathers a merged
 * version; either way the change is recorded in the passage's history. Nothing
 * is destroyed: the previous gathered rendering simply returns to the side.
 */
export async function promoteGathered(formData: FormData) {
  const passageId = String(formData.get("passage_id") ?? "");
  const renderingId = String(formData.get("rendering_id") ?? "");
  const mergedBody = String(formData.get("merged_body") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const path = String(formData.get("path") ?? "/");

  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(path)}`);

  // Steward gate (RLS also enforces this on the writes below).
  const { data: me } = await sb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!me || (me.role !== "steward" && me.role !== "admin")) {
    redirect(path);
  }

  // Resolve which rendering becomes gathered.
  let chosenId = renderingId;
  if (!chosenId && mergedBody) {
    const { data: created, error } = await sb
      .from("renderings")
      .insert({
        passage_id: passageId,
        author_id: user.id,
        author_name: "A gathered rendering",
        body: mergedBody,
        status: "gathered",
      })
      .select("id")
      .single();
    if (error || !created) redirect(`${path}?steward=error`);
    chosenId = created!.id;
  }
  if (!chosenId) redirect(`${path}?steward=error`);

  // Return the current gathered rendering to the side (never deleted).
  const { data: passage } = await sb
    .from("passages")
    .select("current_rendering_id")
    .eq("id", passageId)
    .maybeSingle();
  const previousId = passage?.current_rendering_id as string | null | undefined;
  if (previousId && previousId !== chosenId) {
    await sb.from("renderings").update({ status: "submitted" }).eq("id", previousId);
  }

  await sb.from("renderings").update({ status: "gathered" }).eq("id", chosenId);
  await sb.from("passages").update({ current_rendering_id: chosenId }).eq("id", passageId);
  await sb.from("gathered_history").insert({
    passage_id: passageId,
    rendering_id: chosenId,
    body: mergedBody || null,
    promoted_by: user.id,
    note: note || null,
  });

  revalidatePath(path);
  redirect(path);
}
