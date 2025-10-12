import { Pool, QueryConfig, QueryResult } from "pg";
import { env } from "./env.js";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Azure PostgreSQL requires SSL
  ssl: { rejectUnauthorized: false },
});

export function query<T = any>(config: QueryConfig | string, values?: any[]): Promise<QueryResult<T>> {
  if (typeof config === "string") {
    return pool.query<T>(config, values);
  }
  return pool.query<T>(config);
}
