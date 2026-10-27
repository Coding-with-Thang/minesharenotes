"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { withDb } from "@/src/prisma/db";
import { isValidTimeZone } from "@/lib/time";
import {
  normalizeEmail,
  readText,
  validateLogin,
  validateSignup,
  type FieldErrors,
} from "@/lib/validators";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requireUser } from "@/lib/auth";

export type AuthState = {
  errors?: FieldErrors;
  message?: string;
};

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const input = {
    name: readText(formData.get("name")),
    email: normalizeEmail(formData.get("email")),
    password: String(formData.get("password") ?? ""),
    timezone: readText(formData.get("timezone")) || "UTC",
  };
  const errors = validateSignup(input);
  if (Object.keys(errors).length > 0) return { errors };

  const existing = await withDb((db) =>
    db.orm.public.User.select("id")
      .where((row) => row.email.eq(input.email))
      .first(),
  );
  if (existing) {
    return { errors: { email: "An account with that email already exists." } };
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  await withDb((db) =>
    db.orm.public.User.create({
      email: input.email,
      passwordHash,
      name: input.name,
      timezone: input.timezone,
    }),
  );

  try {
    await signIn("credentials", {
      email: input.email,
      password: input.password,
      redirectTo: "/notes",
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) {
      return { message: "Account created, but sign-in failed. Try logging in." };
    }
    throw error;
  }

  return {};
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const input = {
    email: normalizeEmail(formData.get("email")),
    password: String(formData.get("password") ?? ""),
  };
  const errors = validateLogin(input);
  if (Object.keys(errors).length > 0) return { errors };

  try {
    await signIn("credentials", {
      email: input.email,
      password: input.password,
      redirectTo: "/notes",
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) {
      return { message: "Email or password is incorrect." };
    }
    throw error;
  }

  return {};
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function updateTimezone(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const user = await requireUser();
  const timezone = readText(formData.get("timezone"));
  if (!isValidTimeZone(timezone)) {
    return { errors: { timezone: "Choose a valid timezone." } };
  }

  await withDb((db) =>
    db.orm.public.User.where({ id: user.id }).update({ timezone }),
  );
  return { message: "Timezone saved." };
}
