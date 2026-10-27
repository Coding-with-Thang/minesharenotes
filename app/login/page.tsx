import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getOptionalUser } from "@/lib/auth";

export const instant = false;

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-muted p-8">Loading…</p>}>
      <LoginGate />
    </Suspense>
  );
}

async function LoginGate() {
  const user = await getOptionalUser();
  if (user) redirect("/notes");

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16">
      <p className="text-accent text-sm font-semibold tracking-wide uppercase">Mineshare</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Sign in</h1>
      <p className="text-muted mt-2 mb-6 text-sm">
        Your notes and tasks stay with your account on every device.
      </p>
      <div className="border-line bg-card rounded-2xl border p-6">
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
