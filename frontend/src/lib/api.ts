import axios from "axios";

// Same-origin; cookies carry the session
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export default api;
