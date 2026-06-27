import Link from "next/link";
import { getProfile } from "@/lib/auth";

export async function SiteHeader() {
  const profile = await getProfile();

  return (
    <header className="border-b border-line/70">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="group flex items-baseline gap-2.5">
          <span aria-hidden className="text-gold-soft">
            ✦
          </span>
          <span className="font-serif text-lg tracking-tight text-ink">
            The Unsealed Revelation
          </span>
        </Link>
        <nav className="ui flex items-center gap-4 text-sm sm:gap-5">
          <Link href="/read" className="text-ink-soft transition-colors hover:text-ink">
            Read
          </Link>
          <Link href="/tenets" className="text-ink-soft transition-colors hover:text-ink">
            Tenets
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
              href="/signin"
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
