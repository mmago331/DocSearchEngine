import { Pool } from "pg";

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function q<T = any>(sql: string, values?: any[]) {
  const result = await pool.query(sql, values);
  return result.rows as T[];
}
