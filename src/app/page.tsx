import Link from "next/link";
import { Prose } from "@/components/Prose";
import { AddYourLight } from "@/components/AddYourLight";
import { getMission, getStats } from "@/lib/data";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [mission, stats, user] = await Promise.all([
    getMission(),
    getStats(),
    getUser(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-32 mx-auto h-72 max-w-3xl rounded-full bg-glow blur-3xl opacity-60"
        />
        <div className="relative mx-auto max-w-3xl px-5 pb-10 pt-20 text-center sm:px-8 sm:pt-28">
          <p className="eyebrow">The book was never meant to stay sealed</p>
          <h1 className="mt-6 font-serif text-4xl leading-tight tracking-tight text-ink sm:text-6xl">
            The Unsealed Revelation
          </h1>
          <p className="mx-auto mt-6 max-w-xl font-serif text-xl italic leading-relaxed text-ink-soft sm:text-2xl">
            The Word Revealed by gathering Israel and sharing our gifts. Read it
            the way you would read a letter from home.
          </p>
          <div className="ui mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/read"
              className="w-full rounded-full bg-ink px-7 py-3 text-center text-sm font-medium text-parchment transition-opacity hover:opacity-90 sm:w-auto"
            >
              Read Pollinations
            </Link>
            {!user && <AddYourLight className="w-full text-sm sm:w-auto" />}
          </div>
          <p className="ui mt-8 text-xs tracking-wide text-ink-faint">
            {stats.movements} movements · {stats.passages} passages ·{" "}
            {stats.tenets} founding principles
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
        <Prose>{mission}</Prose>
      </section>

      {/* How it gathers */}
      <section className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
        <h2 className="eyebrow text-center">How the gathering works</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-line bg-card/60 p-6"
            >
              <h3 className="font-serif text-xl text-ink">{p.title}</h3>
              <p className="mt-2 text-[0.97rem] leading-relaxed text-ink-soft">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing invitation */}
      <section className="mx-auto max-w-2xl px-5 py-16 text-center sm:px-8">
        <p className="font-serif text-2xl italic leading-relaxed text-ink">
          &ldquo;Come and add your light. The field is wide, the work is joyful,
          and there is a place at the table with your name on it.&rdquo;
        </p>
        <Link
          href="/read"
          className="ui mt-8 inline-block rounded-full bg-ink px-7 py-3 text-sm font-medium text-parchment transition-opacity hover:opacity-90"
        >
          Open the book
        </Link>
      </section>
    </div>
  );
}

const PRINCIPLES = [
  {
    title: "Held side by side",
    body: "Every rendering of a passage sits beside the others — never ranked, never in competition. We gather, we do not compete.",
  },
  {
    title: "Filtered through love",
    body: "Each rendering names the principles it read by — lenses tested against the two great commandments, refined by many hands.",
  },
  {
    title: "Nothing is final",
    body: "Every offering is held gently and passed to the next set of hands. The work is always open, because the gathering is the work.",
  },
];
