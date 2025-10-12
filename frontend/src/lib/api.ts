import axios from "axios";

/**
 * In development, allow VITE_API_URL (or fallback to localhost).
 * In production (the built site on Azure), use relative URLs so requests
 * go to the same origin that served the frontend (avoids CSP issues).
 */
const isDev = import.meta.env.MODE === "development";

const baseURL = isDev
  ? (import.meta.env.VITE_API_URL || "http://localhost:4000")
  : ""; // same-origin in production

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
