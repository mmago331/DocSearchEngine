import axios from "axios";
import type { AxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000"
});

api.interceptors.request.use((config: AxiosRequestConfig) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = { ...(config.headers ?? {}), Authorization: `Bearer ${token}` };
  }
  return config;
});

export default api;
