import Link from "next/link";
import type { Metadata } from "next";
import { listArrangements } from "@/lib/data/arrangements";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Arrangements",
  description:
    "Ways through the book — each a contributor's ordering of Revelation, held side by side, never ranked.",
};

export default async function ArrangementsPage() {
  const [arrangements, user] = await Promise.all([listArrangements(), getUser()]);
  const featured = arrangements.find((a) => a.isDefault) ?? arrangements[0];
  const rest = arrangements.filter((a) => a !== featured);

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
      <header className="text-center">
        <p className="eyebrow">Ways through the book</p>
        <h1 className="mt-4 font-serif text-4xl tracking-tight text-ink sm:text-5xl">
          Arrangements
        </h1>
        <p className="mx-auto mt-4 max-w-xl font-serif text-lg italic text-ink-soft">
          Re-sequencing Revelation in love is itself an act of unsealing. Each
          arrangement is one telling of the whole — held beside the others, never
          ranked.
        </p>
      </header>

      {featured && (
        <section className="mt-12">
          <h2 className="eyebrow">The current gathering</h2>
          <div className="mt-3">
            <ArrangementCardView card={featured} featured />
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="mt-12">
          <h2 className="eyebrow">Other arrangements</h2>
          <div className="mt-3 space-y-4">
            {rest.map((a) => (
              <ArrangementCardView key={a.slug} card={a} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-14 rounded-2xl border border-gold-soft/40 bg-glow/30 p-6 text-center sm:p-8">
        <h2 className="font-serif text-2xl text-ink">Propose an arrangement</h2>
        <p className="mt-1.5 text-ink-soft">
          See a different arc through the book? Sequence it your way and offer it.
        </p>
        <Link
          href={user ? "/arrangements/new" : "/signin?next=/arrangements/new"}
          className="ui mt-4 inline-block rounded-full bg-ink px-6 py-3 text-sm font-medium text-parchment transition-opacity hover:opacity-90"
        >
          {user ? "Begin an arrangement" : "Sign in to propose one"}
        </Link>
      </section>
    </div>
  );
}

function ArrangementCardView({
  card,
  featured = false,
}: {
  card: Awaited<ReturnType<typeof listArrangements>>[number];
  featured?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-6 sm:p-7 ${
        featured ? "border-gold-soft/50 bg-glow/20" : "border-line bg-card/50"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {card.isDefault && (
          <span className="ui rounded-full bg-glow px-3 py-1 text-xs font-medium tracking-wide text-gold">
            Default
          </span>
        )}
        {card.isSystem && (
          <span className="ui rounded-full border border-line bg-parchment-deep/70 px-3 py-1 text-xs text-ink-soft">
            Built-in
          </span>
        )}
      </div>
      <h3 className="mt-3 font-serif text-2xl text-ink">
        <Link href={`/arrangements/${card.slug}`} className="hover:text-gold">
          {card.title}
        </Link>
      </h3>
      <p className="ui mt-1 text-sm text-ink-faint">
        {card.authorName ? `by ${card.authorName} · ` : ""}
        {card.passageCount} passages
        {card.movementCount > 0 ? ` · ${card.movementCount} movements` : ""}
        {card.resonanceCount > 0 ? ` · ✦ ${card.resonanceCount}` : ""}
      </p>
      {card.description && (
        <p className="mt-3 font-serif text-lg italic leading-relaxed text-ink-soft">
          {card.description}
        </p>
      )}
      {card.preview.length > 0 && (
        <p className="ui mt-3 text-sm text-ink-faint">
          {card.preview.slice(0, 6).join(" · ")}
          {card.preview.length > 6 ? " …" : ""}
        </p>
      )}
      <div className="ui mt-5 flex items-center gap-4 text-sm">
        <Link
          href={`/read/${card.slug}`}
          className="rounded-full bg-ink px-5 py-2 font-medium text-parchment transition-opacity hover:opacity-90"
        >
          Unseal this way
        </Link>
        <Link
          href={`/arrangements/${card.slug}`}
          className="text-gold transition-colors hover:text-ink"
        >
          See the arrangement →
        </Link>
      </div>
    </article>
  );
}
