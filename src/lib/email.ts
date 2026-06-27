import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

// Transactional email via Resend. Everything no-ops gracefully when
// RESEND_API_KEY is absent, so the app works fully before email is wired.

const FROM =
  process.env.NOTIFICATIONS_FROM ??
  "The Unsealed Revelation <notifications@theword.love>";

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

/** Look up a member's email + email preference via the service-role client. */
async function recipient(
  profileId: string,
): Promise<{ email: string } | null> {
  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("email_notifications")
      .eq("id", profileId)
      .maybeSingle();
    if (!profile || profile.email_notifications === false) return null;
    const { data } = await admin.auth.admin.getUserById(profileId);
    const email = data.user?.email;
    return email ? { email } : null;
  } catch {
    return null;
  }
}

/** Send a gentle notification to a member, honoring their preference. Never throws. */
export async function notify(
  profileId: string | null | undefined,
  subject: string,
  body: string,
  ctaUrl?: string,
): Promise<void> {
  if (!profileId) return;
  const resend = client();
  if (!resend) return; // email not configured yet
  const to = await recipient(profileId);
  if (!to) return; // no email or opted out

  const link = ctaUrl
    ? `\n\n${ctaUrl.startsWith("http") ? ctaUrl : `https://theword.love${ctaUrl}`}`
    : "";
  try {
    await resend.emails.send({
      from: FROM,
      to: to.email,
      subject,
      text: `${body}${link}\n\n— The Unsealed Revelation\nNothing is final. The gathering is the work.\n\n(You can turn these emails off in your profile at https://theword.love/account.)`,
    });
  } catch {
    // Never let email failures affect the request.
  }
}
