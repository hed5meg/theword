import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBook, getPassage } from "@/lib/data";
import { RenderingArticle } from "@/components/RenderingArticle";

type Params = { movement: string; passage: string };

export async function generateStaticParams() {
  const book = await getBook();
  return book.flatMap((m) =>
    m.passages.map((p) => ({ movement: m.slug, passage: p.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { movement, passage } = await params;
  const found = await getPassage(movement, passage);
  if (!found) return {};
  return {
    title: `${found.passage.title} (${found.passage.canonicalRef})`,
    description: `${found.passage.title} — a plain, pure rendering of ${found.passage.canonicalRef}, held side by side with the traditional text.`,
  };
}

export default async function PassagePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { movement, passage } = await params;
  const found = await getPassage(movement, passage);
  if (!found) notFound();

  const { passage: p, movement: m, previous, next } = found;
  const gathered = p.gatheredRendering;
  const alternatives = p.renderings.filter((r) => !r.isGathered);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      {/* Context */}
      <nav className="ui mb-8 flex items-center gap-2 text-sm text-ink-faint">
        <Link href="/read" className="transition-colors hover:text-ink-soft">
          The gathering
        </Link>
        <span aria-hidden>›</span>
        <span className="text-ink-soft">{m.title}</span>
      </nav>

      <header className="border-b border-line/70 pb-8">
        <p className="eyebrow">{p.canonicalRef}</p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight text-ink sm:text-4xl">
          {p.title}
        </h1>
      </header>

      {/* Traditional text, available alongside for grounding */}
      {p.traditionalText && (
        <details className="group mt-8 rounded-2xl border border-line bg-parchment-deep/40 px-5 py-4">
          <summary className="ui flex cursor-pointer list-none items-center justify-between text-sm text-ink-soft">
            <span className="uppercase tracking-wider text-ink-faint">
              The traditional text · {p.canonicalRef} (KJV)
            </span>
            <span
              aria-hidden
              className="text-ink-faint transition-transform group-open:rotate-180"
            >
              ⌄
            </span>
          </summary>
          <p className="prose-traditional mt-4">{p.traditionalText}</p>
        </details>
      )}

      {/* The Gathered Rendering */}
      {gathered ? (
        <section className="mt-12">
          <RenderingArticle rendering={gathered} variant="gathered" />
        </section>
      ) : (
        <p className="mt-12 text-ink-soft">
          No gathered rendering yet for this passage.
        </p>
      )}

      {/* Alternative renderings, held side by side */}
      <section className="mt-16">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-2xl text-ink">
            Renderings held side by side
          </h2>
        </div>
        <p className="mt-1.5 text-ink-soft">
          Other tellings of this passage, offered in love — never ranked, never in
          competition.
        </p>

        {alternatives.length > 0 ? (
          <div className="mt-8 space-y-8">
            {alternatives.map((r) => (
              <RenderingArticle key={r.id} rendering={r} />
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl border border-dashed border-line bg-card/40 p-6 text-ink-soft">
            No other renderings here yet. Yours could be the next light.
          </p>
        )}

        <div className="ui mt-8 rounded-2xl border border-gold-soft/40 bg-glow/40 p-6 text-center">
          <p className="font-serif text-lg text-ink">
            Do you read this passage differently?
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Offering your own rendering opens with accounts in the next step of the
            work.
          </p>
          <span className="mt-4 inline-block cursor-not-allowed rounded-full border border-gold-soft/60 px-6 py-2.5 text-sm font-medium text-gold/70">
            Offer a rendering · coming soon
          </span>
        </div>
      </section>

      {/* Gentle next / previous */}
      <nav className="ui mt-16 flex items-stretch justify-between gap-4 border-t border-line/70 pt-8 text-sm">
        {previous ? (
          <Link
            href={`/read/${previous.movementSlug}/${previous.passageSlug}`}
            className="group flex max-w-[45%] flex-col text-left transition-colors hover:text-ink"
          >
            <span className="text-xs uppercase tracking-wider text-ink-faint">
              ← Previous
            </span>
            <span className="mt-1 font-serif text-base text-ink-soft group-hover:text-ink">
              {previous.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/read/${next.movementSlug}/${next.passageSlug}`}
            className="group flex max-w-[45%] flex-col text-right transition-colors hover:text-ink"
          >
            <span className="text-xs uppercase tracking-wider text-ink-faint">
              Next →
            </span>
            <span className="mt-1 font-serif text-base text-ink-soft group-hover:text-ink">
              {next.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
