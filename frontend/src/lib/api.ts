import axios, { type InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  // Use explicit env var when present; otherwise same-origin
  baseURL: (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) || "/"
});

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
