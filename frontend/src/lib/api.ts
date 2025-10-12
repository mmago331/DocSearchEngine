import axios from "axios";

// Use Azure VITE_API_URL if set, otherwise same-origin.
// No localhost fallback.
const baseURL = (import.meta.env?.VITE_API_URL ?? "").trim() || "/";

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    if (!config.headers) {
      config.headers = {} as any;
    }
    (config.headers as any)["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export default api;
