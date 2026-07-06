import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getRefinementInbox } from "@/lib/data/refinements";
import {
  gatherInChange,
  setAsideChange,
  withdrawRefinement,
  addRefinementReply,
} from "@/lib/actions/refinements";
import { IdempotencyField } from "@/components/IdempotencyField";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Refinements" };

const STATUS: Record<string, string> = {
  open: "Open",
  gathered_in: "Gathered in",
  set_aside: "Set aside",
  withdrawn: "Withdrawn",
};

export default async function RefinementsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/signin?next=/refinements");
  const refinements = await getRefinementInbox();
  const path = "/refinements";

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
      <header>
        <p className="eyebrow">Gifts to the branches</p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight text-ink">Refinements</h1>
        <p className="mt-2 text-ink-soft">
          Proposed wordings, offered in love — gather them in or set them aside with
          thanks. A refinement that&rsquo;s gathered in is cross-pollinated into the
          branch, the offerer credited.
        </p>
      </header>

      {refinements.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-line bg-card/40 p-6 text-ink-soft">
          No refinements waiting — the branches rest as they are, for now.
        </p>
      ) : (
        <ul className="mt-10 space-y-6">
          {refinements.map((rf) => (
            <li key={rf.id} className="rounded-2xl border border-line bg-card/50 p-5">
              <div className="ui flex flex-wrap items-center gap-2 text-xs text-ink-faint">
                <span className="rounded-full bg-parchment-deep px-2.5 py-0.5">
                  {STATUS[rf.status] ?? rf.status}
                </span>
                <span>· offered by {rf.proposerName}</span>
              </div>
              <Link
                href={rf.passageHref}
                className="ui mt-1 block text-sm text-gold transition-colors hover:text-ink"
              >
                On “{rf.passageTitle}” →
              </Link>
              {rf.reason && (
                <p className="mt-2 text-sm italic text-ink-soft">{rf.reason}</p>
              )}
              {rf.tenetTitles.length > 0 && (
                <p className="ui mt-1 text-xs text-ink-faint">
                  Serves: {rf.tenetTitles.join(" · ")}
                </p>
              )}

              {/* Changes (scoped before/after) */}
              <div className="mt-4 space-y-4">
                {rf.changes.map((c) => (
                  <div key={c.id} className="rounded-xl border border-line bg-parchment-deep/30 p-4">
                    {c.stale ? (
                      <p className="ui text-sm text-ink-soft">
                        <span className="font-medium text-ink">The text beneath this has changed</span>{" "}
                        — it can&rsquo;t be gathered in until revisited. It pointed to:
                        <span className="mt-1 block italic">“{c.quotedText}”</span>
                      </p>
                    ) : (
                      <dl className="space-y-2 text-sm">
                        <div>
                          <dt className="ui text-xs uppercase tracking-wider text-ink-faint">
                            Currently
                          </dt>
                          <dd className="mt-0.5 border-l-2 border-line pl-2 text-ink-soft line-through decoration-ink-faint/50">
                            {c.currently ?? c.quotedText}
                          </dd>
                        </div>
                        <div>
                          <dt className="ui text-xs uppercase tracking-wider text-gold">
                            Proposed
                          </dt>
                          <dd className="mt-0.5 border-l-2 border-gold-soft pl-2 text-ink">
                            {c.replacementText}
                          </dd>
                        </div>
                      </dl>
                    )}

                    {rf.canManage && c.status === "open" && (
                      <div className="ui mt-3 flex flex-wrap gap-2">
                        {!c.stale && (
                          <form action={gatherInChange}>
                            <input type="hidden" name="change_id" value={c.id} />
                            <input type="hidden" name="path" value={path} />
                            <button
                              type="submit"
                              className="rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-parchment transition-opacity hover:opacity-90"
                            >
                              Gather it in
                            </button>
                          </form>
                        )}
                        <form action={setAsideChange}>
                          <input type="hidden" name="change_id" value={c.id} />
                          <input type="hidden" name="path" value={path} />
                          <button
                            type="submit"
                            className="rounded-full border border-line px-4 py-1.5 text-xs text-ink-soft transition-colors hover:border-gold-soft/50 hover:text-ink"
                          >
                            Set aside, with thanks
                          </button>
                        </form>
                      </div>
                    )}
                    {c.status !== "open" && (
                      <p className="ui mt-2 text-xs text-ink-faint">
                        {c.status === "gathered_in"
                          ? "Gathered in ✦"
                          : c.status === "set_aside"
                            ? "Set aside, with thanks"
                            : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Replies */}
              {rf.replies.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-line/70 pt-3 text-sm">
                  {rf.replies.map((r) => (
                    <li key={r.id}>
                      <span className="text-ink">{r.body}</span>
                      <span className="ui block text-xs text-ink-faint">{r.authorName}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="ui mt-4 flex flex-wrap items-end gap-3 border-t border-line/70 pt-3">
                <form action={addRefinementReply} className="flex flex-1 items-end gap-2">
                  <IdempotencyField />
                  <input type="hidden" name="refinement_id" value={rf.id} />
                  <input type="hidden" name="path" value={path} />
                  <input
                    name="body"
                    placeholder="A gentle reply…"
                    className="min-w-0 flex-1 rounded-lg border border-line bg-card px-3 py-1.5 text-sm text-ink outline-none focus:border-gold-soft"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft hover:text-ink"
                  >
                    Reply
                  </button>
                </form>
                {rf.isProposer && rf.status === "open" && (
                  <form action={withdrawRefinement}>
                    <input type="hidden" name="refinement_id" value={rf.id} />
                    <input type="hidden" name="path" value={path} />
                    <button
                      type="submit"
                      className="text-xs text-ink-faint transition-colors hover:text-ink-soft"
                    >
                      Withdraw
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
