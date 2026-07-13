import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEssay } from "@/lib/data/essays";
import { getProfile } from "@/lib/auth";
import { getMyResonatedIds } from "@/lib/resonance";
import { getReflections } from "@/lib/data/reflections";
import { Prose } from "@/components/Prose";
import { ResonanceControl } from "@/components/ResonanceControl";
import { FlagControl } from "@/components/FlagControl";
import { Reflections } from "@/components/Reflections";
import { deleteEssay } from "@/lib/actions/essays";
import { AnchorTags } from "@/components/AnchorTags";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const essay = await getEssay(slug);
  if (!essay) return {};
  return { title: essay.title, description: essay.dek };
}

function fmt(iso?: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default async function EssayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const essay = await getEssay(slug);
  if (!essay) notFound();

  const profile = await getProfile();
  const signedIn = Boolean(profile);
  const isSteward = profile?.role === "steward" || profile?.role === "admin";
  const path = `/essays/${slug}`;

  const [resonated, reflections] = await Promise.all([
    getMyResonatedIds("essay", [essay.id]),
    getReflections("essay", essay.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
      <nav className="ui mb-8 flex items-center justify-between gap-4 text-sm text-ink-faint">
        <Link href="/essays" className="transition-colors hover:text-ink-soft">
          ← Essays
        </Link>
        {isSteward && (
          <span className="flex items-center gap-4">
            <Link href={`/essays/${slug}/edit`} className="text-gold hover:text-ink">
              Edit
            </Link>
            <form action={deleteEssay}>
              <input type="hidden" name="id" value={essay.id} />
              <input type="hidden" name="slug" value={slug} />
              <button
                type="submit"
                className="text-ink-faint transition-colors hover:text-red-700"
              >
                Delete
              </button>
            </form>
          </span>
        )}
      </nav>

      <header>
        {essay.status === "draft" && (
          <span className="ui mb-3 inline-block rounded-full border border-line px-2.5 py-0.5 text-xs text-ink-faint">
            Draft
          </span>
        )}
        <h1 className="font-serif text-4xl leading-tight tracking-tight text-ink">
          {essay.title}
        </h1>
        {essay.dek && (
          <p className="mt-3 font-serif text-xl italic leading-relaxed text-ink-soft">
            {essay.dek}
          </p>
        )}
        <p className="ui mt-4 text-sm text-ink-faint">
          {essay.byline ?? essay.authorName}
          {essay.publishedAt ? ` · ${fmt(essay.publishedAt)}` : ""}
        </p>
        <AnchorTags anchor={essay.anchor} className="mt-4" />
      </header>

      <div className="mt-8">
        <Prose>{essay.body}</Prose>
      </div>

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-5">
        <ResonanceControl
          targetType="essay"
          targetId={essay.id}
          count={essay.resonanceCount}
          active={resonated.has(essay.id)}
          signedIn={signedIn}
          path={path}
          noun="this essay"
        />
        <FlagControl targetType="essay" targetId={essay.id} path={path} signedIn={signedIn} />
      </footer>

      <Reflections
        targetType="essay"
        targetId={essay.id}
        path={path}
        signedIn={signedIn}
        reflections={reflections}
      />
    </div>
  );
}
