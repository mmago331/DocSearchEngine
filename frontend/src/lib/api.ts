// frontend/src/lib/api.ts
import axios from "axios";

/**
 * Same-origin client: we do NOT set baseURL.
 * Every call uses a relative path (e.g. "/auth/login", "/api/search").
 * This matches how the proxy app works on Azure App Service.
 */
export const api = axios.create({
  // no baseURL — use same-origin
  withCredentials: true,
  headers: {
    "X-Requested-With": "fetch"
  },
  // Optional: small safety net for very slow calls
  timeout: 30000
});

// Small helper wrappers (optional, keep if existing code imports these)
export const get  = <T = any>(url: string, config?: any) => api.get<T>(url, config);
export const post = <T = any>(url: string, data?: any, config?: any) => api.post<T>(url, data, config);
export const del  = <T = any>(url: string, config?: any) => api.delete<T>(url, config);
export default api;
