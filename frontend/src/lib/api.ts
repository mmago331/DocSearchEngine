// frontend/src/lib/api.ts
import axios, { type InternalAxiosRequestConfig } from "axios";

/**
 * Always use same-origin so requests go to the site that served this page.
 * No environment variables. No localhost.
 */
const api = axios.create(); // no baseURL => relative paths use same-origin

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");
  if (token) {
    const headers: any = config.headers ?? {};
    if (typeof headers.set === "function") headers.set("Authorization", `Bearer ${token}`);
    else headers["Authorization"] = `Bearer ${token}`;
    config.headers = headers;
  }
  return config;
});

export default api;
