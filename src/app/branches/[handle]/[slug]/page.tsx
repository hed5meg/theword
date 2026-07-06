import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBranch } from "@/lib/data/branches";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}): Promise<Metadata> {
  const { handle, slug } = await params;
  const branch = await getBranch(handle, slug);
  if (!branch) return {};
  return {
    title: branch.name,
    description: `${branch.name} — a branch by ${branch.authorName}.`,
  };
}

export default async function BranchPage({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}) {
  const { handle, slug } = await params;
  const branch = await getBranch(handle, slug);
  if (!branch) notFound();

  const count = branch.entries.length;

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
      <nav className="ui mb-8 text-sm text-ink-faint">
        <Link
          href={`/members/${branch.authorHandle}`}
          className="transition-colors hover:text-ink-soft"
        >
          ← {branch.authorName}
        </Link>
      </nav>

      <header>
        <p className="eyebrow">A branch of the book</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink">
          {branch.name}
        </h1>
        <p className="ui mt-2 text-sm text-ink-faint">
          by{" "}
          <Link
            href={`/members/${branch.authorHandle}`}
            className="text-ink-soft transition-colors hover:text-ink"
          >
            {branch.authorName}
          </Link>{" "}
          · {count} {count === 1 ? "passage" : "passages"}
        </p>
        {branch.description && (
          <p className="mt-6 font-serif text-lg italic leading-relaxed text-ink-soft">
            {branch.description}
          </p>
        )}
      </header>

      <section className="mt-10">
        {count > 0 ? (
          <ul className="divide-y divide-line/70 overflow-hidden rounded-2xl border border-line bg-card/50">
            {branch.entries.map((e) => (
              <li key={e.passageSlug}>
                <Link
                  href={`/read/the-canonical-order/${e.passageSlug}?rendering=${e.renderingId}`}
                  className="flex items-baseline justify-between gap-4 px-5 py-4 transition-colors hover:bg-glow/50"
                >
                  <span className="flex flex-col">
                    <span className="font-serif text-lg text-ink">{e.passageTitle}</span>
                    <span className="ui text-xs uppercase tracking-wider text-ink-faint">
                      {e.canonicalRef}
                    </span>
                  </span>
                  {e.isGathered && (
                    <span className="ui shrink-0 rounded-full bg-glow px-2.5 py-1 text-xs text-gold">
                      Gathered
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-line bg-card/40 p-6 text-ink-soft">
            This branch has no passages yet.
          </p>
        )}
      </section>
    </div>
  );
}
