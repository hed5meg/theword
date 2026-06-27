import Link from "next/link";
import type { Metadata } from "next";
import { getBook } from "@/lib/data";

export const metadata: Metadata = {
  title: "Read the gathering",
  description:
    "Browse the gathered book of Revelation by Movement and Passage — the community's plain, pure rendering, held side by side.",
};

export default async function ReadPage() {
  const book = await getBook();

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
      <header className="text-center">
        <p className="eyebrow">The gathered book</p>
        <h1 className="mt-4 font-serif text-4xl tracking-tight text-ink sm:text-5xl">
          Read the Revelation
        </h1>
        <p className="mx-auto mt-4 max-w-lg font-serif text-lg italic text-ink-soft">
          The whole story of the human family, from the first garden to the last —
          told in a love-ordered telling, and grounded always in the canonical
          text.
        </p>
      </header>

      <div className="mt-14 space-y-14">
        {book.map((movement) => (
          <section key={movement.slug}>
            <div className="mb-4">
              <h2 className="font-serif text-2xl text-ink">{movement.title}</h2>
              <p className="mt-1.5 max-w-xl text-ink-soft">{movement.summary}</p>
            </div>
            <ul className="divide-y divide-line/70 overflow-hidden rounded-2xl border border-line bg-card/50">
              {movement.passages.map((passage) => (
                <li key={passage.slug}>
                  <Link
                    href={`/read/${movement.slug}/${passage.slug}`}
                    className="group flex items-baseline justify-between gap-4 px-5 py-4 transition-colors hover:bg-glow/50"
                  >
                    <span className="flex flex-col gap-0.5">
                      <span className="font-serif text-lg text-ink group-hover:text-ink">
                        {passage.title}
                      </span>
                      <span className="ui text-xs uppercase tracking-wider text-ink-faint">
                        {passage.canonicalRef}
                      </span>
                    </span>
                    <span className="ui shrink-0 text-xs text-ink-faint">
                      {passage.renderings.length}{" "}
                      {passage.renderings.length === 1 ? "rendering" : "renderings"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
