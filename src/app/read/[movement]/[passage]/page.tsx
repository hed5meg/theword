import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPassage, getOutline } from "@/lib/data";
import { getProfile } from "@/lib/auth";
import { PassageNav } from "@/components/PassageNav";
import { getMyResonatedIds } from "@/lib/resonance";
import { getReflections } from "@/lib/data/reflections";
import { getGatheredHistory } from "@/lib/data/gathering";
import { RenderingArticle } from "@/components/RenderingArticle";
import { Reflections } from "@/components/Reflections";
import {
  StewardPassageTools,
  GatheredHistory,
} from "@/components/StewardPassageTools";

export const dynamic = "force-dynamic";

type Params = { movement: string; passage: string };

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

  const { passage: p, movementTitle, previous, next } = found;
  const gathered = p.gatheredRendering;
  const alternatives = p.renderings.filter((r) => !r.isGathered);
  // Community renderings have an author profile; seed tellings do not.
  const communityRenderings = alternatives.filter((r) => r.authorHandle);

  const path = `/read/${movement}/${passage}`;
  const [profile, resonated, reflections, history, outline] = await Promise.all([
    getProfile(),
    getMyResonatedIds(
      "rendering",
      p.renderings.map((r) => r.id).filter((id): id is string => Boolean(id)),
    ),
    p.id ? getReflections("passage", p.id) : Promise.resolve([]),
    p.id ? getGatheredHistory(p.id) : Promise.resolve([]),
    getOutline(),
  ]);
  const signedIn = Boolean(profile);
  const isSteward = profile?.role === "steward" || profile?.role === "admin";

  const flat = outline.flatMap((m) => m.passages);
  const total = flat.length;
  const position =
    flat.findIndex((x) => x.movementSlug === movement && x.slug === passage) + 1;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      {/* Context + wayfinding */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <nav className="ui flex items-center gap-2 text-sm text-ink-faint">
          <Link href="/read" className="transition-colors hover:text-ink-soft">
            The gathering
          </Link>
          <span aria-hidden>›</span>
          <span className="text-ink-soft">{movementTitle}</span>
        </nav>
        <PassageNav
          outline={outline}
          movementSlug={movement}
          passageSlug={passage}
          position={position}
          total={total}
        />
      </div>

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
          <p className="prose-traditional mt-4 max-h-[60vh] overflow-y-auto">
            {p.traditionalText}
          </p>
        </details>
      )}

      {/* The Gathered Rendering */}
      {gathered ? (
        <section className="mt-12">
          <RenderingArticle
            rendering={gathered}
            variant="gathered"
            signedIn={signedIn}
            resonated={gathered.id ? resonated.has(gathered.id) : false}
            path={path}
            showTenetInfo
          />
        </section>
      ) : (
        <p className="mt-12 text-ink-soft">
          No gathered rendering yet for this passage.
        </p>
      )}

      <GatheredHistory events={history} />

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

        {communityRenderings.length === 0 && (
          <p className="mt-6 rounded-2xl border border-dashed border-gold-soft/50 bg-glow/30 p-5 text-ink-soft">
            No community renderings yet — yours can be the first to sit beside these
            seed tellings.
          </p>
        )}

        {alternatives.length > 0 && (
          <div className="mt-8 space-y-8">
            {alternatives.map((r) => (
              <RenderingArticle
                key={r.id}
                rendering={r}
                signedIn={signedIn}
                resonated={r.id ? resonated.has(r.id) : false}
                path={path}
              />
            ))}
          </div>
        )}

        <div className="ui mt-8 rounded-2xl border border-gold-soft/40 bg-glow/40 p-6 text-center">
          <p className="font-serif text-lg text-ink">
            Do you read this passage differently?
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Offer your own plain, pure rendering — it will sit beside the others.
          </p>
          <Link
            href={`/render/${p.slug}`}
            className="mt-4 inline-block rounded-full border border-gold-soft/60 px-6 py-2.5 text-sm font-medium text-gold transition-colors hover:bg-glow"
          >
            Offer a rendering
          </Link>
        </div>
      </section>

      {/* Steward tools */}
      {isSteward && p.id && (
        <StewardPassageTools passageId={p.id} renderings={p.renderings} path={path} />
      )}

      {/* Reflections */}
      {p.id && (
        <Reflections
          targetType="passage"
          targetId={p.id}
          path={path}
          signedIn={signedIn}
          reflections={reflections}
        />
      )}

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
        <span className="self-center whitespace-nowrap text-xs text-ink-faint">
          {position} / {total}
        </span>
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
