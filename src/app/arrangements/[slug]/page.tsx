import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArrangementView } from "@/lib/data/arrangements";
import { getProfile } from "@/lib/auth";
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
  const view = await getArrangementView(slug);
  if (!view) return {};
  return { title: view.meta.title, description: view.meta.description };
}

export default async function ArrangementViewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const view = await getArrangementView(slug);
  if (!view) notFound();
  const { meta, outline, id, resonanceCount } = view;
  const path = `/arrangements/${slug}`;

  const [profile, resonated, reflections] = await Promise.all([
    getProfile(),
    id ? getMyResonatedIds("arrangement", [id]) : Promise.resolve(new Set<string>()),
    id ? getReflections("arrangement", id) : Promise.resolve([]),
  ]);
  const canEdit =
    !meta.isSystem &&
    Boolean(profile) &&
    (profile!.handle === meta.authorHandle ||
      profile!.role === "steward" ||
      profile!.role === "admin");

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
      <nav className="ui mb-8 flex items-center gap-2 text-sm text-ink-faint">
        <Link href="/arrangements" className="transition-colors hover:text-ink-soft">
          Arrangements
        </Link>
      </nav>

      <header className="border-b border-line/70 pb-8">
        <div className="flex flex-wrap items-center gap-2">
          {meta.isDefault && (
            <span className="ui rounded-full bg-glow px-3 py-1 text-xs font-medium tracking-wide text-gold">
              Default
            </span>
          )}
          {meta.isSystem && (
            <span className="ui rounded-full border border-line bg-parchment-deep/70 px-3 py-1 text-xs text-ink-soft">
              Built-in
            </span>
          )}
        </div>
        <h1 className="mt-3 font-serif text-3xl tracking-tight text-ink sm:text-4xl">
          {meta.title}
        </h1>
        {meta.authorHandle && (
          <p className="ui mt-1 text-sm text-ink-faint">
            by{" "}
            <Link href={`/members/${meta.authorHandle}`} className="hover:text-ink-soft">
              {meta.authorName}
            </Link>
          </p>
        )}
        {meta.description && (
          <p className="mt-4 font-serif text-lg italic leading-relaxed text-ink-soft">
            {meta.description}
          </p>
        )}

        <div className="ui mt-6 flex flex-wrap items-center gap-4 text-sm">
          <Link
            href={`/read/${meta.slug}`}
            className="rounded-full bg-ink px-6 py-2.5 font-medium text-parchment transition-opacity hover:opacity-90"
          >
            Read the book this way
          </Link>
          {id && (
            <ResonanceControl
              targetType="arrangement"
              targetId={id}
              count={resonanceCount}
              active={resonated.has(id)}
              signedIn={Boolean(profile)}
              path={path}
              noun="this arrangement"
            />
          )}
          {canEdit && (
            <Link
              href={`/arrangements/${slug}/edit`}
              className="text-gold transition-colors hover:text-ink"
            >
              Edit
            </Link>
          )}
        </div>
      </header>

      {/* Outline */}
      <div className="mt-10 space-y-8">
        {outline.groups.map((g, gi) => (
          <section key={g.title ?? `g-${gi}`}>
            {g.title && (
              <h2 className="font-serif text-xl text-ink">{g.title}</h2>
            )}
            {g.subtitle && <p className="mt-1 text-sm text-ink-soft">{g.subtitle}</p>}
            <ol className="mt-3 space-y-1">
              {g.entries.map((e) => (
                <li key={e.slug}>
                  <Link
                    href={`/read/${meta.slug}/${e.slug}`}
                    className="ui flex items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-glow/50"
                  >
                    <span className="font-serif text-base text-ink">{e.title}</span>
                    <span className="shrink-0 text-xs text-ink-faint">
                      {e.canonicalRef}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      {id && (
        <Reflections
          targetType="arrangement"
          targetId={id}
          path={path}
          signedIn={Boolean(profile)}
          reflections={reflections}
        />
      )}
    </div>
  );
}
