import { Pool } from "pg";

const connectionString = process.env.PG_URL;
if (!connectionString) {
  throw new Error("PG_URL is not set");
}

export const pool = new Pool({
  connectionString,
  ssl: /sslmode=require/i.test(connectionString)
    ? { rejectUnauthorized: false }
    : undefined,
});

pool.on("error", (err) => {
  console.error("Unexpected database error", err);
});

export async function ensureDbReady(): Promise<void> {
  await pool.query("select 1");
}
