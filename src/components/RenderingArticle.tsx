import Link from "next/link";
import type { Annotation, Note, Rendering } from "@/lib/types";
import { Prose } from "@/components/Prose";
import { NoteLayer } from "@/components/NoteLayer";
import { TenetList } from "@/components/TenetList";
import { ResonanceControl } from "@/components/ResonanceControl";
import { FlagControl } from "@/components/FlagControl";

/**
 * One rendering of a passage. The gathered rendering is set larger and airier;
 * alternatives sit calmly beside it, never ranked.
 */
export function RenderingArticle({
  rendering,
  variant = "alternative",
  primary = false,
  signedIn = false,
  resonated = false,
  path = "/",
  showTenetInfo = false,
  notes,
  annotations,
  canManageNotes = false,
  canAnnotate = false,
  editHref,
  allTenets = [],
}: {
  rendering: Rendering;
  variant?: "gathered" | "alternative";
  /** Render large and uncarded as the page's main reading (regardless of badge). */
  primary?: boolean;
  signedIn?: boolean;
  resonated?: boolean;
  path?: string;
  showTenetInfo?: boolean;
  notes?: Note[];
  /** Author glosses to show inline (public). */
  annotations?: Annotation[];
  canManageNotes?: boolean;
  /** Viewer authored this rendering (or is a steward): may add glosses. */
  canAnnotate?: boolean;
  /** When the viewer may edit this rendering, a link to its edit form. */
  editHref?: string;
  allTenets?: { slug: string; title: string }[];
}) {
  const isGathered = variant === "gathered";
  const big = isGathered || primary;

  return (
    <article className={big ? "" : "rounded-2xl border border-line bg-card/50 p-6 sm:p-8"}>
      {/* Attribution for community branches (the seed needs none). A named branch
          leads with its name, linked to the whole branch; the contributor is
          credited beside it. */}
      {rendering.authorHandle && (
        <header className="ui mb-5 text-sm text-ink-faint">
          {rendering.branchName && rendering.branchSlug && (
            <Link
              href={`/branches/${rendering.authorHandle}/${rendering.branchSlug}`}
              className="mb-0.5 block font-serif text-lg not-italic text-gold transition-colors hover:text-ink"
            >
              {rendering.branchName}
            </Link>
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>by</span>
            <Link
              href={`/members/${rendering.authorHandle}`}
              className="text-ink-soft transition-colors hover:text-ink"
            >
              {rendering.author}
            </Link>
            {rendering.tradition && (
              <>
                <span aria-hidden>·</span>
                <span>{rendering.tradition}</span>
              </>
            )}
          </div>
        </header>
      )}

      {rendering.id ? (
        <NoteLayer
          renderingId={rendering.id}
          body={rendering.body}
          notes={notes ?? []}
          annotations={annotations ?? []}
          path={path}
          canCreate={signedIn}
          canManage={canManageNotes}
          canAnnotate={canAnnotate}
          proseClass={big ? "prose-gathered" : ""}
          allTenets={allTenets}
        />
      ) : (
        <Prose className={big ? "prose-gathered" : ""}>
          {rendering.body}
        </Prose>
      )}

      <footer className="mt-6 flex flex-col gap-4 border-t border-line/70 pt-4">
        <TenetList tenets={rendering.tenets} showInfo={showTenetInfo} />
        {rendering.id && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ResonanceControl
              targetType="rendering"
              targetId={rendering.id}
              count={rendering.resonanceCount}
              active={resonated}
              signedIn={signedIn}
              path={path}
              noun="this rendering"
            />
            <div className="flex items-center gap-4">
              {editHref && (
                <Link
                  href={editHref}
                  className="ui text-xs text-ink-faint transition-colors hover:text-gold"
                >
                  Edit
                </Link>
              )}
              <FlagControl
                targetType="rendering"
                targetId={rendering.id}
                path={path}
                signedIn={signedIn}
              />
            </div>
          </div>
        )}
      </footer>
    </article>
  );
}
