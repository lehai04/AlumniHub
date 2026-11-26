"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { contentMenu, operationsMenu } from "./navigation";

function matches(pathname: string, href: string) {
  return (
    pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`))
  );
}

export function CmsNavigation({ reviewer }: { reviewer: boolean }) {
  const pathname = usePathname();
  const sections = reviewer
    ? [
        {
          title: "Nội dung website",
          links: contentMenu.filter(({ href }) => href === "/admin/services"),
        },
      ]
    : [
        {
          title: "Nội dung website",
          links: [
            ...contentMenu,
            {
              href: "/admin#website-pages",
              label: "Các trang công khai",
              also: "/admin/pages",
            },
          ],
        },
        { title: "Nghiệp vụ", links: operationsMenu },
      ];
  return (
    <nav className="cms-nav" aria-label="Điều hướng quản trị">
      <Link
        href="/admin"
        aria-current={pathname === "/admin" ? "page" : undefined}
      >
        Tổng quan
      </Link>
      {sections.map(({ title, links }) => (
        <div className="cms-nav-group" key={title}>
          <p>{title}</p>
          {links.map(({ href, label, ...entry }) => {
            const active =
              matches(pathname, href) ||
              ("also" in entry &&
                typeof entry.also === "string" &&
                matches(pathname, entry.also));
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
        </div>
      ))}
    </nav>
  );
}
