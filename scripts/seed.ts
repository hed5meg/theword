/**
 * Seed Supabase with the gathered book.
 *
 *   npm run seed
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local,
 * then upserts the founding tenets, movements, passages, and both renderings of
 * each passage (the fuller telling promoted as the initial Gathered Rendering,
 * "A Vision" held beside it). Idempotent: safe to run again.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createAdminClient } from "@/lib/supabase/admin";
import { buildBook, buildTenets } from "@/lib/content/seed";

async function main() {
  const db = createAdminClient();

  // 1. Tenets ---------------------------------------------------------------
  const tenets = await buildTenets();
  const { data: tenetRows, error: tenetErr } = await db
    .from("tenets")
    .upsert(
      tenets.map((t) => ({
        slug: t.slug,
        title: t.title,
        description: t.description,
        support: t.support,
        group: t.group ?? null,
      })),
      { onConflict: "slug" },
    )
    .select("id, slug");
  if (tenetErr) throw tenetErr;
  const tenetId = new Map(tenetRows!.map((r) => [r.slug, r.id as string]));
  console.log(`✦ ${tenetRows!.length} tenets`);

  // 2. Movements ------------------------------------------------------------
  const book = await buildBook();
  const { data: movementRows, error: movementErr } = await db
    .from("movements")
    .upsert(
      book.map((m) => ({
        slug: m.slug,
        title: m.title,
        summary: m.summary,
        order_index: m.orderIndex,
      })),
      { onConflict: "slug" },
    )
    .select("id, slug");
  if (movementErr) throw movementErr;
  const movementId = new Map(movementRows!.map((r) => [r.slug, r.id as string]));
  console.log(`✦ ${movementRows!.length} movements`);

  // 3. Passages + renderings ------------------------------------------------
  let passageCount = 0;
  let renderingCount = 0;

  for (const movement of book) {
    for (const passage of movement.passages) {
      const mId = movementId.get(movement.slug)!;

      const { data: passageRow, error: pErr } = await db
        .from("passages")
        .upsert(
          {
            movement_id: mId,
            slug: passage.slug,
            canonical_ref: passage.canonicalRef,
            title: passage.title,
            order_index: passage.orderIndex,
            traditional_text: passage.traditionalText ?? null,
          },
          { onConflict: "movement_id,slug" },
        )
        .select("id")
        .single();
      if (pErr) throw pErr;
      const pId = passageRow!.id as string;
      passageCount++;

      // Re-seed renderings cleanly so reruns stay idempotent.
      await db.from("passages").update({ current_rendering_id: null }).eq("id", pId);
      await db.from("renderings").delete().eq("passage_id", pId);

      let gatheredId: string | null = null;
      for (const r of passage.renderings) {
        const { data: rRow, error: rErr } = await db
          .from("renderings")
          .insert({
            passage_id: pId,
            author_name: r.author,
            body: r.body,
            language: r.language,
            tradition: r.tradition ?? null,
            status: r.status,
          })
          .select("id")
          .single();
        if (rErr) throw rErr;
        const rId = rRow!.id as string;
        renderingCount++;
        if (r.isGathered) gatheredId = rId;

        if (r.tenets.length > 0) {
          const links = r.tenets
            .map((t) => tenetId.get(t.slug))
            .filter((id): id is string => Boolean(id))
            .map((tid) => ({ rendering_id: rId, tenet_id: tid }));
          if (links.length > 0) {
            const { error: linkErr } = await db.from("rendering_tenets").insert(links);
            if (linkErr) throw linkErr;
          }
        }
      }

      if (gatheredId) {
        await db.from("passages").update({ current_rendering_id: gatheredId }).eq("id", pId);
        const { error: histErr } = await db.from("gathered_history").insert({
          passage_id: pId,
          rendering_id: gatheredId,
          note: "Seeded as the initial Gathered Rendering — gently revisable.",
        });
        if (histErr) throw histErr;
      }
    }
  }

  console.log(`✦ ${passageCount} passages, ${renderingCount} renderings`);
  console.log("\nThe gathering is seeded. Nothing is final.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
