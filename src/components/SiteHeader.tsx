import Link from "next/link";

export function SiteHeader() {
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
        <nav className="ui flex items-center gap-5 text-sm">
          <Link
            href="/read"
            className="text-ink-soft transition-colors hover:text-ink"
          >
            Read
          </Link>
          <Link
            href="/read"
            className="rounded-full border border-gold-soft/60 px-3.5 py-1.5 text-gold transition-colors hover:bg-glow"
          >
            Add your light
          </Link>
        </nav>
      </div>
    </header>
  );
}
