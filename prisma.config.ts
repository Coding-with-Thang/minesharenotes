import 'dotenv/config';
import { definePrismaConfig } from '@prisma/cli-engine';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

function isLocalhost(url: string) {
  try {
    const host = new URL(url).hostname;
    return host === 'localhost' || host === '127.0.0.1';
  } catch {
    return false;
  }
}

function pickConnection() {
  for (const name of ['DATABASE_URL_UNPOOLED', 'DATABASE_URL', 'DIRECT_URL'] as const) {
    const value = process.env[name]?.trim();
    if (!value || isLocalhost(value)) continue;
    return value;
  }
  return undefined;
}

const connection = pickConnection();

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./src/prisma/contract.prisma",
    ...(connection ? { db: { connection } } : {}),
  }),
});
