import Link from "next/link";
import { AccountMenu } from "@/components/account-menu";
import type { CurrentUser } from "@/lib/auth";

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell-root">
      <header className="topbar">
        <Link href="/notes" className="topbar-logo">
          Mineshare
        </Link>
        <nav className="topbar-nav">
          <Link href="/admin" className="topbar-nav-link">
            Admin
          </Link>
          <AccountMenu name={user.name} />
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
