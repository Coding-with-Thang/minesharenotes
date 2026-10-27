import "server-only";
import "dotenv/config";
import { attachDatabasePool } from "@vercel/functions";
import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
import { Pool } from "pg";
import type { Contract } from "./contract.d";
import contractJson from "./contract.json" with { type: "json" };

export const contract = contractFromJson<Contract>(contractJson);

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

const pool = new Pool({ connectionString: databaseUrl() });
attachDatabasePool(pool);

const db = postgres({ contract, pg: pool });

type Database = typeof db;

export async function withDb<T>(run: (db: Database) => PromiseLike<T>): Promise<T> {
  return await run(db);
}
