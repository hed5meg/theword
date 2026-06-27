"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { slugify } from "@/lib/content/parse";

export async function offerTenet(formData: FormData) {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/signin?next=/principles");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const support = String(formData.get("support") ?? "").trim();

  if (!title || !description) {
    redirect("/principles?error=required");
  }

  const base = slugify(title);
  const slug = base || `tenet-${user.id.slice(0, 6)}`;

  const insert = (s: string) =>
    sb.from("tenets").insert({
      slug: s,
      title,
      description,
      support: support || null,
      author_id: user.id,
    });

  let result = await insert(slug);
  if (result.error?.code === "23505") {
    result = await insert(`${slug}-${user.id.slice(0, 6)}`);
  }
  if (result.error) {
    redirect("/principles?error=save");
  }

  revalidatePath("/principles");
  redirect(`/principles/${slug}`);
}
