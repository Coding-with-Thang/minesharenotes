import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { withDb } from "@/src/prisma/db";

const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: SESSION_MS / 1000 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        return withDb(async (db) => {
          const user = await db.orm.public.User.where((row) => row.email.eq(email)).first();
          if (!user) return null;

          const matches = await bcrypt.compare(password, user.passwordHash);
          if (!matches) return null;

          const session = await db.orm.public.Session.create({
            userId: user.id,
            expiresAt: new Date(Date.now() + SESSION_MS).toISOString(),
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            sessionId: session.id,
          };
        });
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.userId = user.id;
      if (typeof user?.sessionId === "string") token.sessionId = user.sessionId;
      return token;
    },
    session({ session, token }) {
      if (typeof token.userId === "string") session.user.id = token.userId;
      if (typeof token.sessionId === "string") session.sessionId = token.sessionId;
      return session;
    },
  },
  events: {
    async signOut(message) {
      const sessionId = "token" in message ? message.token?.sessionId : undefined;
      if (typeof sessionId !== "string") return;
      await withDb(async (db) => {
        await db.orm.public.Session.where({ id: sessionId }).delete();
      }).catch(() => undefined);
    },
  },
});

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  timezone: string;
};

export const getOptionalUser = cache(async (): Promise<CurrentUser | null> => {
  await connection();
  const session = await auth();
  const userId = session?.user?.id;
  const sessionId = session?.sessionId;
  if (!userId || !sessionId) return null;

  return withDb(async (db) => {
    const stored = await db.orm.public.Session.where({ id: sessionId }).first();
    if (!stored || stored.userId !== userId) return null;
    if (new Date(stored.expiresAt).getTime() <= Date.now()) {
      await db.orm.public.Session.where({ id: stored.id }).delete();
      return null;
    }

    const user = await db.orm.public.User.select("id", "email", "name", "timezone")
      .where({ id: stored.userId })
      .first();
    return user;
  });
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getOptionalUser();
  if (!user) redirect("/login");
  return user;
}
