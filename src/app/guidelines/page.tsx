import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community guidelines",
  description:
    "How we hold this work and one another — rooted in the two great commandments.",
};

const GUIDELINES = [
  {
    title: "Contribute in love",
    body: "Everything here is tested against the two great commandments — to love God, and to love one another as ourselves. Offer your renderings, tenets, and reflections in that spirit.",
  },
  {
    title: "Assume good faith",
    body: "We come from many traditions and tongues. Read one another generously. A difference is a gift to be gathered, not a fight to be won.",
  },
  {
    title: "The enemy is never a people",
    body: "We refuse any content that targets, dehumanizes, or excludes any people, group, tradition, race, or nation. The accuser is a spirit of fear — never a people. No finger-pointing.",
  },
  {
    title: "No harassment, no harm",
    body: "No harassment, doxxing, or incitement. No sexual content involving minors or any material that promotes harm. These are removed without exception.",
  },
  {
    title: "Keep it plain, pure, and precious",
    body: "Favor clarity and warmth over cleverness. Write so a newcomer with desire and no training can be moved and can take part.",
  },
  {
    title: "Hold opinions gently — nothing is final",
    body: "No rendering is the last word. Every offering is held gently, weighed against love, and passed to the next set of hands. If something seems off, flag it for a steward rather than fighting over it.",
  },
];

export default function GuidelinesPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
      <header className="text-center">
        <p className="eyebrow">How we hold this work</p>
        <h1 className="mt-4 font-serif text-4xl tracking-tight text-ink sm:text-5xl">
          Community guidelines
        </h1>
        <p className="mx-auto mt-4 max-w-lg font-serif text-lg italic text-ink-soft">
          On these two commandments hang all the law and the prophets: love God,
          and love your neighbor as yourself. Everything below simply follows from
          that.
        </p>
      </header>

      <div className="mt-12 space-y-8">
        {GUIDELINES.map((g) => (
          <section key={g.title}>
            <h2 className="font-serif text-xl text-ink">{g.title}</h2>
            <p className="mt-1.5 leading-relaxed text-ink-soft">{g.body}</p>
          </section>
        ))}
      </div>

      <p className="ui mt-12 rounded-2xl border border-line bg-card/50 p-6 text-sm text-ink-soft">
        See something that doesn&rsquo;t belong? Use the gentle <strong>Flag</strong>{" "}
        link on any rendering, tenet, or reflection, and a steward will tend to it.
        Stewards may hide an item pending review, archive it, or restore it.
      </p>
    </div>
  );
}
