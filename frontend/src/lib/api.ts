import axios from "axios";

// Same-origin API calls in all environments.
// No Vite envs, no localhost defaults.
export const api = axios.create({
  baseURL: "",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Optional: attach bearer token if your app still stores one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
