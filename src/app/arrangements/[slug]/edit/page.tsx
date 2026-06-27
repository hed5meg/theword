import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  getArrangementEditState,
  getArrangementView,
} from "@/lib/data/arrangements";
import { getTenets } from "@/lib/data";
import { getProfile } from "@/lib/auth";
import { ArrangementBuilder } from "@/components/ArrangementBuilder";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit arrangement" };

export default async function EditArrangementPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const profile = await getProfile();
  if (!profile) redirect(`/signin?next=/arrangements/${slug}/edit`);

  const [state, view, tenets, { error }] = await Promise.all([
    getArrangementEditState(slug),
    getArrangementView(slug),
    getTenets(),
    searchParams,
  ]);
  if (!state || !view) notFound();

  const isSteward = profile.role === "steward" || profile.role === "admin";
  const canEdit =
    !view.meta.isSystem &&
    (profile.handle === view.meta.authorHandle || isSteward);
  if (!canEdit) redirect(`/arrangements/${slug}`);

  return (
    <ArrangementBuilder
      initial={state}
      allTenets={tenets.map((t) => ({ slug: t.slug, title: t.title }))}
      error={error}
    />
  );
}
