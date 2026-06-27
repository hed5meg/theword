import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How We Gather",
  description:
    "The community guidelines for The Unsealed Revelation — rooted in the two great commandments.",
};

export default function GuidelinesPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
      <header className="text-center">
        <p className="eyebrow">The community guidelines</p>
        <h1 className="mt-4 font-serif text-4xl tracking-tight text-ink sm:text-5xl">
          How We Gather
        </h1>
      </header>

      <div className="mt-12 space-y-10">
        <p className="font-serif text-lg leading-relaxed text-ink-soft">
          This is an open table. Anyone who wishes to help gather the Word into its
          plain, pure form is welcome here — from any tradition, in any tongue, at
          any point on the road home. To keep the table safe and the work joyful, we
          ask only a few things of one another. They all come from the same place.
        </p>

        <Section title="The ground we stand on">
          <p>
            Everything here rests on the two great commandments: to love God, and to
            love one another as ourselves. That is the filter we read the text
            through — and it is just as much how we treat each other. If love of God
            and neighbor is the measure of a true rendering, it is the measure of a
            true contributor, too.
          </p>
        </Section>

        <Section title="How we gather">
          <Line head="Hold every offering gently.">
            Each rendering, principle, arrangement, and note is someone&rsquo;s
            sincere attempt to see more clearly. Receive it the way you would want
            yours received.
          </Line>
          <Line head="Gather, don't compete.">
            We are not here to win an argument or to rank one another. We lay our
            pieces down side by side and let the Word grow clearer than any of us
            could make it alone.
          </Line>
          <Line head="Assume good faith.">
            When something lands wrong, assume the best first. Ask before you accuse.
            We each carry a different culture, language, and set of wounds, and much
            is lost in the space between us.
          </Line>
          <Line head="Disagree in love.">
            You are free — encouraged — to question, to correct, to refine. Do it
            kindly, and about the text, never against the person.
          </Line>
          <Line head="Hold your own view gently.">
            Nothing here is final. Come willing to be changed; that is how the
            gathering works.
          </Line>
        </Section>

        <Section title="The few firm lines">
          <p className="text-ink-soft">
            These are few, and we hold them firmly, because they keep the table safe
            for everyone.
          </p>
          <Line head="The enemy is never a people.">
            We never aim the text — or each other — at any person, people, race,
            religion, or nation. The accuser this book unmasks is fear itself, never
            a group of God&rsquo;s children. Anything that dehumanizes, targets, or
            excludes a people has no place here.
          </Line>
          <Line head="No harassment.">
            No attacking, demeaning, exposing, or pursuing another person. The notes
            and reflections are for the work, never for wounding.
          </Line>
          <Line head="Protect the children.">
            Anything that sexualizes or endangers a child is forbidden, will be
            removed at once, and will be reported where the law requires.
          </Line>
          <Line head="Nothing that promotes harm">
            — violence, self-harm, exploitation, or hatred — belongs here.
          </Line>
          <p className="text-ink-soft">Everything else, we work out together, in love.</p>
        </Section>

        <Section title="How the work is tended">
          <Line head="Stewards are gardeners, not gatekeepers.">
            They are members who tend the gathering — helping to gather what the
            community is converging on, and keeping the table safe. They serve the
            work; they do not own it.
          </Line>
          <Line head="If something breaks the table's peace, you can flag it,">
            and a steward will look with care.
          </Line>
          <Line head="We hold rather than punish.">
            Most things here are held gently — set aside, revisited, refined — not
            deleted in anger. The firm lines above are the exception: those we
            enforce, so that everyone stays safe.
          </Line>
          <Line head="Nothing true is thrown away for being unfamiliar.">
            Wisdom from every culture and tongue belongs at this table. Difference is
            not a violation; it is part of what we gather.
          </Line>
        </Section>

        <Section title="What we gather, we give away">
          <p>
            Everything offered here is shared freely, so that the Word stays free for
            the whole family. Bring what is yours to bring, knowing it becomes a gift
            to everyone who comes after.
          </p>
        </Section>

        <div className="border-t border-line/70 pt-8 text-center">
          <p className="font-serif text-lg italic leading-relaxed text-ink-soft">
            If your heart turns toward this work, you are already one of us. Come and
            add your light — and help us keep the table a place where love and truth
            can come through.
          </p>
          <p className="ui mt-4 text-sm text-ink-faint">
            Nothing is final. The gathering is the work.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-2xl text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Line({ head, children }: { head: string; children: React.ReactNode }) {
  return (
    <p className="leading-relaxed text-ink-soft">
      <strong className="font-semibold text-ink">{head}</strong> {children}
    </p>
  );
}
