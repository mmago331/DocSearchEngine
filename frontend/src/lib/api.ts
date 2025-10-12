import axios, { type InternalAxiosRequestConfig } from "axios";

// Prefer an explicit env var; otherwise use same-origin (the website you deployed)
const base =
  (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) ||
  (typeof window !== "undefined" ? "/" : "/");

const api = axios.create({ baseURL: base });

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");
  if (token) {
    const headers: any = config.headers ?? {};
    if (typeof headers.set === "function") {
      headers.set("Authorization", `Bearer ${token}`);
    } else {
      headers["Authorization"] = `Bearer ${token}`;
    }
    config.headers = headers;
  }
  return config;
});

export default api;
