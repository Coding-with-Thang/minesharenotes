import { spawnSync } from "node:child_process";
import path from "node:path";
import "dotenv/config";

const names = [
  "DATABASE_URL_UNPOOLED",
  "DATABASE_URL",
  "DIRECT_URL",
  "AUTH_SECRET",
  "CRON_SECRET",
];

for (const name of names) {
  const value = process.env[name];
  console.log(`${name}: ${value && value.trim() ? "visible" : "not visible"}`);
}

function isLocalhost(url) {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

function pickConnection() {
  for (const name of ["DATABASE_URL_UNPOOLED", "DATABASE_URL", "DIRECT_URL"]) {
    const value = process.env[name]?.trim();
    if (!value || isLocalhost(value)) continue;
    return value;
  }
  return "";
}

const connection = pickConnection();

if (!connection) {
  if (process.env.VERCEL) {
    console.error(
      "No database URL is visible during this Vercel build. Add DATABASE_URL and DATABASE_URL_UNPOOLED for Production (Build + Runtime).",
    );
    process.exit(1);
  }
  console.log("No database URL is visible during this build, so schema migration was skipped.");
  process.exit(0);
}

const prismaCli = path.join(process.cwd(), "node_modules", "prisma", "dist", "prisma.js");
const result = spawnSync(process.execPath, [prismaCli, "db", "migrate", "--db", connection], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
