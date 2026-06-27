import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfileByHandle, getMemberRenderings } from "@/lib/data/members";
import { getProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  if (!profile) return {};
  return {
    title: profile.displayName,
    description: `${profile.displayName}'s renderings and the tenets they read by.`,
  };
}

export default async function MemberPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  if (!profile) notFound();

  const [renderings, viewer] = await Promise.all([
    getMemberRenderings(profile.id),
    getProfile(),
  ]);
  const isSelf = viewer?.id === profile.id;

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
      <header>
        <p className="eyebrow">A member of the gathering</p>
        <div className="mt-3 flex items-baseline justify-between gap-4">
          <h1 className="font-serif text-3xl tracking-tight text-ink">
            {profile.displayName}
          </h1>
          {isSelf && (
            <Link
              href="/account"
              className="ui text-sm text-gold transition-colors hover:text-ink"
            >
              Edit profile
            </Link>
          )}
        </div>
        <p className="ui mt-1 text-sm text-ink-faint">@{profile.handle}</p>
        {profile.role !== "member" && (
          <span className="ui mt-3 inline-block rounded-full bg-glow px-3 py-1 text-xs font-medium tracking-wide text-gold">
            {profile.role === "admin" ? "Admin" : "Steward"}
          </span>
        )}
      </header>

      {profile.bio && (
        <p className="mt-6 font-serif text-lg italic leading-relaxed text-ink-soft">
          {profile.bio}
        </p>
      )}

      {(profile.traditions.length > 0 || profile.languages.length > 0) && (
        <dl className="ui mt-6 space-y-2 text-sm text-ink-soft">
          {profile.traditions.length > 0 && (
            <div className="flex gap-2">
              <dt className="text-ink-faint">Traditions:</dt>
              <dd>{profile.traditions.join(", ")}</dd>
            </div>
          )}
          {profile.languages.length > 0 && (
            <div className="flex gap-2">
              <dt className="text-ink-faint">Languages:</dt>
              <dd>{profile.languages.join(", ")}</dd>
            </div>
          )}
        </dl>
      )}

      <section className="mt-12">
        <h2 className="font-serif text-2xl text-ink">
          {isSelf ? "Your" : "Their"} rendering of the book
        </h2>
        {renderings.length > 0 ? (
          <ul className="mt-5 divide-y divide-line/70 overflow-hidden rounded-2xl border border-line bg-card/50">
            {renderings.map((r) => (
              <li key={`${r.movementSlug}/${r.passageSlug}`}>
                <Link
                  href={`/read/${r.movementSlug}/${r.passageSlug}`}
                  className="flex items-baseline justify-between gap-4 px-5 py-4 transition-colors hover:bg-glow/50"
                >
                  <span className="flex flex-col">
                    <span className="font-serif text-lg text-ink">{r.passageTitle}</span>
                    <span className="ui text-xs uppercase tracking-wider text-ink-faint">
                      {r.canonicalRef}
                    </span>
                  </span>
                  {r.isGathered && (
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
            {isSelf
              ? "You haven't offered a rendering yet. Open any passage and add your light."
              : "No renderings offered yet."}
          </p>
        )}
      </section>
    </div>
  );
}
