"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";

export function AccountMenu({ name }: { name: string }) {
  const pathname = usePathname();
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <details key={pathname} className="account-menu">
      <summary
        className="account-menu-trigger"
        aria-label={`${name} account menu`}
      >
        <span className="topbar-avatar" aria-hidden="true">
          {initials}
        </span>
        <svg
          className="account-menu-caret"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path
            d="M4 6l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="account-menu-panel">
        <Link href="/settings" className="account-menu-item">
          Settings
        </Link>
        <div className="account-menu-separator" />
        <form action={signOutAction}>
          <button type="submit" className="account-menu-item">
            Sign out
          </button>
        </form>
      </div>
    </details>
  );
}
