"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { publicNavigation } from "../../lib/public-pages";

export function PublicNav() {
  const pathname = usePathname();
  return (
    <nav className="main-nav" aria-label="Điều hướng chính">
      {publicNavigation.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
