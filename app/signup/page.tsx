import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getOptionalUser } from "@/lib/auth";

export const instant = false;

export default function SignupPage() {
  return (
    <Suspense fallback={<p className="text-muted p-8">Loading…</p>}>
      <SignupGate />
    </Suspense>
  );
}

async function SignupGate() {
  const user = await getOptionalUser();
  if (user) redirect("/notes");

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16">
      <p className="text-accent text-sm font-semibold tracking-wide uppercase">Mineshare</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Create an account</h1>
      <p className="text-muted mt-2 mb-6 text-sm">
        A password keeps your notes private. Reminders go to this email.
      </p>
      <div className="border-line bg-card rounded-2xl border p-6">
        <AuthForm mode="signup" />
      </div>
    </div>
  );
}
