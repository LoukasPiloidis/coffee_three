import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Keep a single pool across hot reloads in dev
declare global {
  var __pgClient: ReturnType<typeof postgres> | undefined;
}

const client = global.__pgClient ?? postgres(connectionString, { max: 10 });
if (process.env.NODE_ENV !== "production") global.__pgClient = client;

export const db = drizzle(client, { schema });
export { schema };
