import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line/70">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <p className="font-serif text-lg text-ink">
          Nothing is final. The gathering is the work.
        </p>
        <div className="ui mt-4 flex flex-col gap-2 text-sm text-ink-faint sm:flex-row sm:items-center sm:gap-6">
          <Link href="/read" className="transition-colors hover:text-ink-soft">
            Read the gathering
          </Link>
          <span aria-hidden className="hidden sm:inline">
            ·
          </span>
          <Link href="/guidelines" className="transition-colors hover:text-ink-soft">
            Guidelines
          </Link>
          <span aria-hidden className="hidden sm:inline">
            ·
          </span>
          <span>
            Offered freely under{" "}
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/"
              className="underline decoration-line underline-offset-2 transition-colors hover:text-ink-soft"
              rel="license noopener noreferrer"
              target="_blank"
            >
              CC BY-SA 4.0
            </a>
          </span>
          <span aria-hidden className="hidden sm:inline">
            ·
          </span>
          <span>theword.love</span>
        </div>
      </div>
    </footer>
  );
}
