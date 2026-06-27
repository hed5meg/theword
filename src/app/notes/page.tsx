import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getInboxNotes } from "@/lib/data/notes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Notes" };

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  addressed: "Addressed",
  archived: "Set aside",
};

export default async function NotesInboxPage() {
  const profile = await getProfile();
  if (!profile) redirect("/signin?next=/notes");
  const isSteward = profile.role === "steward" || profile.role === "admin";
  const notes = await getInboxNotes();

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
      <header>
        <p className="eyebrow">In the margins</p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight text-ink">
          {isSteward ? "Notes across the gathering" : "Notes on your branches"}
        </h1>
        <p className="mt-2 text-ink-soft">
          Gentle, directed notes — questions, encouragements, and suggested wordings,
          held in love.
        </p>
      </header>

      {notes.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-line bg-card/40 p-6 text-ink-soft">
          No notes yet — the margins are quiet.
        </p>
      ) : (
        <ul className="mt-10 space-y-4">
          {notes.map((n) => (
            <li key={n.id} className="rounded-2xl border border-line bg-card/50 p-5">
              <div className="ui flex flex-wrap items-center gap-2 text-xs text-ink-faint">
                <span className="rounded-full bg-parchment-deep px-2.5 py-0.5">
                  {STATUS_LABEL[n.status] ?? n.status}
                </span>
                {n.orphaned && (
                  <span className="text-ink-faint">· the text this pointed to has changed</span>
                )}
                <span>· {n.authorName}</span>
              </div>
              <p className="mt-2 text-sm italic text-ink-soft">
                “{n.quotedText.slice(0, 120)}{n.quotedText.length > 120 ? "…" : ""}”
              </p>
              <p className="mt-1 text-ink">{n.body}</p>
              {n.suggestedWording && (
                <p className="ui mt-1 text-sm text-ink-soft">
                  <span className="text-ink-faint">Suggested:</span> {n.suggestedWording}
                </p>
              )}
              <div className="ui mt-3 flex items-center gap-4 text-sm">
                <Link
                  href={n.passageHref}
                  className="text-gold transition-colors hover:text-ink"
                >
                  Open “{n.passageTitle}” →
                </Link>
                {n.replies.length > 0 && (
                  <span className="text-xs text-ink-faint">
                    {n.replies.length} {n.replies.length === 1 ? "reply" : "replies"}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
