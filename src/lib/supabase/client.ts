"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Browser Supabase client for client components (auth UI, resonance taps). */
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
