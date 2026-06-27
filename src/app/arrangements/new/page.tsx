import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getArrangementEditState,
  getDefaultArrangementSlug,
} from "@/lib/data/arrangements";
import { getTenets } from "@/lib/data";
import { getUser } from "@/lib/auth";
import { ArrangementBuilder } from "@/components/ArrangementBuilder";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Begin an arrangement" };

export default async function NewArrangementPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/signin?next=/arrangements/new");

  const defaultSlug = await getDefaultArrangementSlug();
  const [base, tenets, { error }] = await Promise.all([
    getArrangementEditState(defaultSlug),
    getTenets(),
    searchParams,
  ]);

  return (
    <ArrangementBuilder
      initial={{
        slug: undefined,
        title: "",
        description: "",
        tenetSlugs: [],
        items: base?.items ?? [],
      }}
      allTenets={tenets.map((t) => ({ slug: t.slug, title: t.title }))}
      error={error}
    />
  );
}
