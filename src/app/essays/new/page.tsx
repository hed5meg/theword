import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { getAnchorOptions } from "@/lib/data/pieces";
import { getEssayLinkTargets } from "@/lib/data/essays";
import { listThemes, getThemeNextOrders } from "@/lib/data/essay-themes";
import { EssayForm } from "@/components/EssayForm";
import { createEssay } from "@/lib/actions/essays";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "New essay" };

export default async function NewEssayPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getProfile();
  const isSteward = profile?.role === "steward" || profile?.role === "admin";
  if (!isSteward) redirect("/essays");

  const [options, themes, nextOrders, linkTargets, { error }] = await Promise.all([
    getAnchorOptions(),
    listThemes(),
    getThemeNextOrders(),
    getEssayLinkTargets(),
    searchParams,
  ]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      <nav className="ui mb-8 text-sm text-ink-faint">
        <Link href="/essays" className="transition-colors hover:text-ink-soft">
          ← Essays
        </Link>
      </nav>
      <header className="border-b border-line/70 pb-6">
        <p className="eyebrow">A new essay</p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight text-ink">Write an essay</h1>
      </header>
      <EssayForm
        action={createEssay}
        options={options}
        themes={themes.map((t) => t.title)}
        nextOrders={nextOrders}
        linkTargets={linkTargets}
        error={error}
        cancelHref="/essays"
      />
    </div>
  );
}
