import axios from "axios";

/**
 * Same-origin Axios client.
 * No baseURL. All calls use relative paths (e.g. "/auth/login", "/api/search").
 */
const api = axios.create({
  // baseURL intentionally omitted -> same-origin
  withCredentials: true, // include cookies if server sets any (sessions)
});

// Optional: attach bearer token if your app still stores one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
