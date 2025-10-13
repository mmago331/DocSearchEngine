import { api } from "./api";

export type User = { email: string } | null;

export async function getMe(): Promise<User> {
  try {
    const { data } = await api.get<{ user?: User }>("/auth/me");
    return data?.user ?? null;
  } catch (error: any) {
    if (error?.response?.status === 401) return null;
    return null;
  }
}

export async function logout() {
  await api.post("/auth/logout");
  localStorage.removeItem("token");
}
