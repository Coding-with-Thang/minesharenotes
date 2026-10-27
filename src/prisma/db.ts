import "dotenv/config";
import postgresServerless from "@prisma/orm-postgres/serverless";
import { contractFromJson } from "@prisma/orm-postgres/static";
import type { Contract } from "./contract.d";
import contractJson from "./contract.json" with { type: "json" };

export const contract = contractFromJson<Contract>(contractJson);

const postgres = postgresServerless({ contract });

type Database = Awaited<ReturnType<typeof postgres.connect>>;

export async function withDb<T>(run: (db: Database) => PromiseLike<T>): Promise<T> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const db = await postgres.connect({ url });
  try {
    return await run(db);
  } finally {
    await db.close();
  }
}
