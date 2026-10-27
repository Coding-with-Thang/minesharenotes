"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, signup, type AuthState } from "@/app/actions/auth";

const initial: AuthState = {};

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? login : signup;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="grid gap-4">
      {mode === "signup" ? (
        <label className="grid gap-1 text-sm font-medium">
          Name
          <input name="name" autoComplete="name" required className="field" />
          {state.errors?.name ? <span className="text-danger text-sm">{state.errors.name}</span> : null}
        </label>
      ) : null}
      <label className="grid gap-1 text-sm font-medium">
        Email
        <input name="email" type="email" autoComplete="email" required className="field" />
        {state.errors?.email ? <span className="text-danger text-sm">{state.errors.email}</span> : null}
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Password
        <input
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={mode === "signup" ? 8 : undefined}
          className="field"
        />
        {state.errors?.password ? (
          <span className="text-danger text-sm">{state.errors.password}</span>
        ) : null}
      </label>
      {mode === "signup" ? <TimezoneInput /> : null}
      {state.message ? <p className="text-danger text-sm">{state.message}</p> : null}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
      <p className="text-muted text-sm">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/signup" className="text-accent font-medium">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-accent font-medium">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

function TimezoneInput() {
  const timezone =
    typeof Intl === "undefined" ? "UTC" : Intl.DateTimeFormat().resolvedOptions().timeZone;

  return <input type="hidden" name="timezone" value={timezone || "UTC"} />;
}
