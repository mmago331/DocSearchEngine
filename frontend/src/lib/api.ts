import axios, { type InternalAxiosRequestConfig } from "axios";

// Same-origin by default; optional VITE_API_URL can override in non-prod cases.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/",
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");
  if (token) {
    const headers: any = config.headers ?? {};
    if (typeof headers.set === "function") {
      headers.set("Authorization", `Bearer ${token}`);
    } else {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
    config.headers = headers;
  }
  return config;
});

export { api };
