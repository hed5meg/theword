import Link from "next/link";
import type { Metadata } from "next";
import type { Tenet } from "@/lib/types";
import { getTenets } from "@/lib/data";
import { getUser } from "@/lib/auth";
import { offerTenet } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Tenets",
  description:
    "The filtering principles the community reads by — lenses tested against love, themselves open to refinement.",
};

export default async function TenetsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [tenets, user, { error }] = await Promise.all([
    getTenets(),
    getUser(),
    searchParams,
  ]);

  // Preserve group order as encountered.
  const groups: { name: string; tenets: Tenet[] }[] = [];
  for (const t of tenets) {
    const name = t.group ?? "Other tenets";
    let g = groups.find((x) => x.name === name);
    if (!g) {
      g = { name, tenets: [] };
      groups.push(g);
    }
    g.tenets.push(t);
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
      <header className="text-center">
        <p className="eyebrow">The lenses we read by</p>
        <h1 className="mt-4 font-serif text-4xl tracking-tight text-ink sm:text-5xl">
          The Tenets
        </h1>
        <p className="mx-auto mt-4 max-w-xl font-serif text-lg italic text-ink-soft">
          Not rules to be obeyed but lenses to read by — and like everything in this
          work, themselves open to refinement, weighed always against love.
        </p>
      </header>

      <div className="mt-14 space-y-12">
        {groups.map((g) => (
          <section key={g.name}>
            <h2 className="eyebrow">{g.name}</h2>
            <ul className="mt-4 space-y-3">
              {g.tenets.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/tenets/${t.slug}`}
                    className="block rounded-2xl border border-line bg-card/50 p-5 transition-colors hover:bg-glow/40"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="font-serif text-xl text-ink">{t.title}</h3>
                      {t.resonanceCount > 0 && (
                        <span className="ui shrink-0 text-xs text-ink-faint">
                          ✦ {t.resonanceCount}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-ink-soft">{t.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* Offer a tenet */}
      <section className="mt-16 rounded-2xl border border-gold-soft/40 bg-glow/30 p-6 sm:p-8">
        <h2 className="font-serif text-2xl text-ink">Offer a tenet</h2>
        <p className="mt-1.5 text-ink-soft">
          A principle you trust to tell wheat from tares. It will be held gently and
          refined by many hands.
        </p>
        {user ? (
          <form action={offerTenet} className="ui mt-6 space-y-4">
            {error === "required" && (
              <p className="text-sm text-red-700">A title and description are needed.</p>
            )}
            {error === "save" && (
              <p className="text-sm text-red-700">Something went wrong. Please try again.</p>
            )}
            <input
              name="title"
              required
              placeholder="The tenet, in a few words"
              className="w-full rounded-xl border border-line bg-card px-4 py-3 text-ink outline-none focus:border-gold-soft"
            />
            <textarea
              name="description"
              required
              rows={3}
              placeholder="Describe it plainly — what it helps us see."
              className="w-full rounded-xl border border-line bg-card px-4 py-3 text-ink outline-none focus:border-gold-soft"
            />
            <textarea
              name="support"
              rows={2}
              placeholder="Supporting scripture or cross-cultural wisdom (optional)."
              className="w-full rounded-xl border border-line bg-card px-4 py-3 text-ink outline-none focus:border-gold-soft"
            />
            <button
              type="submit"
              className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-parchment transition-opacity hover:opacity-90"
            >
              Offer this tenet
            </button>
          </form>
        ) : (
          <Link
            href="/signin?next=/tenets"
            className="ui mt-6 inline-block rounded-full border border-gold-soft/60 px-6 py-3 text-sm font-medium text-gold transition-colors hover:bg-glow"
          >
            Sign in to offer a tenet
          </Link>
        )}
      </section>
    </div>
  );
}
