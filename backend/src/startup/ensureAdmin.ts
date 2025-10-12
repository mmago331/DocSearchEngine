import { findUserByEmail, createUser } from "../db/user";
import { hashPassword } from "../lib/crypto";
import { env } from "../lib/env";

export default async function ensureAdmin() {
  const email = env.ADMIN_EMAIL;
  const password = env.ADMIN_PASSWORD;

  if (!email || !password) {
    // Nothing to seed; exit silently
    return;
  }

  const existing = await findUserByEmail(email);
  if (existing) return;

  const passwordHash = await hashPassword(password);
  await createUser(email, passwordHash);
  console.log(`[startup] Seeded admin user: ${email}`);
}
