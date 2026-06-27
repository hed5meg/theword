"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function SignInForm({ next = "/read" }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");
    const supabase = createBrowserSupabase();
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-gold-soft/40 bg-glow/40 p-6 text-center">
        <p className="font-serif text-xl text-ink">Check your email</p>
        <p className="mt-2 text-ink-soft">
          We&rsquo;ve sent a gentle link to <strong>{email}</strong>. Open it on this
          device to come in. You can close this tab.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="ui space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm text-ink-soft">
          Your email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1.5 w-full rounded-xl border border-line bg-card px-4 py-3 text-ink outline-none focus:border-gold-soft"
        />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-full bg-ink px-6 py-3 text-sm font-medium text-parchment transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send me a magic link"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-700">{message}</p>
      )}
      <p className="text-xs text-ink-faint">
        No passwords. We&rsquo;ll email you a one-time link to sign in. By joining you
        agree to contribute in love.
      </p>
    </form>
  );
}
