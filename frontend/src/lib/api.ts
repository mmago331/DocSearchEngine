import axios, { AxiosHeaders } from "axios";

// Use VITE_API_URL if Azure provides it; otherwise same-origin.
// No localhost fallback.
const baseURL = (import.meta.env?.VITE_API_URL ?? "").trim() || "/";

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    const headers = AxiosHeaders.from(config.headers ?? {});
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

export default api;
