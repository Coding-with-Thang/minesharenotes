import EmbeddedPostgres from "embedded-postgres";

const pg = new EmbeddedPostgres({
  databaseDir: ".data/pg",
  user: "postgres",
  password: "postgres",
  port: 5432,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});

try {
  await pg.initialise();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!/already|exist/i.test(message)) throw error;
}

await pg.start();

try {
  await pg.createDatabase("mineshare");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!/already|exist/i.test(message)) throw error;
}

console.log("ready postgresql://postgres:postgres@127.0.0.1:5432/mineshare");
await new Promise(() => {});
