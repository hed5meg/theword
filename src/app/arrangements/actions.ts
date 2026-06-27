"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { slugify } from "@/lib/content/parse";
import type { BuilderItem } from "@/lib/data/arrangements";

interface IncomingState {
  slug?: string;
  title: string;
  description: string;
  tenetSlugs: string[];
  items: BuilderItem[];
}

export async function saveArrangement(formData: FormData) {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/signin?next=/arrangements/new");

  const status = String(formData.get("status") ?? "draft") === "published"
    ? "published"
    : "draft";
  let state: IncomingState;
  try {
    state = JSON.parse(String(formData.get("state") ?? "{}"));
  } catch {
    redirect("/arrangements/new?error=parse");
  }

  const title = (state!.title ?? "").trim();
  if (!title) redirect("/arrangements/new?error=title");

  const passageItems = state!.items.filter((i) => i.kind === "passage");
  const passageIds = passageItems.map((i) => i.passageId!).filter(Boolean);

  // Validate: every passage present exactly once.
  const { data: allP } = await sb.from("passages").select("id");
  const allIds = new Set((allP ?? []).map((p) => p.id as string));
  const uniqueIds = new Set(passageIds);
  const complete =
    uniqueIds.size === allIds.size &&
    passageIds.length === uniqueIds.size &&
    [...uniqueIds].every((id) => allIds.has(id));
  if (!complete) {
    redirect(
      `/arrangements/${state!.slug ?? "new"}${state!.slug ? "/edit" : ""}?error=incomplete`,
    );
  }

  // Resolve or create the arrangement row.
  let arrId: string;
  let slug: string;
  if (state!.slug) {
    const { data: existing } = await sb
      .from("arrangements")
      .select("id,slug,is_system")
      .eq("slug", state!.slug)
      .maybeSingle();
    if (!existing || existing.is_system) redirect("/arrangements?error=locked");
    arrId = existing!.id as string;
    slug = existing!.slug as string;
    await sb
      .from("arrangements")
      .update({ title, description: state!.description || null, status, updated_at: new Date().toISOString() })
      .eq("id", arrId);
  } else {
    // Unique slug from the title.
    const base = slugify(title) || `arrangement-${user.id.slice(0, 6)}`;
    slug = base;
    const { data: clash } = await sb.from("arrangements").select("id").eq("slug", slug).maybeSingle();
    if (clash) slug = `${base}-${user.id.slice(0, 6)}`;
    const { data: created, error } = await sb
      .from("arrangements")
      .insert({
        author_id: user.id,
        title,
        slug,
        description: state!.description || null,
        status,
        is_default: false,
        is_system: false,
      })
      .select("id")
      .single();
    if (error || !created) redirect("/arrangements/new?error=save");
    arrId = created!.id as string;
  }

  // Replace movements + entries.
  await sb.from("arrangement_entries").delete().eq("arrangement_id", arrId);
  await sb.from("arrangement_movements").delete().eq("arrangement_id", arrId);

  let movementOrder = 0;
  let entryOrder = 0;
  let currentMovementId: string | null = null;
  for (const item of state!.items) {
    if (item.kind === "movement") {
      const { data: mRow } = await sb
        .from("arrangement_movements")
        .insert({
          arrangement_id: arrId,
          title: (item.title ?? "Movement").trim() || "Movement",
          subtitle: item.subtitle?.trim() || null,
          order_index: movementOrder++,
        })
        .select("id")
        .single();
      currentMovementId = (mRow?.id as string) ?? null;
    } else if (item.passageId) {
      await sb.from("arrangement_entries").insert({
        arrangement_id: arrId,
        passage_id: item.passageId,
        order_index: entryOrder++,
        arrangement_movement_id: currentMovementId,
      });
    }
  }

  // Replace tenets.
  await sb.from("arrangement_tenets").delete().eq("arrangement_id", arrId);
  if (state!.tenetSlugs.length > 0) {
    const { data: trows } = await sb
      .from("tenets")
      .select("id,slug")
      .in("slug", state!.tenetSlugs);
    const links = (trows ?? []).map((t) => ({ arrangement_id: arrId, tenet_id: t.id }));
    if (links.length) await sb.from("arrangement_tenets").insert(links);
  }

  // Snapshot a version.
  await sb.from("arrangement_versions").insert({
    arrangement_id: arrId,
    snapshot: state! as unknown as Record<string, unknown>,
    edited_by: user.id,
    note: status === "published" ? "Published" : "Saved draft",
  });

  revalidatePath("/arrangements");
  revalidatePath(`/arrangements/${slug}`);
  redirect(`/arrangements/${slug}`);
}
