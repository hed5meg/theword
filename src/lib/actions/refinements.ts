"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { notify } from "@/lib/email";
import { ensureRenderingVersion } from "@/lib/versions";
import { reAnchor } from "@/lib/anchor";
import { idemKey } from "@/lib/idempotency";

export async function createRefinement(formData: FormData) {
  const path = String(formData.get("path") ?? "/");
  const renderingId = String(formData.get("rendering_id") ?? "");
  const replacement = String(formData.get("replacement_text") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const quoted = String(formData.get("quoted_text") ?? "");
  const start = Number(formData.get("anchor_start") ?? 0);
  const end = Number(formData.get("anchor_end") ?? 0);
  const tenetSlugs = formData.getAll("tenets").map(String).filter(Boolean);

  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(path)}`);
  if (!replacement || !quoted || !renderingId) {
    revalidatePath(path);
    return;
  }

  const baseVersion = await ensureRenderingVersion(sb, renderingId);
  const { data: rf, error } = await sb
    .from("refinements")
    .insert({
      rendering_id: renderingId,
      base_rendering_version_id: baseVersion,
      proposer_id: user.id,
      reason: reason || null,
      idempotency_key: idemKey(formData),
    })
    .select("id")
    .maybeSingle();
  if (error || !rf) {
    // Duplicate submission (unique-violation) or a real failure — either way,
    // don't create a second refinement or its child change.
    revalidatePath(path);
    return;
  }
  await sb.from("refinement_changes").insert({
    refinement_id: rf.id,
    anchor_start: start,
    anchor_end: end,
    quoted_text: quoted,
    context_prefix: String(formData.get("context_prefix") ?? ""),
    context_suffix: String(formData.get("context_suffix") ?? ""),
    replacement_text: replacement,
  });
  if (tenetSlugs.length > 0) {
    const { data: trows } = await sb.from("tenets").select("id,slug").in("slug", tenetSlugs);
    const links = (trows ?? []).map((t) => ({ refinement_id: rf.id, tenet_id: t.id }));
    if (links.length) await sb.from("refinement_tenets").insert(links);
  }

  const { data: r } = await sb
    .from("renderings")
    .select("author_id")
    .eq("id", renderingId)
    .maybeSingle();
  await notify(
    r?.author_id as string | null,
    "A refinement was offered to your rendering",
    `Someone offered a refinement:\n\nCurrently: "${quoted.slice(0, 120)}"\nProposed: "${replacement.slice(0, 120)}"\n\n${reason}`,
    "/refinements",
  );

  revalidatePath(path);
  redirect("/refinements");
}

async function closeRefinementIfResolved(
  sb: Awaited<ReturnType<typeof createServerSupabase>>,
  refinementId: string,
) {
  const { data: changes } = await sb
    .from("refinement_changes")
    .select("change_status")
    .eq("refinement_id", refinementId);
  const list = changes ?? [];
  const open = list.filter((c) => c.change_status === "open" || c.change_status === "stale");
  if (open.length > 0) return;
  const anyGathered = list.some((c) => c.change_status === "gathered_in");
  await sb
    .from("refinements")
    .update({
      status: anyGathered ? "gathered_in" : "set_aside",
      updated_at: new Date().toISOString(),
    })
    .eq("id", refinementId);
}

export async function gatherInChange(formData: FormData) {
  const path = String(formData.get("path") ?? "/refinements");
  const changeId = String(formData.get("change_id") ?? "");
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/signin?next=/refinements");

  const { data: change } = await sb
    .from("refinement_changes")
    .select(
      "id,anchor_start,anchor_end,quoted_text,context_prefix,context_suffix,replacement_text,refinement_id,refinements(rendering_id,proposer_id)",
    )
    .eq("id", changeId)
    .maybeSingle();
  if (!change) {
    revalidatePath(path);
    return;
  }
  const ref = change.refinements as unknown as {
    rendering_id: string;
    proposer_id: string;
  };

  const { data: rendering } = await sb
    .from("renderings")
    .select("id,body")
    .eq("id", ref.rendering_id)
    .maybeSingle();
  const body = (rendering?.body as string) ?? "";

  const at = reAnchor(body, {
    anchorStart: change.anchor_start,
    anchorEnd: change.anchor_end,
    quotedText: change.quoted_text,
    contextPrefix: change.context_prefix ?? "",
    contextSuffix: change.context_suffix ?? "",
  });
  if (!at) {
    // The base text moved — cannot apply cleanly.
    await sb.from("refinement_changes").update({ change_status: "stale" }).eq("id", changeId);
    revalidatePath(path);
    return;
  }

  const newBody = body.slice(0, at.start) + change.replacement_text + body.slice(at.end);

  // Credit the refiner with a cross-pollination metaphor in the version note.
  const { data: proposer } = await sb
    .from("profiles")
    .select("display_name")
    .eq("id", ref.proposer_id)
    .maybeSingle();
  const credit = `Cross-pollinated by ${proposer?.display_name ?? "another hand"}`;

  await sb.from("rendering_versions").insert({
    rendering_id: ref.rendering_id,
    body: newBody,
    edited_by: user.id,
    note: credit,
  });
  await sb
    .from("renderings")
    .update({ body: newBody, updated_at: new Date().toISOString() })
    .eq("id", ref.rendering_id);
  await sb.from("refinement_changes").update({ change_status: "gathered_in" }).eq("id", changeId);

  // If this rendering is its passage's gathered one, record the gathering (best-effort).
  const { data: passage } = await sb
    .from("passages")
    .select("id")
    .eq("current_rendering_id", ref.rendering_id)
    .maybeSingle();
  if (passage) {
    await sb
      .from("gathered_history")
      .insert({ passage_id: passage.id, rendering_id: ref.rendering_id, note: credit });
  }

  await closeRefinementIfResolved(sb, change.refinement_id);
  await notify(
    ref.proposer_id,
    "Your refinement was gathered in",
    "Gathered in — your wording was cross-pollinated into the rendering. Thank you for helping it come through more clearly.",
    "/refinements",
  );
  revalidatePath(path);
}

export async function setAsideChange(formData: FormData) {
  const path = String(formData.get("path") ?? "/refinements");
  const changeId = String(formData.get("change_id") ?? "");
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/signin?next=/refinements");

  const { data: change } = await sb
    .from("refinement_changes")
    .select("refinement_id,refinements(proposer_id)")
    .eq("id", changeId)
    .maybeSingle();
  await sb.from("refinement_changes").update({ change_status: "set_aside" }).eq("id", changeId);
  if (change) {
    await closeRefinementIfResolved(sb, change.refinement_id);
    const proposerId = (change.refinements as unknown as { proposer_id: string })?.proposer_id;
    await notify(
      proposerId,
      "Your refinement was set aside, with thanks",
      "Set aside with thanks — your offering is kept, and it helped.",
      "/refinements",
    );
  }
  revalidatePath(path);
}

export async function withdrawRefinement(formData: FormData) {
  const path = String(formData.get("path") ?? "/refinements");
  const refinementId = String(formData.get("refinement_id") ?? "");
  const sb = await createServerSupabase();
  await sb
    .from("refinements")
    .update({ status: "withdrawn", updated_at: new Date().toISOString() })
    .eq("id", refinementId);
  revalidatePath(path);
}

export async function addRefinementReply(formData: FormData) {
  const path = String(formData.get("path") ?? "/refinements");
  const refinementId = String(formData.get("refinement_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/signin?next=/refinements");
  if (!body) {
    revalidatePath(path);
    return;
  }
  await sb.from("refinement_replies").insert({
    refinement_id: refinementId,
    author_id: user.id,
    body,
    idempotency_key: idemKey(formData),
  });
  revalidatePath(path);
}

export async function promoteNoteToRefinement(formData: FormData) {
  const path = String(formData.get("path") ?? "/");
  const noteId = String(formData.get("note_id") ?? "");
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(path)}`);

  const { data: note } = await sb
    .from("notes")
    .select(
      "rendering_id,anchor_start,anchor_end,quoted_text,context_prefix,context_suffix,suggested_wording,body",
    )
    .eq("id", noteId)
    .maybeSingle();
  if (!note || !note.suggested_wording) {
    revalidatePath(path);
    return;
  }
  const baseVersion = await ensureRenderingVersion(sb, note.rendering_id as string);
  const { data: rf } = await sb
    .from("refinements")
    .insert({
      rendering_id: note.rendering_id,
      base_rendering_version_id: baseVersion,
      proposer_id: user.id,
      reason: note.body,
      idempotency_key: idemKey(formData),
    })
    .select("id")
    .maybeSingle();
  if (rf) {
    await sb.from("refinement_changes").insert({
      refinement_id: rf.id,
      anchor_start: note.anchor_start,
      anchor_end: note.anchor_end,
      quoted_text: note.quoted_text,
      context_prefix: note.context_prefix,
      context_suffix: note.context_suffix,
      replacement_text: note.suggested_wording,
    });
  }
  redirect("/refinements");
}
