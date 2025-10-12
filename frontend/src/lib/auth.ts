import { api } from "./api";

export type User = { email: string } | null;

export async function getMe(): Promise<User> {
  const r = await api("/auth/me");
  const j = await r.json().catch(() => ({}));
  return j?.user ?? null;
}

export async function login(email: string, password: string) {
  const r = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  if (!r.ok) throw new Error("login_failed");
}

export async function logout() {
  await api("/auth/logout", { method: "POST" });
}
