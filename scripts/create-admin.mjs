import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { withDb } from "../src/prisma/db.ts";

const email = (process.env.ADMIN_EMAIL || "admin@mineshare.local").trim().toLowerCase();
const name = (process.env.ADMIN_NAME || "Admin").trim();
const timezone = process.env.ADMIN_TIMEZONE || "America/Chicago";
const password = process.env.ADMIN_PASSWORD || randomPassword();

function randomPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(16);
  let out = "";
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return out;
}

const passwordHash = await bcrypt.hash(password, 12);
const existing = await withDb((db) =>
  db.orm.public.User.select("id")
    .where((row) => row.email.eq(email))
    .first(),
);

if (existing) {
  await withDb((db) =>
    db.orm.public.User.where({ id: existing.id }).update({
      passwordHash,
      name,
      timezone,
    }),
  );
  console.log("updated");
} else {
  await withDb((db) =>
    db.orm.public.User.create({
      email,
      passwordHash,
      name,
      timezone,
    }),
  );
  console.log("created");
}

console.log(`email=${email}`);
console.log(`password=${password}`);
