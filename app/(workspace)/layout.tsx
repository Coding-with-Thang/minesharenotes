import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export const instant = false;

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="text-muted p-8">Loading your workspace…</p>}>
      <WorkspaceFrame>{children}</WorkspaceFrame>
    </Suspense>
  );
}

async function WorkspaceFrame({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <AppShell user={user}>{children}</AppShell>;
}
