import Link from "next/link";
import type { Metadata } from "next";
import { getProfile } from "@/lib/auth";
import { getOpenFlags } from "@/lib/data/flags";
import {
  resolveFlag,
  setReflectionHidden,
  setRenderingStatus,
} from "@/lib/actions/flags";
import { setMemberRole } from "@/lib/actions/stewards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Steward" };

export default async function StewardPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const profile = await getProfile();
  const isSteward = profile?.role === "steward" || profile?.role === "admin";

  if (!isSteward) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center sm:px-8">
        <h1 className="font-serif text-2xl text-ink">Tended by stewards</h1>
        <p className="mt-3 text-ink-soft">
          This is the steward&rsquo;s table. Stewards are invited gently, over time.
          If you long to help tend the work, keep gathering — and reach out.
        </p>
        <Link href="/read" className="ui mt-6 inline-block text-gold hover:text-ink">
          Back to the reading
        </Link>
      </div>
    );
  }

  const [flags, { role }] = await Promise.all([getOpenFlags(), searchParams]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
      <header>
        <p className="eyebrow">Tending the work</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink">Steward</h1>
        <p className="mt-2 text-ink-soft">
          Keep the culture loving. Hold every offering, and every person, gently.
        </p>
      </header>

      <section className="mt-12">
        <h2 className="font-serif text-2xl text-ink">
          Flags awaiting care{flags.length > 0 && ` (${flags.length})`}
        </h2>
        {flags.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-line bg-card/40 p-6 text-ink-soft">
            Nothing flagged. All is calm.
          </p>
        ) : (
          <ul className="mt-5 space-y-4">
            {flags.map((f) => (
              <li key={f.id} className="rounded-2xl border border-line bg-card/50 p-5">
                <div className="ui flex flex-wrap items-center gap-2 text-xs text-ink-faint">
                  <span className="rounded-full bg-parchment-deep px-2.5 py-0.5 uppercase tracking-wider">
                    {f.targetType}
                  </span>
                  {f.reporterName && <span>flagged by {f.reporterName}</span>}
                </div>
                <p className="mt-2 text-ink">
                  {f.targetHref ? (
                    <Link href={f.targetHref} className="underline-offset-2 hover:underline">
                      {f.targetSnippet}
                    </Link>
                  ) : (
                    f.targetSnippet
                  )}
                </p>
                {f.reason && (
                  <p className="mt-1 text-sm italic text-ink-soft">“{f.reason}”</p>
                )}

                <div className="ui mt-4 flex flex-wrap gap-2">
                  <Action action={resolveFlag} fields={{ flag_id: f.id }} label="Mark resolved" primary />

                  {f.targetType === "reflection" && (
                    <Action
                      action={setReflectionHidden}
                      fields={{
                        reflection_id: f.targetId,
                        hidden: f.reflectionHidden ? "false" : "true",
                      }}
                      label={f.reflectionHidden ? "Restore reflection" : "Hide reflection"}
                    />
                  )}

                  {f.targetType === "rendering" && (
                    <Action
                      action={setRenderingStatus}
                      fields={{
                        rendering_id: f.targetId,
                        status: f.renderingStatus === "archived" ? "submitted" : "archived",
                      }}
                      label={
                        f.renderingStatus === "archived"
                          ? "Restore rendering"
                          : "Archive rendering"
                      }
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {profile.role === "admin" && (
        <section className="mt-16 rounded-2xl border border-gold-soft/40 bg-glow/30 p-6">
          <h2 className="font-serif text-2xl text-ink">Invite a steward</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Stewardship is earned gently. Grant it by handle when someone is ready.
          </p>
          {role === "ok" && (
            <p className="ui mt-3 text-sm text-green-700">Role updated.</p>
          )}
          {role === "error" && (
            <p className="ui mt-3 text-sm text-red-700">
              Couldn&rsquo;t update — check the handle.
            </p>
          )}
          <form action={setMemberRole} className="ui mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              name="handle"
              required
              placeholder="member-handle"
              className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:border-gold-soft"
            />
            <select
              name="role"
              defaultValue="steward"
              className="rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:border-gold-soft"
            >
              <option value="member">member</option>
              <option value="steward">steward</option>
              <option value="admin">admin</option>
            </select>
            <button
              type="submit"
              className="shrink-0 rounded-full bg-ink px-5 py-2 text-sm font-medium text-parchment transition-opacity hover:opacity-90"
            >
              Set role
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

function Action({
  action,
  fields,
  label,
  primary,
}: {
  action: (formData: FormData) => void;
  fields: Record<string, string>;
  label: string;
  primary?: boolean;
}) {
  return (
    <form action={action}>
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button
        type="submit"
        className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
          primary
            ? "bg-ink text-parchment hover:opacity-90"
            : "border border-line text-ink-soft hover:border-gold-soft/50 hover:text-ink"
        }`}
      >
        {label}
      </button>
    </form>
  );
}
