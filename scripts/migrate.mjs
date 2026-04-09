// Runs all SQL files in ./drizzle in lexical order against DATABASE_URL.
// Idempotent: tracks applied migrations in a _migrations table.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

await sql`CREATE TABLE IF NOT EXISTS _migrations (
  name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
)`;

const dir = path.resolve("drizzle");
const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

for (const file of files) {
  const [{ exists } = { exists: false }] = await sql`
    SELECT 1 AS exists FROM _migrations WHERE name = ${file} LIMIT 1
  `;
  if (exists) {
    console.log(`· skip ${file}`);
    continue;
  }
  const body = await readFile(path.join(dir, file), "utf8");
  console.log(`→ apply ${file}`);
  await sql.unsafe(body);
  await sql`INSERT INTO _migrations (name) VALUES (${file})`;
}

console.log("migrations complete");
await sql.end();
