import Link from "next/link";
import { getUser } from "@/lib/auth";

// The contribute entry point. Logged-out visitors are invited to sign in first
// (then continue on to the reader, where every passage has "Offer a rendering");
// logged-in members go straight to the reader to choose a passage to render.
const CONTRIBUTE_TARGET = "/read";

export async function AddYourLight({
  className = "",
  children = "Add your light",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const user = await getUser();
  const href = user
    ? CONTRIBUTE_TARGET
    : `/signin?next=${encodeURIComponent(CONTRIBUTE_TARGET)}`;
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
