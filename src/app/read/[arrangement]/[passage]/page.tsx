import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getArrangementPassage,
  getArrangementOutline,
} from "@/lib/data/arrangements";
import { getTenets } from "@/lib/data";
import { getProfile } from "@/lib/auth";
import { getMyResonatedIds } from "@/lib/resonance";
import { getReflections } from "@/lib/data/reflections";
import { getGatheredHistory } from "@/lib/data/gathering";
import { getNotesByRendering } from "@/lib/data/notes";
import { RenderingArticle } from "@/components/RenderingArticle";
import { RenderingPicker } from "@/components/RenderingPicker";
import { Reflections } from "@/components/Reflections";
import { PassageNav } from "@/components/PassageNav";
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
  searchParams: Promise<{ compare?: string; rendering?: string }>;
}) {
  const { arrangement, passage } = await params;
  const { compare, rendering: renderingParam } = await searchParams;
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

  // Pick which rendering to read (default the gathered one). One at a time.
  const renderingOptions = p.renderings.map((r) => ({
    key: r.isGathered ? "gathered" : (r.id ?? ""),
    label: r.author,
  }));
  const selectedKey =
    typeof renderingParam === "string" &&
    renderingOptions.some((o) => o.key === renderingParam)
      ? renderingParam
      : "gathered";
  const selected =
    selectedKey === "gathered"
      ? gathered
      : (p.renderings.find((r) => r.id === selectedKey) ?? gathered);

  const path = `/read/${arrangement}/${passage}`;
  const renderingIds = p.renderings
    .map((r) => r.id)
    .filter((id): id is string => Boolean(id));
  const [profile, resonated, reflections, history, outline, notesByRendering] =
    await Promise.all([
      getProfile(),
      getMyResonatedIds("rendering", renderingIds),
      p.id ? getReflections("passage", p.id) : Promise.resolve([]),
      p.id ? getGatheredHistory(p.id) : Promise.resolve([]),
      getArrangementOutline(arrangement),
      getNotesByRendering(renderingIds),
    ]);
  const allTenets = (await getTenets()).map((t) => ({ slug: t.slug, title: t.title }));
  const signedIn = Boolean(profile);
  const isSteward = profile?.role === "steward" || profile?.role === "admin";
  const canManageNotes = (r: { authorHandle?: string }) =>
    isSteward || (Boolean(profile) && profile!.handle === r.authorHandle);
  const offerHref = `/render/${p.slug}?arr=${arrangement}&entry=${passage}`;

  // Previous / next within the arrangement — shown right under the reading text.
  const passageNav = (
    <nav className="ui mt-10 flex items-stretch justify-between gap-4 border-t border-line/70 pt-6 text-sm">
      {previous ? (
        <Link
          href={`/read/${previous.arrangementSlug}/${previous.passageSlug}`}
          className="group flex max-w-[40%] flex-col text-left transition-colors hover:text-ink"
        >
          <span className="text-xs uppercase tracking-wider text-ink-faint">← Previous</span>
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
          <span className="text-xs uppercase tracking-wider text-ink-faint">Next →</span>
          <span className="mt-1 font-serif text-base text-ink-soft group-hover:text-ink">
            {next.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );

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
      label: r.author,
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
      ) : null}

      {compareOn && passageNav}

      {!compareOn && (
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

      {/* Choose a rendering (one at a time; side-by-side lives in Compare) */}
      {renderingOptions.length > 1 && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <RenderingPicker
            options={renderingOptions}
            current={selectedKey}
            basePath={path}
          />
          <span className="ui text-xs text-ink-faint">
            {renderingOptions.length} branches · never ranked
          </span>
        </div>
      )}

      {selected ? (
        <section className="mt-6">
          <RenderingArticle
            rendering={selected}
            variant={selected.isGathered ? "gathered" : "alternative"}
            primary
            signedIn={signedIn}
            resonated={selected.id ? resonated.has(selected.id) : false}
            path={path}
            showTenetInfo
            notes={selected.id ? notesByRendering.get(selected.id) : undefined}
            canManageNotes={canManageNotes(selected)}
            allTenets={allTenets}
          />
        </section>
      ) : (
        <p className="mt-12 text-ink-soft">No branch yet for this passage.</p>
      )}

      {passageNav}

      {selected?.isGathered && <GatheredHistory events={history} />}

      {communityRenderings.length === 0 && (
        <p className="ui mt-8 rounded-2xl border border-dashed border-gold-soft/50 bg-glow/30 p-5 text-ink-soft">
          No community branches yet — yours can be the first to sit beside this
          telling.
        </p>
      )}

      <div className="ui mt-8 rounded-2xl border border-gold-soft/40 bg-glow/40 p-6 text-center">
        <p className="font-serif text-lg text-ink">
          Do you read this passage differently?
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          Offer your own plain, pure branch — it joins the others above.
        </p>
        <Link
          href={offerHref}
          className="mt-4 inline-block rounded-full border border-gold-soft/60 px-6 py-2.5 text-sm font-medium text-gold transition-colors hover:bg-glow"
        >
          Offer a branch
        </Link>
      </div>
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
    </div>
  );
}
