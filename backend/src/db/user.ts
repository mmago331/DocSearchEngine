import { query } from "../lib/pool.js";

export type DbUser = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
};

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const res = await query<DbUser>("SELECT * FROM users WHERE email=$1", [email.toLowerCase()]);
  return res.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<DbUser | null> {
  const res = await query<DbUser>("SELECT * FROM users WHERE id=$1", [id]);
  return res.rows[0] ?? null;
}

export async function createUser(email: string, passwordHash: string): Promise<DbUser> {
  const res = await query<DbUser>(
    "INSERT INTO users(email, password_hash) VALUES($1,$2) RETURNING *",
    [email.toLowerCase(), passwordHash]
  );
  return res.rows[0];
}
