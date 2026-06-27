import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./admin";

/**
 * Cookie-bound Supabase client for the signed-in user. Use in server
 * components, route handlers, and server actions. Reads the session from
 * cookies; middleware keeps it fresh.
 */
export async function createServerSupabase(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — cookies are read-only here.
          // Middleware refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}
