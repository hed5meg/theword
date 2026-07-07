import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBranch } from "@/lib/data/branches";
import { getProfile } from "@/lib/auth";
import { renameBranch } from "@/lib/actions/branches";
import { IdempotencyField } from "@/components/IdempotencyField";
import { SubmitButton } from "@/components/SubmitButton";

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
  const [branch, viewer] = await Promise.all([getBranch(handle, slug), getProfile()]);
  if (!branch) notFound();

  const count = branch.entries.length;
  const isOwner = viewer?.handle === branch.authorHandle;
  const path = `/branches/${branch.authorHandle}/${branch.slug}`;

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

        {isOwner && (
          <details className="ui group mt-6">
            <summary className="cursor-pointer list-none text-sm text-gold transition-colors hover:text-ink">
              Rename this branch
            </summary>
            <form action={renameBranch} className="mt-4 space-y-3">
              <IdempotencyField />
              <input type="hidden" name="branch_slug" value={branch.slug} />
              <input type="hidden" name="path" value={path} />
              <div>
                <label htmlFor="name" className="block text-xs text-ink-soft">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  defaultValue={branch.name}
                  className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-2 text-ink outline-none focus:border-gold-soft"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-xs text-ink-soft">
                  Description <span className="text-ink-faint">(optional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  defaultValue={branch.description}
                  placeholder="What this branch reads for…"
                  className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-2 text-ink outline-none focus:border-gold-soft"
                />
              </div>
              <p className="text-xs text-ink-faint">
                The link stays the same when you rename — only the name changes.
              </p>
              <SubmitButton
                pendingLabel="Saving…"
                className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-parchment hover:opacity-90"
              >
                Save
              </SubmitButton>
            </form>
          </details>
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
