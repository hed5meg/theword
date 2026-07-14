"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * A header nav link that lights up gold when you're on its section, so the menu
 * shows where you are. Matches the exact path or any path beneath it (e.g.
 * /read/… highlights "Unseal").
 */
export function NavLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`${className} transition-colors ${
        active ? "text-gold" : "text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
