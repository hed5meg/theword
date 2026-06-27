import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/ThemeToggle";
import { updateProfile } from "./actions";

/** Read the email-notification preference gracefully (defaults on). */
async function getEmailPref(userId: string): Promise<boolean> {
  try {
    const sb = await createServerSupabase();
    const { data } = await sb
      .from("profiles")
      .select("email_notifications")
      .eq("id", userId)
      .maybeSingle();
    return data?.email_notifications ?? true;
  } catch {
    return true;
  }
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Your profile" };

const ERRORS: Record<string, string> = {
  required: "A display name and handle are both needed.",
  handle: "That handle is already taken — try another.",
  save: "Something went wrong saving. Please try again.",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/signin?next=/account");
  const { error } = await searchParams;
  const emailOn = await getEmailPref(profile.id);

  return (
    <div className="mx-auto max-w-md px-5 py-14 sm:px-8">
      <header>
        <p className="eyebrow">Your place at the table</p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight text-ink">
          Your profile
        </h1>
        <p className="mt-2 text-ink-soft">
          A light touch — share as much or as little as you like.
        </p>
      </header>

      {error && ERRORS[error] && (
        <p className="ui mt-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {ERRORS[error]}
        </p>
      )}

      <form action={updateProfile} className="ui mt-8 space-y-5">
        <Field label="Display name" name="display_name" defaultValue={profile.displayName} required />
        <Field label="Handle" name="handle" defaultValue={profile.handle} required prefix="@" />
        <div>
          <label htmlFor="bio" className="block text-sm text-ink-soft">
            Why you&rsquo;re here
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            defaultValue={profile.bio ?? ""}
            placeholder="A sentence about what draws you to this work."
            className="mt-1.5 w-full rounded-xl border border-line bg-card px-4 py-3 text-ink outline-none focus:border-gold-soft"
          />
        </div>
        <Field
          label="Traditions"
          name="traditions"
          defaultValue={profile.traditions.join(", ")}
          hint="Comma-separated, optional."
        />
        <Field
          label="Languages"
          name="languages"
          defaultValue={profile.languages.join(", ")}
          hint="Comma-separated, optional."
        />
        <label className="flex items-start gap-3 rounded-xl border border-line bg-card/50 px-4 py-3 text-sm text-ink-soft">
          <input
            type="checkbox"
            name="email_notifications"
            defaultChecked={emailOn}
            className="mt-0.5 accent-[var(--color-gold)]"
          />
          <span>
            Email me gentle notifications — when a note or reply lands on my
            rendering, or one of my notes is tended. No nagging; turn off anytime.
          </span>
        </label>
        <button
          type="submit"
          className="w-full rounded-full bg-ink px-6 py-3 text-sm font-medium text-parchment transition-opacity hover:opacity-90"
        >
          Save
        </button>
      </form>

      <section className="mt-10 border-t border-line/70 pt-8">
        <h2 className="font-serif text-xl text-ink">Appearance</h2>
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="text-sm text-ink-soft">
            Light, dark, or follow your device.
          </p>
          <ThemeToggle />
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  prefix,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  prefix?: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm text-ink-soft">
        {label}
      </label>
      <div className="mt-1.5 flex items-center rounded-xl border border-line bg-card focus-within:border-gold-soft">
        {prefix && <span className="pl-4 text-ink-faint">{prefix}</span>}
        <input
          id={name}
          name={name}
          required={required}
          defaultValue={defaultValue}
          className="w-full bg-transparent px-4 py-3 text-ink outline-none"
        />
      </div>
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}
