// frontend/src/lib/api.ts
import axios, { type InternalAxiosRequestConfig } from "axios";

// Same-origin calls only. No baseURL, no localhost, no VITE_*.
const api = axios.create({
  // omit baseURL -> relative URLs use the current origin
  withCredentials: true,
});

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
