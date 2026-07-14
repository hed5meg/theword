import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { getEssayForEdit } from "@/lib/data/essays";
import { getAnchorOptions } from "@/lib/data/pieces";
import { listThemes } from "@/lib/data/essay-themes";
import { EssayForm } from "@/components/EssayForm";
import { updateEssay } from "@/lib/actions/essays";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit essay" };

export default async function EditEssayPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const profile = await getProfile();
  const isSteward = profile?.role === "steward" || profile?.role === "admin";
  if (!isSteward) redirect(`/essays/${slug}`);

  const [editing, options, themes, { error }] = await Promise.all([
    getEssayForEdit(slug),
    getAnchorOptions(),
    listThemes(),
    searchParams,
  ]);
  if (!editing) notFound();

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      <nav className="ui mb-8 text-sm text-ink-faint">
        <Link href={`/essays/${slug}`} className="transition-colors hover:text-ink-soft">
          ← Back to the essay
        </Link>
      </nav>
      <header className="border-b border-line/70 pb-6">
        <p className="eyebrow">Edit essay</p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight text-ink">{editing.title}</h1>
      </header>
      <EssayForm
        action={updateEssay}
        editing={editing}
        options={options}
        themes={themes.map((t) => t.title)}
        error={error}
        cancelHref={`/essays/${slug}`}
      />
    </div>
  );
}
