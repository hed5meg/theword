import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { getNoteCount } from "@/lib/data/notes";
import { getRefinementCount } from "@/lib/data/refinements";

export async function SiteHeader() {
  const profile = await getProfile();
  const [noteCount, refinementCount] = profile
    ? await Promise.all([getNoteCount(), getRefinementCount()])
    : [0, 0];

  return (
    <header className="border-b border-line/70">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4 sm:px-8">
        <Link href="/" className="group flex min-w-0 items-center gap-2.5">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-6 shrink-0 text-gold-soft"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="10" />
            <rect x="8" y="8" width="8" height="8" />
          </svg>
          <span className="font-serif text-lg tracking-tight text-ink">
            The Word Revealed
          </span>
        </Link>
        <nav className="ui flex flex-1 flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm sm:gap-5">
          <Link href="/read" className="text-ink-soft transition-colors hover:text-ink">
            Read
          </Link>
          <Link
            href="/arrangements"
            className="hidden text-ink-soft transition-colors hover:text-ink sm:inline"
          >
            Arrangements
          </Link>
          <Link href="/principles" className="text-ink-soft transition-colors hover:text-ink">
            Principles
          </Link>
          {profile ? (
            <>
              {(profile.role === "steward" || profile.role === "admin") && (
                <Link
                  href="/steward"
                  className="text-gold transition-colors hover:text-ink"
                >
                  Steward
                </Link>
              )}
              <Link
                href="/notes"
                className="hidden text-ink-soft transition-colors hover:text-ink sm:inline"
              >
                Notes{noteCount > 0 ? ` (${noteCount})` : ""}
              </Link>
              <Link
                href="/refinements"
                className="hidden text-ink-soft transition-colors hover:text-ink sm:inline"
              >
                Refinements{refinementCount > 0 ? ` (${refinementCount})` : ""}
              </Link>
              <Link
                href={`/members/${profile.handle}`}
                className="text-ink-soft transition-colors hover:text-ink"
              >
                {profile.displayName}
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-ink-faint transition-colors hover:text-ink-soft"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/signin?next=/read"
              className="rounded-full border border-gold-soft/60 px-3.5 py-1.5 text-gold transition-colors hover:bg-glow"
            >
              Add your light
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
