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
  allTenets?: { slug: string; title: string }[];
}) {
  const isGathered = variant === "gathered";
  const big = isGathered || primary;

  return (
    <article className={big ? "" : "rounded-2xl border border-line bg-card/50 p-6 sm:p-8"}>
      {/* The branch is named by the picker above; show attribution only for
          community branches (the seed needs none). */}
      {rendering.authorHandle && (
        <header className="ui mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-faint">
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
            <FlagControl
              targetType="rendering"
              targetId={rendering.id}
              path={path}
              signedIn={signedIn}
            />
          </div>
        )}
      </footer>
    </article>
  );
}
