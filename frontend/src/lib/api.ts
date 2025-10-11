import axios, { type InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000"
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
