import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getArrangementPassage,
  getArrangementOutline,
  getArrangementMetaList,
} from "@/lib/data/arrangements";
import { getProfile } from "@/lib/auth";
import { getMyResonatedIds } from "@/lib/resonance";
import { getReflections } from "@/lib/data/reflections";
import { getGatheredHistory } from "@/lib/data/gathering";
import { RenderingArticle } from "@/components/RenderingArticle";
import { Reflections } from "@/components/Reflections";
import { PassageNav } from "@/components/PassageNav";
import { ArrangementSelector } from "@/components/ArrangementSelector";
import { RememberArrangement } from "@/components/RememberArrangement";
import {
  StewardPassageTools,
  GatheredHistory,
} from "@/components/StewardPassageTools";
import { ComparePanel, type CompareText } from "@/components/ComparePanel";

export const dynamic = "force-dynamic";

type Params = { arrangement: string; passage: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { arrangement, passage } = await params;
  const found = await getArrangementPassage(arrangement, passage);
  if (!found) return {};
  return {
    title: `${found.passage.title} (${found.passage.canonicalRef})`,
    description: `${found.passage.title} — a plain, pure rendering of ${found.passage.canonicalRef}, held side by side with the traditional text.`,
  };
}

export default async function PassagePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ compare?: string }>;
}) {
  const { arrangement, passage } = await params;
  const { compare } = await searchParams;
  const found = await getArrangementPassage(arrangement, passage);
  if (!found) notFound();

  const {
    passage: p,
    arrangement: arr,
    movementTitle,
    previous,
    next,
    position,
    total,
  } = found;
  const gathered = p.gatheredRendering;
  const alternatives = p.renderings.filter((r) => !r.isGathered);
  const communityRenderings = alternatives.filter((r) => r.authorHandle);

  const path = `/read/${arrangement}/${passage}`;
  const [profile, resonated, reflections, history, outline, arrangements] =
    await Promise.all([
      getProfile(),
      getMyResonatedIds(
        "rendering",
        p.renderings.map((r) => r.id).filter((id): id is string => Boolean(id)),
      ),
      p.id ? getReflections("passage", p.id) : Promise.resolve([]),
      p.id ? getGatheredHistory(p.id) : Promise.resolve([]),
      getArrangementOutline(arrangement),
      getArrangementMetaList(),
    ]);
  const signedIn = Boolean(profile);
  const isSteward = profile?.role === "steward" || profile?.role === "admin";
  const offerHref = `/render/${p.slug}?arr=${arrangement}&entry=${passage}`;

  // Comparison mode: build the selectable texts (traditional + every rendering).
  const compareTexts: CompareText[] = [];
  if (p.traditionalText) {
    compareTexts.push({
      key: "traditional",
      label: "Traditional text (KJV)",
      kind: "traditional",
      body: p.traditionalText,
      canonicalRef: p.canonicalRef,
    });
  }
  for (const r of p.renderings) {
    compareTexts.push({
      key: r.isGathered ? "gathered" : (r.id ?? ""),
      label: r.isGathered ? `Gathered Rendering — ${r.author}` : r.author,
      kind: "rendering",
      body: r.body,
      language: r.language,
      tradition: r.tradition,
      tenets: r.tenets.map((t) => ({ slug: t.slug, title: t.title })),
    });
  }
  const canCompare = compareTexts.length >= 2;
  const compareOn = canCompare && typeof compare === "string";
  const [cmpLeft, cmpRight] = (compare ?? "traditional,gathered").split(",");

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <RememberArrangement slug={arr.slug} />

      {/* Context + wayfinding */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <nav className="ui flex items-center gap-2 text-sm text-ink-faint">
          <Link
            href={`/read/${arr.slug}`}
            className="transition-colors hover:text-ink-soft"
          >
            {arr.title}
          </Link>
          {movementTitle && (
            <>
              <span aria-hidden>›</span>
              <span className="text-ink-soft">{movementTitle}</span>
            </>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <ArrangementSelector arrangements={arrangements} current={arr.slug} />
          {outline && (
            <PassageNav
              arrangementSlug={arr.slug}
              groups={outline.groups}
              currentSlug={passage}
              position={position}
              total={total}
            />
          )}
        </div>
      </div>

      <header className="flex items-start justify-between gap-4 border-b border-line/70 pb-8">
        <div>
          <p className="eyebrow">{p.canonicalRef}</p>
          <h1 className="mt-3 font-serif text-3xl tracking-tight text-ink sm:text-4xl">
            {p.title}
          </h1>
        </div>
        {canCompare ? (
          <Link
            href={
              compareOn ? path : `${path}?compare=traditional,gathered`
            }
            scroll={false}
            className="ui mt-1 shrink-0 rounded-full border border-gold-soft/60 px-4 py-1.5 text-sm text-gold transition-colors hover:bg-glow"
          >
            {compareOn ? "Close compare" : "Compare"}
          </Link>
        ) : (
          <span
            title="This passage has only one text to read."
            className="ui mt-1 shrink-0 cursor-not-allowed rounded-full border border-line px-4 py-1.5 text-sm text-ink-faint/70"
          >
            Compare
          </span>
        )}
      </header>

      {compareOn ? (
        <ComparePanel
          texts={compareTexts}
          initialLeft={cmpLeft}
          initialRight={cmpRight}
          basePath={path}
        />
      ) : (
        <>
      {/* Traditional text */}
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

      {/* Gathered Rendering */}
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

      {/* Renderings side by side */}
      <section className="mt-16">
        <h2 className="font-serif text-2xl text-ink">Renderings held side by side</h2>
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
            href={offerHref}
            className="mt-4 inline-block rounded-full border border-gold-soft/60 px-6 py-2.5 text-sm font-medium text-gold transition-colors hover:bg-glow"
          >
            Offer a rendering
          </Link>
        </div>
      </section>
        </>
      )}

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

      {/* Previous / next within the arrangement */}
      <nav className="ui mt-16 flex items-stretch justify-between gap-4 border-t border-line/70 pt-8 text-sm">
        {previous ? (
          <Link
            href={`/read/${previous.arrangementSlug}/${previous.passageSlug}`}
            className="group flex max-w-[40%] flex-col text-left transition-colors hover:text-ink"
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
            href={`/read/${next.arrangementSlug}/${next.passageSlug}`}
            className="group flex max-w-[40%] flex-col text-right transition-colors hover:text-ink"
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
