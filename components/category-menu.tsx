"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { withNoteFilters } from "@/lib/note-filters";

export function CategoryMenu({
  category,
  query,
  categories,
}: {
  category: string;
  query: string;
  categories: { id: string; name: string }[];
}) {
  const pathname = usePathname();
  const current =
    category === "none"
      ? "Uncategorized"
      : (categories.find((item) => item.id === category)?.name ?? "All notes");

  return (
    <div className="category-dropdown-wrap">
      <details className="category-menu">
        <summary className="category-dropdown-trigger">
          <span className="truncate">{current}</span>
          <span aria-hidden="true">▾</span>
        </summary>
        <div className="category-dropdown-panel">
          <MenuLink href={withNoteFilters(pathname, query, "")} active={category === ""}>
            All notes
          </MenuLink>
          <MenuLink href={withNoteFilters(pathname, query, "none")} active={category === "none"}>
            Uncategorized
          </MenuLink>
          {categories.map((item) => (
            <MenuLink
              key={item.id}
              href={withNoteFilters(pathname, query, item.id)}
              active={category === item.id}
            >
              {item.name}
            </MenuLink>
          ))}
          <Link
            href="/settings"
            className="category-manage-link"
          >
            Manage categories
          </Link>
        </div>
      </details>
    </div>
  );
}

function MenuLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`block truncate rounded-lg px-3 py-2 text-sm ${
        active ? "bg-accent text-white" : "hover:bg-paper"
      }`}
    >
      {children}
    </Link>
  );
}
