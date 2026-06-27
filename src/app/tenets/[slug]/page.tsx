import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenet } from "@/lib/data";
import { getUser } from "@/lib/auth";
import { getMyResonatedIds } from "@/lib/resonance";
import { getReflections } from "@/lib/data/reflections";
import { ResonanceControl } from "@/components/ResonanceControl";
import { Reflections } from "@/components/Reflections";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getTenet(slug);
  if (!detail) return {};
  return {
    title: detail.tenet.title,
    description: detail.tenet.description.slice(0, 160),
  };
}

export default async function TenetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getTenet(slug);
  if (!detail) notFound();
  const { tenet, usages } = detail;

  const [user, resonated, reflections] = await Promise.all([
    getUser(),
    tenet.id ? getMyResonatedIds("tenet", [tenet.id]) : Promise.resolve(new Set<string>()),
    tenet.id ? getReflections("tenet", tenet.id) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
      <nav className="ui mb-8 flex items-center gap-2 text-sm text-ink-faint">
        <Link href="/tenets" className="transition-colors hover:text-ink-soft">
          The Tenets
        </Link>
        {tenet.group && (
          <>
            <span aria-hidden>›</span>
            <span className="text-ink-soft">{tenet.group}</span>
          </>
        )}
      </nav>

      <header className="border-b border-line/70 pb-8">
        <h1 className="font-serif text-3xl tracking-tight text-ink sm:text-4xl">
          {tenet.title}
        </h1>
        {tenet.id && (
          <div className="mt-4">
            <ResonanceControl
              targetType="tenet"
              targetId={tenet.id}
              count={tenet.resonanceCount}
              active={resonated.has(tenet.id)}
              signedIn={Boolean(user)}
              path={`/tenets/${slug}`}
              noun="this tenet"
            />
          </div>
        )}
      </header>

      <div className="prose-reverent mt-8">
        <p>{tenet.description}</p>
      </div>

      {tenet.support && (
        <div className="mt-8 rounded-2xl border border-line bg-parchment-deep/40 p-5">
          <p className="eyebrow">Support</p>
          <p className="prose-traditional mt-2">{tenet.support}</p>
        </div>
      )}

      <section className="mt-14">
        <h2 className="font-serif text-2xl text-ink">Renderings that read through this</h2>
        {usages.length > 0 ? (
          <ul className="mt-5 divide-y divide-line/70 overflow-hidden rounded-2xl border border-line bg-card/50">
            {usages.map((u, i) => (
              <li key={`${u.movementSlug}/${u.passageSlug}/${i}`}>
                <Link
                  href={`/read/${u.movementSlug}/${u.passageSlug}`}
                  className="flex items-baseline justify-between gap-4 px-5 py-4 transition-colors hover:bg-glow/50"
                >
                  <span className="flex flex-col">
                    <span className="font-serif text-lg text-ink">{u.passageTitle}</span>
                    <span className="ui text-xs uppercase tracking-wider text-ink-faint">
                      {u.canonicalRef} · {u.author}
                    </span>
                  </span>
                  {u.isGathered && (
                    <span className="ui shrink-0 rounded-full bg-glow px-2.5 py-1 text-xs text-gold">
                      Gathered
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-line bg-card/40 p-6 text-ink-soft">
            No renderings cite this tenet yet.
          </p>
        )}
      </section>

      {tenet.id && (
        <Reflections
          targetType="tenet"
          targetId={tenet.id}
          path={`/tenets/${slug}`}
          signedIn={Boolean(user)}
          reflections={reflections}
        />
      )}
    </div>
  );
}
