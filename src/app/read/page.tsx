import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDefaultArrangementSlug } from "@/lib/data/arrangements";

export const dynamic = "force-dynamic";

// Bare /read sends you to the arrangement you last read (cookie), or the default.
export default async function ReadIndex() {
  const cookieStore = await cookies();
  const remembered = cookieStore.get("arrangement")?.value;
  const slug = remembered || (await getDefaultArrangementSlug());
  redirect(`/read/${slug}`);
}
