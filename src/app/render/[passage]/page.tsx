import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPassageRef } from "@/lib/data/passage-ref";
import { getTenets } from "@/lib/data";
import { getBranchesByAuthor } from "@/lib/data/branches";
import { getUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { IdempotencyField } from "@/components/IdempotencyField";
import { SubmitButton } from "@/components/SubmitButton";
import { createRendering, updateRendering } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Offer a branch" };

interface Editing {
  id: string;
  body: string;
  language: string;
  tradition: string;
  branchName: string;
  tenetSlugs: Set<string>;
}

export default async function RenderPage({
  params,
  searchParams,
}: {
  params: Promise<{ passage: string }>;
  searchParams: Promise<{
    error?: string;
    arr?: string;
    entry?: string;
    edit?: string;
  }>;
}) {
  const { passage: passageSlug } = await params;
  const passage = await getPassageRef(passageSlug);
  if (!passage) notFound();

  const user = await getUser();
  if (!user) redirect(`/signin?next=/render/${passageSlug}`);

  const [tenets, myBranches, { error, arr, entry, edit }] = await Promise.all([
    getTenets(),
    getBranchesByAuthor(user.id),
    searchParams,
  ]);
  const backArr = arr || "the-love-ordered-arrangement";
  const backEntry = entry || passage.slug;
  const backTo = `/read/${backArr}/${backEntry}`;

  // Edit mode: load one's own rendering to pre-fill. Only the author may edit.
  let editing: Editing | null = null;
  if (edit) {
    const sb = await createServerSupabase();
    const { data } = await sb
      .from("renderings")
      .select(
        "id,author_id,body,language,tradition,branch:branches(name),rendering_tenets(tenets(slug))",
      )
      .eq("id", edit)
      .maybeSingle();
    type EditRow = {
      id: string;
      author_id: string;
      body: string;
      language: string;
      tradition: string | null;
      branch: { name: string } | null;
      rendering_tenets: { tenets: { slug: string } | null }[];
    };
    const row = data as unknown as EditRow | null;
    if (!row || row.author_id !== user.id) redirect(backTo);
    editing = {
      id: row.id,
      body: row.body,
      language: row.language,
      tradition: row.tradition ?? "",
      branchName: row.branch?.name ?? "",
      tenetSlugs: new Set(
        (row.rendering_tenets ?? [])
          .map((rt) => rt.tenets?.slug)
          .filter((s): s is string => Boolean(s)),
      ),
    };
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      <nav className="ui mb-8 flex items-center gap-2 text-sm text-ink-faint">
        <Link href={backTo} className="transition-colors hover:text-ink-soft">
          ← Back to the passage
        </Link>
      </nav>

      <header className="border-b border-line/70 pb-6">
        <p className="eyebrow">
          {editing ? "Edit your branch" : "Offer a branch"} · {passage.canonicalRef}
        </p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight text-ink">
          {passage.title}
        </h1>
        <p className="mt-2 text-ink-soft">
          {editing
            ? "Refine your words. The previous version is kept in history, and nothing is lost."
            : "Write this passage in your own plain, pure words. It will sit beside the others, held gently — never ranked."}
        </p>
      </header>

      {passage.traditionalText && (
        <details className="group mt-6 rounded-2xl border border-line bg-parchment-deep/40 px-5 py-4">
          <summary className="ui cursor-pointer list-none text-sm uppercase tracking-wider text-ink-faint">
            The traditional text, for grounding
          </summary>
          <p className="prose-traditional mt-3">{passage.traditionalText}</p>
        </details>
      )}

      <form
        action={editing ? updateRendering : createRendering}
        className="ui mt-8 space-y-6"
      >
        <IdempotencyField />
        <input type="hidden" name="passage_id" value={passage.id} />
        <input type="hidden" name="passage_slug" value={passage.slug} />
        <input type="hidden" name="back_arr" value={backArr} />
        <input type="hidden" name="back_entry" value={backEntry} />
        {editing && <input type="hidden" name="rendering_id" value={editing.id} />}

        {error === "required" && (
          <p className="text-sm text-red-700">
            Please write a branch before {editing ? "saving" : "offering"} it.
          </p>
        )}
        {error === "save" && (
          <p className="text-sm text-red-700">Something went wrong. Please try again.</p>
        )}

        <div>
          <label htmlFor="body" className="block text-sm text-ink-soft">
            Your branch
          </label>
          <textarea
            id="body"
            name="body"
            required
            rows={12}
            defaultValue={editing?.body}
            placeholder="Tell this passage as plainly and as lovingly as you can…"
            className="mt-1.5 w-full rounded-xl border border-line bg-card px-4 py-3 font-serif text-lg leading-relaxed text-ink outline-none focus:border-gold-soft"
          />
          <p className="mt-1 text-xs text-ink-faint">Markdown is welcome.</p>
        </div>

        <div>
          <label htmlFor="branch_name" className="block text-sm text-ink-soft">
            Name this branch <span className="text-ink-faint">(optional)</span>
          </label>
          <input
            id="branch_name"
            name="branch_name"
            list="my-branches"
            defaultValue={editing?.branchName}
            placeholder="e.g. Love Anchored"
            autoComplete="off"
            className="mt-1.5 w-full rounded-xl border border-line bg-card px-4 py-3 text-ink outline-none focus:border-gold-soft"
          />
          {myBranches.length > 0 && (
            <datalist id="my-branches">
              {myBranches.map((b) => (
                <option key={b.slug} value={b.name} />
              ))}
            </datalist>
          )}
          <p className="mt-1 text-xs text-ink-faint">
            Give a branch a name to gather your renderings across passages under it
            — reuse the same name wherever it belongs. Left blank, it&rsquo;s shown
            under your name.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="language" className="block text-sm text-ink-soft">
              Language
            </label>
            <input
              id="language"
              name="language"
              defaultValue={editing?.language ?? "English"}
              className="mt-1.5 w-full rounded-xl border border-line bg-card px-4 py-3 text-ink outline-none focus:border-gold-soft"
            />
          </div>
          <div>
            <label htmlFor="tradition" className="block text-sm text-ink-soft">
              Tradition <span className="text-ink-faint">(optional)</span>
            </label>
            <input
              id="tradition"
              name="tradition"
              defaultValue={editing?.tradition}
              placeholder="The wisdom you bring"
              className="mt-1.5 w-full rounded-xl border border-line bg-card px-4 py-3 text-ink outline-none focus:border-gold-soft"
            />
          </div>
        </div>

        <fieldset>
          <legend className="block text-sm text-ink-soft">
            The principles you read through{" "}
            <span className="text-ink-faint">(optional)</span>
          </legend>
          <div className="mt-3 grid max-h-72 grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-line bg-card/50 p-4 sm:grid-cols-2">
            {tenets.map((t) => (
              <label key={t.slug} className="flex items-start gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  name="tenets"
                  value={t.slug}
                  defaultChecked={editing?.tenetSlugs.has(t.slug)}
                  className="mt-1 accent-[var(--color-gold)]"
                />
                <span>{t.title}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-faint">
            New to the principles?{" "}
            <Link href="/principles" className="text-gold underline-offset-2 hover:underline">
              Read the library
            </Link>
            .
          </p>
        </fieldset>

        <div className="flex items-center gap-3">
          <SubmitButton
            pendingLabel={editing ? "Saving…" : "Offering…"}
            className="rounded-full bg-ink px-7 py-3 text-sm font-medium text-parchment transition-opacity hover:opacity-90"
          >
            {editing ? "Save changes" : "Offer this branch"}
          </SubmitButton>
          <Link
            href={backTo}
            className="text-sm text-ink-faint transition-colors hover:text-ink-soft"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
